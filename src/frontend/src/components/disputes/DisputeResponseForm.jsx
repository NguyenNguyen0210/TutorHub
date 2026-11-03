import React, { useRef, useState } from 'react';
import disputeService from '@/services/dispute.service';
import { Textarea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { EVIDENCE_ACCEPT, EVIDENCE_HINT, evidenceValidationMessage } from '@/utils/disputeEvidence';
import { useToast } from '@/components/ui/Toast';

export default function DisputeResponseForm({ disputeId, onSaved, uploadFailed }) {
  const toast = useToast();
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [savedResponseId, setSavedResponseId] = useState(null);
  const [sent, setSent] = useState(false);
  const request = useRef(null);
  const submitting = useRef(false);
  const input = useRef(null);
  const submit = async event => {
    event.preventDefault();
    if (submitting.current) return;
    const text = content.trim();
    if (!text && !file) { setError('Vui lòng nhập giải trình hoặc chọn tệp bằng chứng.'); return; }
    if (text && (text.length < 20 || text.length > 10000)) { setError('Nội dung giải trình cần từ 20 đến 10.000 ký tự.'); return; }
    if (file) { const invalid = evidenceValidationMessage(file); if (invalid) { setError(invalid); return; } }
    submitting.current = true; setBusy(true); setError('');
    let responseId = savedResponseId;
    try {
      if (text && !responseId) {
        if (!request.current || request.current.content !== text) request.current = { submissionId: crypto.randomUUID(), content: text };
        const response = await disputeService.submitResponse(disputeId, request.current);
        responseId = response.id;
        setSavedResponseId(responseId);
      }
      if (file) await disputeService.uploadEvidence(disputeId, file, responseId);
      setContent(''); setFile(null); setSavedResponseId(null); setSent(true); request.current = null;
      if (input.current) input.current.value = '';
      toast.success(text ? 'Đã gửi giải trình.' : 'Đã bổ sung bằng chứng.');
      await onSaved();
    } catch (failure) {
      setError(responseId ? 'Giải trình đã được lưu, nhưng tệp đính kèm chưa gửi thành công. Bạn có thể gửi lại tệp bên dưới.'
        : failure?.status === 409 ? 'Khiếu nại có thể đã kết thúc. Vui lòng tải lại để kiểm tra trước khi gửi tiếp.' : 'Chưa thể gửi phản hồi. Nội dung được giữ lại để bạn thử lại.');
      if (responseId) await onSaved();
    } finally { submitting.current = false; setBusy(false); }
  };
  return <section id="dispute-response" aria-labelledby="response-title" className="scroll-mt-24 space-y-4">
    <div><h2 id="response-title" className="text-lg font-semibold text-fg">Gửi giải trình & bằng chứng</h2><p className="mt-2 text-sm leading-relaxed text-fg-secondary">Giải thích sự việc từ góc nhìn của bạn. Bạn có thể gửi nội dung, tệp bằng chứng hoặc cả hai; phản hồi sẽ được lưu trong lịch sử để các bên và TutorHub xem xét.</p></div>
    {uploadFailed && !sent && <p role="alert" className="rounded-lg bg-holding-subtle p-3 text-sm text-holding-strong">Khiếu nại đã được tạo nhưng tệp đính kèm chưa tải lên thành công. Vui lòng chọn lại tệp bên dưới.</p>}
    <form onSubmit={submit} noValidate className="space-y-4">
      <div><label htmlFor="dispute-explanation" className="block text-sm font-semibold text-fg">Nội dung giải trình của bạn</label><Textarea id="dispute-explanation" value={content} rows={6} maxLength={10000} disabled={busy || Boolean(savedResponseId)} aria-describedby="response-hint response-count" onChange={event => { setContent(event.target.value); setError(''); }} placeholder="Mô tả sự việc, nội dung cần làm rõ và các thông tin liên quan đến buổi học…" className="mt-2" /><div className="mt-2 flex flex-wrap justify-between gap-2 text-caption text-fg-secondary"><p id="response-hint">Ít nhất 20 ký tự khi có giải trình.</p><p id="response-count">{content.length.toLocaleString('vi-VN')}/10.000 ký tự</p></div></div>
      <div className="space-y-2"><label htmlFor="dispute-evidence" className="block text-sm font-semibold text-fg">Tệp bằng chứng (không bắt buộc)</label><p id="evidence-help" className="text-caption text-fg-secondary">{EVIDENCE_HINT}</p><input ref={input} id="dispute-evidence" type="file" accept={EVIDENCE_ACCEPT} disabled={busy} aria-describedby="evidence-help" onChange={event => { setFile(event.target.files?.[0] || null); setError(''); }} className="block min-h-11 w-full min-w-0 max-w-full rounded-lg border border-border bg-surface p-2 text-sm text-fg" /></div>
      {error && <p role="alert" className="rounded-lg bg-holding-subtle p-3 text-sm text-holding-strong">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><p className="max-w-md text-caption text-fg-secondary">Phản hồi đã gửi được giữ nguyên để đối chiếu. Bạn có thể gửi bổ sung khi vụ việc còn mở.</p><Button type="submit" loading={busy} disabled={busy || (!content.trim() && !file)} icon={<Icon name="send" size="sm" />}>{savedResponseId ? 'Gửi lại tệp đính kèm' : content.trim() ? 'Gửi giải trình' : 'Gửi bằng chứng'}</Button></div>
    </form>
  </section>;
}
