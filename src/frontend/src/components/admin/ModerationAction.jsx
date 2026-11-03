import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useAuthStore } from '@/store/authStore';
import adminService from '@/services/admin.service';
import { useConfirm } from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';

export default function ModerationAction({ type, targetId, onSaved }) {
  const { role } = useAuthStore();
  const confirm = useConfirm();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');
  const [done, setDone] = useState(false);
  const busy = useRef(false);
  if (role !== 'Admin') return null;
  const act = async () => {
    if (busy.current || done) return;
    busy.current = true; setError('');
    try {
      let note = reason;
      const accepted = await confirm({ title: type === 'review' ? 'Gỡ đánh giá vi phạm?' : 'Ngừng xuất bản gói học?',
        content: type === 'review' ? 'Đánh giá sẽ không còn hiển thị công khai. Nội dung và lý do kiểm duyệt được giữ lại để đối soát.' : 'Gói học sẽ không còn nhận lượt mua mới. Các hợp đồng đã mua được giữ nguyên.',
        danger: true, confirmText: 'Xác nhận kiểm duyệt', requireReason: type === 'review', minReasonLength: 5, maxReasonLength: 500,
        reasonLabel: 'Lý do gỡ đánh giá', defaultReason: reason, onConfirmReason: value => { note = value; setReason(value); } });
      if (!accepted) return;
      setSaving(true);
      if (type === 'review') await adminService.removeReview(targetId, note); else await adminService.forceUnpublishService(targetId);
      setDone(true); await onSaved();
    } catch (err) { setError(err?.status === 409 ? 'Nội dung đã thay đổi trạng thái. Vui lòng tải lại trước khi xử lý.' : 'Chưa hoàn tất kiểm duyệt. Vui lòng kiểm tra lại thông tin.'); }
    finally { busy.current = false; setSaving(false); }
  };
  return <div className="space-y-2">{done ? <p role="status" className="text-sm text-success-strong">Đã xử lý nội dung.</p> : <Button variant="danger-outline" size="sm" loading={saving} disabled={saving} onClick={act}>{type === 'review' ? 'Gỡ đánh giá vi phạm' : 'Ngừng xuất bản gói học'}</Button>}{error && <p role="alert" className="text-sm text-danger-strong">{error}</p>}</div>;
}
ModerationAction.propTypes = { type: PropTypes.oneOf(['review', 'service']).isRequired, targetId: PropTypes.string.isRequired, onSaved: PropTypes.func.isRequired };
