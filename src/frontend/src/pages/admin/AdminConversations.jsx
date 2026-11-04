import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import adminService from '@/services/admin.service';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatDateTime } from '@/utils/formatters';
import { AdminEmpty } from '@/components/admin/AdminWorkspacePrimitives';
import Icon from '@/components/ui/Icon';

const CONTROL = 'mt-2 w-full rounded-lg border border-border bg-surface p-3 text-sm focus-visible:ring-2 focus-visible:ring-brand-primary-600';
const day = value => new Date(Date.parse(value) + 7 * 3600000).toISOString().slice(0, 10);
export default function AdminConversations() {
  const { user } = useAuthStore();
  const [params] = useSearchParams();
  const client = useQueryClient();
  const [kind, setKind] = useState(params.has('reportId') ? 'report' : 'dispute');
  const [caseId, setCaseId] = useState(params.get('disputeId') || params.get('reportId') || '');
  const initialCase = useRef(caseId);
  const [reason, setReason] = useState('');
  const [fromDate, setFromDate] = useState(day(new Date(Date.now() - 7 * 86400000).toISOString()));
  const [toDate, setToDate] = useState(day(new Date().toISOString()));
  const [access, setAccess] = useState(null);
  const [error, setError] = useState('');
  const [cursors, setCursors] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messageCursors, setMessageCursors] = useState([]);
  const cases = useQuery({ queryKey: ['admin-investigation-cases', user?.id, kind], enabled: !access, retry: false, queryFn: async () => {
    let page = 1, result, items = [];
    do { result = kind === 'dispute' ? await adminService.getDisputes({ pageNumber: page, pageSize: 100 }) : await adminService.getTrustReports({ pageNumber: page }); items.push(...(result.items || [])); page++; } while (items.length < result.totalCount && result.items?.length);
    return items;
  } });
  useEffect(() => {
    const record = cases.data?.find(item => item.id === initialCase.current);
    if (!record?.createdAt) return;
    setToDate(day(record.createdAt));
    setFromDate(day(new Date(Date.parse(record.createdAt) - 7 * 86400000).toISOString()));
    initialCase.current = null;
  }, [cases.data]);
  const settings = { retry: false, gcTime: 0, refetchOnWindowFocus: false, refetchOnReconnect: false };
  const query = useQuery({ queryKey: ['admin-case-investigation-v2', user?.id, access, cursors.at(-1)], queryFn: () => adminService.getConversations({ ...access, cursor: cursors.at(-1), pageSize: 20 }), enabled: Boolean(access), ...settings });
  const selectedInScope = query.data?.items?.find(item => item.id === selected?.id) || null;
  const messages = useQuery({ queryKey: ['admin-case-investigation-messages-v2', user?.id, access, selectedInScope?.id, messageCursors.at(-1)], queryFn: () => adminService.getConversationMessages(selectedInScope.id, { ...access, cursor: messageCursors.at(-1), pageSize: 50 }), enabled: Boolean(access && selectedInScope), ...settings });
  useEffect(() => () => { client.removeQueries({ queryKey: ['admin-case-investigation-v2', user?.id] }); client.removeQueries({ queryKey: ['admin-case-investigation-messages-v2', user?.id] }); }, [client, user?.id]);
  const end = () => { setAccess(null); setSelected(null); setCursors([]); setMessageCursors([]); client.cancelQueries({ queryKey: ['admin-case-investigation-v2'] }); client.cancelQueries({ queryKey: ['admin-case-investigation-messages-v2'] }); client.removeQueries({ queryKey: ['admin-case-investigation-v2'] }); client.removeQueries({ queryKey: ['admin-case-investigation-messages-v2'] }); };
  const start = event => {
    event.preventDefault();
    if (!caseId || !cases.data?.some(item => item.id === caseId)) { setError('Chọn vụ việc cần kiểm tra.'); return; }
    if (reason.trim().length < 5 || reason.trim().length > 500) { setError('Lý do cần từ 5 đến 500 ký tự.'); return; }
    const span = (Date.parse(toDate) - Date.parse(fromDate)) / 86400000;
    if (!Number.isFinite(span) || span < 0 || span > 30) { setError('Chọn khoảng điều tra từ 1 đến 31 ngày.'); return; }
    setError(''); setAccess({ operationalReason: reason.trim(), [kind === 'dispute' ? 'disputeId' : 'reportId']: caseId, fromDate, toDate });
  };
  const chosen = cases.data?.find(item => item.id === caseId);
  const caseLabel = item => kind === 'dispute' ? `Buổi #${item.sessionNumber} · ${item.studentName || item.initiatorName} · ${item.tutorName || item.respondentName}` : `${item.reporterName} · ${item.reportedUserName || 'Chưa xác định đối tượng'} · ${item.id.slice(0, 8)}`;
  return <div className="space-y-6"><WorkspacePageHeader title="Điều tra hội thoại" description="Tra cứu hội thoại phục vụ xác minh vụ việc và kiểm duyệt." />
    {!access ? <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(280px,2fr)]"><Card padding="lg" variant="outlined"><form onSubmit={start} onChange={() => setError('')} className="space-y-5" noValidate><h2 className="text-lg font-semibold">Thông tin tra cứu</h2><label className="block text-xs font-medium">Loại vụ việc<select aria-label="Loại vụ việc" className={CONTROL} value={kind} onChange={event => { setKind(event.target.value); setCaseId(''); }}><option value="dispute">Tranh chấp học phí</option><option value="report">Báo cáo vi phạm</option></select></label><label className="block text-xs font-medium">Vụ việc liên quan<select aria-label="Vụ việc liên quan" className={CONTROL} value={caseId} disabled={cases.isPending || cases.isError} onChange={event => { setCaseId(event.target.value); const item = cases.data?.find(value => value.id === event.target.value); if (item?.createdAt) { setToDate(day(item.createdAt)); setFromDate(day(new Date(Date.parse(item.createdAt) - 7 * 86400000).toISOString())); } }}><option value="">Chọn vụ việc cần kiểm tra</option>{cases.data?.map(item => <option key={item.id} value={item.id}>{caseLabel(item)}</option>)}</select></label>{cases.isError && <div role="alert" className="text-sm text-holding-strong">Chưa tải được các vụ việc.<Button variant="ghost" onClick={() => cases.refetch()}>Thử lại</Button></div>}{chosen && <p className="rounded-lg bg-brand-primary-50 p-3 text-sm leading-6">{caseLabel(chosen)}</p>}
      <div className="grid grid-cols-2 gap-3"><label className="block text-xs font-medium">Từ ngày<input aria-label="Từ ngày" type="date" value={fromDate} onChange={event => setFromDate(event.target.value)} className={CONTROL} /></label><label className="block text-xs font-medium">Đến ngày<input aria-label="Đến ngày" type="date" value={toDate} onChange={event => setToDate(event.target.value)} className={CONTROL} /></label></div><p className="text-xs text-fg-secondary">Tối đa 31 ngày · Theo giờ Việt Nam</p>
      <label className="block text-xs font-medium">Lý do truy cập *<textarea aria-label="Lý do truy cập" rows={3} maxLength={500} value={reason} onChange={event => setReason(event.target.value)} placeholder="Nêu mục đích xác minh và thông tin cần kiểm tra…" className={CONTROL} /><span className="mt-2 flex justify-between gap-3 font-normal text-fg-secondary"><span>5–500 ký tự. Lý do được lưu trong nhật ký truy cập.</span><span>{reason.length}/500</span></span></label>{error && <p role="alert" className="text-sm text-danger-strong">{error}</p>}<Button type="submit" disabled={cases.isPending || cases.isError}>Xác nhận và tra cứu hội thoại</Button></form></Card><aside className="space-y-4 rounded-2xl border border-brand-primary-100 bg-brand-primary-50 p-6"><Icon name="shield" size="lg" className="text-brand-primary-700" /><h2 className="text-lg font-semibold">Truy cập có kiểm soát</h2><p className="text-sm leading-7 text-fg-secondary">Nội dung hội thoại là thông tin riêng tư. Chỉ kiểm tra nội dung liên quan đến vụ việc và khoảng ngày đã chọn.</p><ul className="space-y-3 text-sm leading-6"><li>Ghi nhận người truy cập, lý do và phạm vi tra cứu.</li><li>Chỉ hiển thị trao đổi giữa các bên của vụ việc.</li><li>Nội dung chỉ đọc, không thể gửi hoặc sửa tin nhắn.</li></ul></aside></div>
      : <><div className="space-y-3 rounded-xl border border-success/20 bg-success-subtle p-4"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold">Tra cứu chỉ đọc · Mỗi lượt truy cập được ghi nhận</p><Button variant="outline" onClick={end}>Kết thúc tra cứu</Button></div><p className="break-words text-sm text-fg-secondary">{chosen && caseLabel(chosen)} · {fromDate} đến {toDate} (giờ Việt Nam)</p><p className="break-words text-sm text-fg-secondary">Lý do: {access.operationalReason}</p><Link className="text-sm font-medium text-brand-primary-700" to={kind === 'dispute' ? `/admin/disputes/${caseId}` : `/admin/trust-reports/${caseId}`}>Về vụ việc liên quan</Link></div><div className="grid items-start gap-6 lg:grid-cols-[minmax(260px,1fr)_minmax(0,2fr)]">
        <Card padding="lg" variant="outlined" className="space-y-4 rounded-2xl"><h2 className="text-lg font-semibold">Hội thoại trong phạm vi</h2>{query.isPending ? <p role="status">Đang tải hội thoại…</p> : query.isError ? <><p role="alert" className="text-sm">Không thể truy cập phạm vi này. Vui lòng kiểm tra vụ việc, khoảng ngày hoặc quyền tài khoản.</p><Button variant="outline" onClick={() => query.refetch()}>Thử lại</Button></> : <><ul className="divide-y divide-border">{query.data?.items.map(item => <li key={item.id}><button type="button" className="w-full rounded-lg p-3 text-left hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-ring" aria-pressed={selected?.id === item.id} onClick={() => { setSelected(item); setMessageCursors([]); }}><span className="block text-sm font-medium">{item.studentName} · {item.tutorName}</span><span className="mt-2 block line-clamp-2 break-words text-sm text-fg-secondary">{item.lastMessagePreview || 'Xem tin nhắn trong khoảng đã chọn'}</span></button></li>)}</ul>{!query.data?.items.length && <p className="text-sm text-fg-secondary">Không có hội thoại trong phạm vi đã chọn.</p>}<div className="flex justify-between gap-2"><Button variant="ghost" size="sm" disabled={!cursors.length} onClick={() => { setCursors(previous => previous.slice(0, -1)); setSelected(null); }}>Trước</Button><Button variant="ghost" size="sm" disabled={!query.data?.hasMore || !query.data?.nextCursor} onClick={() => { setCursors(previous => [...previous, query.data.nextCursor]); setSelected(null); }}>Sau</Button></div></>}</Card>
        <Card padding="lg" variant="outlined" className="min-w-0 space-y-4 rounded-2xl">{!selectedInScope ? <AdminEmpty title="Chọn hội thoại để xem" description="Nội dung được giới hạn theo vụ việc và khoảng ngày đã xác nhận." icon="chat" /> : <><h2 className="break-words text-lg font-semibold">{selectedInScope.studentName} · {selectedInScope.tutorName}</h2>{messages.isPending ? <p role="status">Đang tải tin nhắn…</p> : messages.isError ? <><p role="alert">Không thể mở hội thoại trong phạm vi đã chọn.</p><Button variant="outline" onClick={() => messages.refetch()}>Thử lại</Button></> : <><ol className="space-y-4">{[...(messages.data?.items || [])].reverse().map(item => <li key={item.id} className="border-l-2 border-brand-primary-100 pl-4"><div className="flex flex-wrap justify-between gap-2 text-xs text-fg-secondary"><span className="font-medium text-fg">{item.senderName}</span><time>{formatDateTime(item.createdAt)}</time></div><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">{item.content}</p>{item.attachmentName && <p className="mt-2 break-words text-xs text-fg-secondary">Tệp đính kèm: {item.attachmentName}</p>}</li>)}</ol>{!messages.data?.items.length && <p className="text-sm text-fg-secondary">Chưa có tin nhắn trong khoảng đã chọn.</p>}<div className="flex flex-wrap justify-between gap-2"><Button size="sm" variant="outline" disabled={!messageCursors.length} onClick={() => setMessageCursors(previous => previous.slice(0, -1))}>Mới hơn</Button><Button size="sm" variant="outline" disabled={!messages.data?.hasMore || !messages.data?.nextCursor} onClick={() => setMessageCursors(previous => [...previous, messages.data.nextCursor])}>Cũ hơn</Button></div></>}</>}</Card>
      </div></>}
  </div>;
}
