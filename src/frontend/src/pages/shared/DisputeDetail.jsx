import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import disputeService from '@/services/dispute.service';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime } from '@/utils/formatters';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ErrorState from '@/components/common/ErrorState';
import Money from '@/components/ui/Money';
import StateBadge from '@/components/common/StateBadge';
import { useToast } from '@/components/ui/Toast';
import { EVIDENCE_ACCEPT, EVIDENCE_HINT, evidenceValidationMessage, evidenceDownloadUrl } from '@/utils/disputeEvidence';

export default function DisputeDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const client = useQueryClient();
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const inputRef = useRef(null);
  const backPath = user?.role === 'Tutor' ? '/app/notifications' : '/student/disputes';
  useEffect(() => { setFile(null); setUploadError(''); if (inputRef.current) inputRef.current.value = ''; }, [id]);
  const query = useQuery({ queryKey: ['my-dispute', user?.id, id], staleTime: 0, queryFn: async () => {
    const items = await disputeService.getMyDisputes();
    const item = items.find(value => value.id === id);
    if (!item) throw new Error('Không tìm thấy tranh chấp hoặc bạn không có quyền truy cập.');
    return item;
  } });
  if (query.isPending) return <div role="status" aria-label="Đang tải tranh chấp" className="h-64 rounded-2xl bg-neutral-100 motion-safe:animate-pulse" />;
  const upload = async event => {
    event.preventDefault();
    if (uploading) return;
    const error = evidenceValidationMessage(file);
    if (error) { setUploadError(error); return; }
    setUploading(true);
    setUploadError('');
    try {
      await disputeService.uploadEvidence(id, file);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      await Promise.all([
        client.invalidateQueries({ queryKey: ['my-dispute', user?.id, id] }),
        client.invalidateQueries({ queryKey: ['student-disputes', user?.id] }),
      ]);
      toast.success('Đã bổ sung bằng chứng.');
    } catch { setUploadError('Chưa thể tải bằng chứng. Vui lòng kiểm tra tệp và thử lại.'); }
    finally { setUploading(false); }
  };
  if (query.isError) return <ErrorState title="Không thể mở khiếu nại" error={query.error} onRetry={query.refetch} backPath={backPath} backLabel="Quay lại" />;
  const item = query.data;
  const workspace = user?.role === 'Tutor' ? 'tutor' : 'student';
  const closed = ['Resolved', 'Dismissed'].includes(item.status);
  return <div className="mx-auto max-w-3xl space-y-5">
    <Button as={Link} to={backPath} variant="ghost">{workspace === 'student' ? 'Về khiếu nại của tôi' : 'Về thông báo'}</Button>
    <h1 className="text-headline-page text-fg">Khiếu nại buổi học #{item.sessionNumber}</h1>
    <Card padding="lg" variant="outlined" className="space-y-4 rounded-2xl">
      <StateBadge domain="dispute" status={item.status} />
      <p className="whitespace-pre-wrap break-words text-body-reg leading-relaxed text-fg-secondary">{item.description}</p>
      <dl className="space-y-3 text-body-reg text-fg-secondary"><div><dt>Người gửi</dt><dd className="text-fg">{item.initiatorName}</dd></div><div><dt>Thời gian tạo</dt><dd className="text-fg">{formatDateTime(item.createdAt)}</dd></div><div><dt>Học phí được tạm giữ khi mở tranh chấp</dt><dd className="text-fg"><Money value={item.heldAmount} /></dd></div>{item.adminNotes && <div><dt>Ghi chú xử lý</dt><dd className="whitespace-pre-wrap text-fg">{item.adminNotes}</dd></div>}{item.resolvedAt && <div><dt>Thời gian xử lý</dt><dd className="text-fg">{formatDateTime(item.resolvedAt)}</dd></div>}</dl>
      <div className="flex flex-wrap gap-3"><Button as={Link} to={`/${workspace}/sessions/${item.sessionId}`}>Xem buổi học</Button><Button as={Link} to={`/${workspace}/enrollments/${item.enrollmentId}`} variant="outline">Xem hợp đồng</Button></div>
    </Card>
    <Card padding="lg" variant="outlined" className="space-y-4 rounded-2xl">
      <h2 className="text-lg font-semibold text-fg">Bằng chứng đính kèm</h2>
      {item.evidences?.length ? <ul className="divide-y divide-border">{item.evidences.map(evidence => {
        const url = evidenceDownloadUrl(evidence.fileUrl);
        return <li key={evidence.id} className="space-y-1 py-3">{url ? <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center break-all rounded font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{evidence.fileName}</a> : <p className="break-all font-medium text-fg">{evidence.fileName}</p>}<p className="text-caption text-fg-secondary">{formatDateTime(evidence.createdAt)} · {Math.max(1, Math.ceil(evidence.fileSizeBytes / 1024))} KB</p></li>;
      })}</ul> : <p className="text-sm text-fg-secondary">Chưa có tệp bằng chứng đính kèm.</p>}
      {!closed ? <form onSubmit={upload} className="space-y-3 border-t border-border pt-4"><label htmlFor="dispute-evidence" className="block text-sm font-semibold text-fg">Bổ sung bằng chứng</label><p id="evidence-help" className="text-caption text-fg-secondary">{EVIDENCE_HINT}</p><input key={id} ref={inputRef} id="dispute-evidence" type="file" accept={EVIDENCE_ACCEPT} disabled={uploading} aria-describedby={uploadError ? 'evidence-help evidence-error' : 'evidence-help'} aria-invalid={Boolean(uploadError)} onChange={event => { setFile(event.target.files?.[0] || null); setUploadError(''); }} className="block min-h-11 w-full min-w-0 rounded-lg border border-border bg-surface p-2 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />{uploadError && <p id="evidence-error" role="alert" className="text-sm text-danger-strong">{uploadError}</p>}<Button type="submit" loading={uploading} disabled={!file || uploading}>Gửi bằng chứng</Button></form> : <p className="text-caption text-fg-secondary">Khiếu nại đã kết thúc và không còn nhận thêm bằng chứng.</p>}
    </Card>
  </div>;
}
