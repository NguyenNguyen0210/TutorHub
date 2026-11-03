import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import reportService from '@/services/report.service';
import Button from '@/components/ui/Button';
import { Modal } from '@/components/ui/Avatar';
import { Field, Textarea } from '@/components/ui/Input';

export default function ReportAction({ type, targetId }) {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  if (!user || !targetId || (type === 'user' && user.id === targetId)) return null;
  const limit = type === 'review' ? 1000 : 2000;
  const close = () => { if (!busy.current) setOpen(false); };
  const submit = async event => {
    event.preventDefault();
    if (busy.current || text.trim().length < 10) return;
    busy.current = true; setSaving(true); setError('');
    try {
      const report = type === 'review' ? await reportService.reportReview(targetId, text.trim()) : await reportService.reportUser(targetId, text.trim());
      if (!report?.id) throw new Error('Missing report ID');
      setResult(report.id); setText('');
    } catch (err) { setError(err?.status === 409 ? 'Bạn đã có báo cáo đang chờ xử lý cho nội dung này. Vui lòng xem lịch sử báo cáo.' : err?.status === 400 ? 'Không thể báo cáo nội dung này. Vui lòng kiểm tra nội dung và đối tượng báo cáo.' : 'Chưa gửi được báo cáo. Vui lòng thử lại.'); }
    finally { busy.current = false; setSaving(false); }
  };
  return <>
    <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>{type === 'review' ? 'Báo cáo đánh giá' : 'Báo cáo hồ sơ'}</Button>
    <Modal open={open} onClose={close} title="Báo cáo vi phạm">{result ? <div className="space-y-4"><p role="status">Đã gửi báo cáo. TutorHub sẽ xem xét nội dung bạn cung cấp.</p><Button as={Link} to={`/app/reports?reportId=${encodeURIComponent(result)}`}>Theo dõi báo cáo</Button><Button variant="ghost" onClick={close}>Đóng</Button></div> : <form onSubmit={submit} className="space-y-4"><p className="text-sm leading-relaxed text-fg-secondary">Mô tả hành vi hoặc nội dung không phù hợp để TutorHub xem xét. Nếu cần xử lý học phí, hãy gửi khiếu nại từ chi tiết buổi học.</p><Field label="Nội dung báo cáo" htmlFor={`report-${type}-${targetId}`} hint={`Từ 10 đến ${limit.toLocaleString('vi-VN')} ký tự`}><Textarea id={`report-${type}-${targetId}`} value={text} maxLength={limit} required disabled={saving} onChange={e => setText(e.target.value)} /></Field>{error && <p role="alert" className="text-sm text-danger-strong">{error}</p>}<div className="flex flex-wrap gap-3"><Button type="submit" loading={saving} disabled={saving || text.trim().length < 10}>Gửi báo cáo</Button><Button type="button" variant="ghost" disabled={saving} onClick={close}>Hủy</Button><Button as={Link} to="/app/reports" variant="ghost" disabled={saving}>Lịch sử báo cáo</Button></div></form>}</Modal>
  </>;
}
ReportAction.propTypes = { type: PropTypes.oneOf(['user', 'review']).isRequired, targetId: PropTypes.string };
