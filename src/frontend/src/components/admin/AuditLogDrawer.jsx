import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import adminService from '@/services/admin.service';
import { Drawer } from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { DetailSkeleton } from '@/components/common/Skeleton';
import { auditAction, auditEntity, auditTime, auditTarget, auditRecordedFields, auditJsonTokens, parseAuditPayload } from '@/utils/auditPresentation';

function Metadata({ label, value }) {
  return <div className="min-w-0"><dt className="text-xs text-fg-secondary">{label}</dt><dd className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{value || 'Chưa ghi nhận'}</dd></div>;
}
function JsonBlock({ raw, label, copy }) {
  if (raw == null || raw === '') return null;
  const colors = { key: 'text-brand-primary-700', string: 'text-success-strong', number: 'text-holding-strong', literal: 'text-insight-strong', plain: 'text-fg-secondary' };
  return <section className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-medium">{label}</h3><Button variant="ghost" size="sm" onClick={() => copy(parseAuditPayload(raw).original)}>Sao chép dữ liệu gốc</Button></div><pre className="max-h-96 overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-neutral-50 p-4 font-mono text-xs leading-6"><code>{auditJsonTokens(raw).map((token, index) => <span className={colors[token.kind]} key={index}>{token.text}</span>)}</code></pre>{!parseAuditPayload(raw).valid && <p className="text-xs text-fg-secondary">Bản ghi này lưu nội dung dạng văn bản.</p>}</section>;
}
export default function AuditLogDrawer({ id, timezone, onClose }) {
  const userId = useAuthStore(state => state.user?.id);
  const toast = useToast();
  const query = useQuery({ queryKey: ['admin-audit-detail', userId, id], queryFn: () => adminService.getAuditLog(id), retry: false });
  const copy = async value => { try { await navigator.clipboard.writeText(value); toast.success('Đã sao chép đầy đủ dữ liệu.'); } catch { toast.error('Chưa thể sao chép. Bạn có thể chọn nội dung để sao chép trực tiếp.'); } };
  const log = query.data, meta = auditAction(log?.action), fields = auditRecordedFields(log?.newValuesJson);
  const target = log && auditTarget(log);
  return <Drawer open={!!id} onClose={onClose} side="right" title="Chi tiết sự kiện kiểm toán" widthClass="w-full sm:max-w-2xl" panelClassName="max-w-full">
    {query.isPending ? <DetailSkeleton /> : query.isError || !log ? <div className="space-y-4 py-8"><p role="alert" className="text-sm">Không thể mở bản ghi kiểm toán này. Vui lòng thử lại hoặc quay về danh sách.</p><Button variant="outline" onClick={() => query.refetch()}>Thử lại</Button></div> : <div className="space-y-6">
      <div className="flex items-start gap-3"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${meta.tone}`}><Icon name={meta.icon} size="md" /></span><div className="min-w-0"><h2 className="text-lg font-semibold leading-7">{meta.title}</h2><p className="mt-1 text-xs text-fg-secondary">{meta.label}</p></div></div>
      <dl className="grid gap-5 sm:grid-cols-2"><Metadata label="Người thực hiện" value={log.userName} /><Metadata label={timezone === 'utc' ? 'Thời gian (UTC)' : 'Thời gian (UTC+7)'} value={auditTime(log.createdAt, timezone)} /><Metadata label="Đối tượng" value={auditEntity(log.entityName)} /><Metadata label="Địa chỉ IP" value={log.ipAddress} /></dl>
      <div className="space-y-2 border-t border-border pt-5"><p className="text-xs text-fg-secondary">Mã liên kết (Correlation ID)</p><div className="flex items-start gap-3"><code className="min-w-0 flex-1 select-all break-all text-xs leading-6">{log.correlationId || 'Chưa ghi nhận'}</code>{log.correlationId && <Button variant="outline" size="sm" onClick={() => copy(log.correlationId)}>Sao chép</Button>}</div><Button variant="ghost" size="sm" onClick={() => copy(log.id)}>Sao chép mã sự kiện</Button></div>
      <section className="space-y-4 border-t border-border pt-5"><h2 className="text-base font-semibold">Dữ liệu ghi nhận</h2>{fields.length ? <dl className="space-y-5">{fields.map(field => <Metadata key={field.key} label={field.label} value={field.value} />)}</dl> : <p className="text-sm leading-6 text-fg-secondary">Xem nội dung ghi nhận trong phần dữ liệu gốc bên dưới.</p>}{target && <Button as={Link} to={target} variant="outline">{log.entityName === 'Conversation' ? 'Mở tra cứu theo vụ việc' : 'Xem thông tin liên quan'}</Button>}</section>
      <details className="space-y-4 border-t border-border pt-5"><summary className="cursor-pointer rounded text-sm font-medium focus-visible:ring-2 focus-visible:ring-brand-primary-600">Chi tiết kỹ thuật và JSON gốc</summary><dl className="mt-4 grid gap-4 text-xs sm:grid-cols-2"><Metadata label="Mã sự kiện" value={log.id} /><Metadata label="Mã hành động" value={log.action} /><Metadata label="Loại thực thể" value={log.entityName} /><Metadata label="Mã thực thể" value={log.entityId} /><Metadata label="Mã người thực hiện" value={log.userId} /><Metadata label="Thời gian UTC" value={auditTime(log.createdAt, 'utc')} /><Metadata label="Thiết bị / Trình duyệt" value={log.userAgent} /></dl><JsonBlock raw={log.oldValuesJson} label={meta.kind === 'access' ? 'Dữ liệu bổ sung' : 'Giá trị trước'} copy={copy} /><JsonBlock raw={log.newValuesJson} label={meta.kind === 'access' || !log.oldValuesJson ? 'Thông tin sự kiện' : 'Giá trị sau'} copy={copy} />{!log.oldValuesJson && !log.newValuesJson && <p className="text-sm text-fg-secondary">Không có dữ liệu bổ sung trong bản ghi này.</p>}</details>
    </div>}
  </Drawer>;
}
