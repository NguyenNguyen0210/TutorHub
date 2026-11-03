import React, { useRef, useState } from 'react';
import disputeService from '@/services/dispute.service';
import { Textarea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { evidenceValidationMessage } from '@/utils/disputeEvidence';
import { formatDateTime } from '@/utils/formatters';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/Dialog';
import DisputeEvidencePicker from './DisputeEvidencePicker';

export default function DisputeResponseForm({ disputeId, onSaved, uploadFailed }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [savedResponseId, setSavedResponseId] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const request = useRef(null);
  const submitting = useRef(false);
  const choose = chosen => {
    const invalid = evidenceValidationMessage(chosen);
    if (invalid) { setError(invalid); return; }
    setFile(chosen); setError('');
  };
  const submit = async event => {
    event.preventDefault();
    if (submitting.current || blocked) return;
    const text = content.trim();
    if (!text && !file) { setError('Nhập giải trình tối thiểu 20 ký tự hoặc đính kèm một tệp bằng chứng.'); return; }
    if (text && (text.length < 20 || text.length > 10000)) { setError('Nội dung giải trình cần từ 20 đến 10.000 ký tự.'); document.getElementById('dispute-explanation')?.focus(); return; }
    if (file) { const invalid = evidenceValidationMessage(file); if (invalid) { setError(invalid); return; } }
    submitting.current = true;
    if (!savedResponseId) {
      const approved = await confirm({
        title: 'Kiểm tra phản hồi trước khi gửi', confirmText: 'Xác nhận gửi', cancelText: 'Tiếp tục chỉnh sửa',
        content: <div className="space-y-4 text-sm text-fg-secondary"><p>Phản hồi đã gửi được giữ nguyên để các bên và TutorHub đối chiếu.</p>{text && <div className="max-h-56 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-neutral-50 p-3 text-fg">{text}</div>}{file && <div><p className="font-semibold text-fg">Tệp đính kèm</p><p className="mt-1 break-all">{file.name}</p></div>}</div>,
      });
      if (!approved) { submitting.current = false; return; }
    }
    setBusy(true); setError('');
    let responseId = savedResponseId;
    let sentAt;
    try {
      if (text && !responseId) {
        if (!request.current || request.current.content !== text) request.current = { submissionId: crypto.randomUUID(), content: text };
        const response = await disputeService.submitResponse(disputeId, request.current);
        responseId = response.id; sentAt = response.createdAt;
        setSavedResponseId(responseId);
      }
      if (file) { const evidence = await disputeService.uploadEvidence(disputeId, file, responseId); sentAt = evidence.createdAt || sentAt; }
      setReceipt({ at: sentAt, fileName: file?.name });
      setContent(''); setFile(null); setSavedResponseId(null); request.current = null;
      toast.success('Đã gửi phản hồi.');
      await onSaved();
    } catch (failure) {
      if (failure?.status === 403 || failure?.status === 409) {
        setBlocked(true);
        setError('Vụ việc hiện không nhận thêm phản hồi từ tài khoản của bạn. Nội dung đang nhập được giữ lại; hãy làm mới trạng thái để kiểm tra.');
      } else setError(responseId ? 'Giải trình đã được lưu, nhưng tệp đính kèm chưa gửi thành công. Bạn có thể gửi lại tệp bên dưới.' : 'Chưa thể gửi phản hồi. Nội dung và tệp được giữ lại để bạn thử lại.');
      if (responseId) await onSaved();
    } finally { submitting.current = false; setBusy(false); }
  };
  return <section id="dispute-response" aria-labelledby="response-title" className="scroll-mt-24 space-y-4">
    <div><h2 id="response-title" className="text-lg font-semibold text-fg">Gửi phản hồi</h2><p id="response-hint" className="mt-2 text-sm leading-relaxed text-fg-secondary">Nhập giải trình tối thiểu 20 ký tự hoặc đính kèm một tệp bằng chứng. Nếu có nhập nội dung, phần giải trình cần đạt tối thiểu 20 ký tự.</p></div>
    {receipt && <div role="status" className="space-y-1 border-l-2 border-success pl-3 text-sm text-success-strong"><p className="font-medium">Đã gửi phản hồi{receipt.at ? ` · ${formatDateTime(receipt.at, 'DD/MM/YYYY · HH:mm')}` : ''}</p>{receipt.fileName && <p className="break-all">Tệp đã gửi: {receipt.fileName}</p>}<p className="text-caption text-fg-secondary">Phản hồi được ghi nhận trong lịch sử xử lý bên dưới.</p></div>}
    {uploadFailed && !receipt && <p role="alert" className="rounded-lg bg-holding-subtle p-3 text-sm text-holding-strong">Khiếu nại đã được tạo nhưng tệp đính kèm chưa tải lên thành công. Vui lòng chọn lại tệp bên dưới.</p>}
    <form onSubmit={submit} noValidate className="space-y-5" aria-busy={busy}>
      <div><label htmlFor="dispute-explanation" className="block text-sm font-semibold text-fg">Nội dung giải trình của bạn</label><Textarea id="dispute-explanation" value={content} rows={6} maxLength={10000} disabled={busy || blocked || Boolean(savedResponseId)} aria-invalid={Boolean(error)} aria-describedby={`response-hint response-count${error ? ' response-error' : ''}`} onChange={event => { setContent(event.target.value); setError(''); }} placeholder="Trình bày sự việc, nội dung cần làm rõ và thông tin liên quan đến buổi học…" className="mt-2 shadow-none" /><p id="response-count" className="mt-2 text-right text-caption text-fg-secondary">{content.length.toLocaleString('vi-VN')}/10.000 ký tự</p></div>
      <DisputeEvidencePicker file={file} onChoose={choose} onRemove={() => { setFile(null); setError(''); }} disabled={busy || blocked} invalid={Boolean(error)} />
      {error && <p id="response-error" role="alert" className="rounded-lg bg-holding-subtle p-3 text-sm leading-relaxed text-holding-strong">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><p className="max-w-sm text-caption leading-relaxed text-fg-secondary">Bạn sẽ được xem lại nội dung trước khi gửi. Các phản hồi đã gửi được giữ nguyên để đối chiếu.</p><Button type="submit" loading={busy} disabled={busy || blocked || (!content.trim() && !file)} icon={<Icon name="send" size="sm" />}>{savedResponseId ? file ? 'Gửi lại tệp đính kèm' : 'Hoàn tất phản hồi' : 'Gửi phản hồi'}</Button></div>
    </form>
  </section>;
}
