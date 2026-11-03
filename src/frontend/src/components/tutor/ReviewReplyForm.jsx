import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import tutorService from '@/services/tutor.service';
import Button from '@/components/ui/Button';
import { Field, Textarea } from '@/components/ui/Input';

export default function ReviewReplyForm({ review, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [reply, setReply] = useState(review.tutorReply || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  if (review.isRemoved) return null;
  const submit = async event => {
    event.preventDefault();
    if (busy.current || !reply.trim() || reply.length > 2000) return;
    busy.current = true; setSaving(true); setError('');
    try {
      const updated = await tutorService.replyReview(review.id, reply.trim());
      onSaved(updated); setEditing(false);
    } catch (err) { setError(err?.status === 409 ? 'Đánh giá đã thay đổi hoặc bị gỡ. Vui lòng tải lại thông tin.' : 'Chưa gửi được phản hồi. Vui lòng thử lại.'); }
    finally { busy.current = false; setSaving(false); }
  };
  return <div className="mt-4 border-t border-border pt-4">
    {!editing ? <Button variant="outline" size="sm" onClick={() => { setReply(review.tutorReply || ''); setEditing(true); }}>{review.tutorReply ? 'Chỉnh sửa phản hồi' : 'Phản hồi đánh giá'}</Button>
      : <form onSubmit={submit} className="space-y-3"><Field label="Phản hồi của bạn" htmlFor={`reply-${review.id}`} hint="Phản hồi sẽ hiển thị công khai cùng đánh giá, tối đa 2.000 ký tự."><Textarea id={`reply-${review.id}`} rows={4} value={reply} maxLength={2000} disabled={saving} required onChange={e => setReply(e.target.value)} /></Field>{error && <p role="alert" className="text-sm text-danger-strong">{error}</p>}<div className="flex flex-wrap gap-3"><Button type="submit" size="sm" loading={saving} disabled={saving || !reply.trim()}>Lưu phản hồi</Button><Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => setEditing(false)}>Hủy</Button></div></form>}
  </div>;
}
ReviewReplyForm.propTypes = { review: PropTypes.object.isRequired, onSaved: PropTypes.func.isRequired };
