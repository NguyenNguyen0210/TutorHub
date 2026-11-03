import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import enrollmentService from '@/services/enrollment.service';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Money from '@/components/ui/Money';
import StateBadge from '@/components/common/StateBadge';
import { formatDateTime } from '@/utils/formatters';
import { pendingTuition } from '@/utils/tutorWallet';

function ContractEscrow({ summary }) {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const fetching = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const load = async () => {
    if (fetching.current) return;
    fetching.current = true; setLoading(true); setError(false);
    try { const result = await enrollmentService.getEnrollmentById(summary.id); if (mounted.current) setContract(result); }
    catch { if (mounted.current) setError(true); }
    finally { fetching.current = false; if (mounted.current) setLoading(false); }
  };
  const pending = (contract?.sessions || []).filter(session => !session.isPayoutReleased && session.status !== 'Cancelled');
  const rate = contract?.platformFeeRate;
  return <details className="rounded-xl border border-border" onToggle={event => { if (event.currentTarget.open && !contract && !error) load(); }}>
    <summary aria-label={`Xem học phí ${summary.serviceTitle || summary.subjectName} của ${summary.studentName || 'học viên'}`} className="cursor-pointer rounded-xl p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span className="ml-2 inline-flex max-w-[calc(100%_-_2rem)] flex-col gap-3 align-top">
        <span className="font-semibold text-fg">{summary.serviceTitle || summary.subjectName}</span>
        <span className="flex items-center gap-2"><Avatar src={summary.studentAvatarUrl} name={summary.studentName} size="sm" /><span className="text-body-reg text-fg-secondary">{summary.studentName || 'Học viên'} · {summary.completedSessions}/{summary.totalSessions} buổi hoàn thành</span></span>
        <span className="text-caption text-fg-secondary">Học phí còn giữ, trước phí sàn: <span className="font-semibold text-holding-strong"><Money value={pendingTuition(summary)} /></span></span>
      </span>
    </summary>
    <div className="space-y-4 border-t border-border p-4">
      {loading ? <p role="status" className="text-body-reg text-fg-secondary">Đang tải các buổi học…</p> : error ? <div className="space-y-2"><p className="text-body-reg text-fg-secondary">Chưa tải được chi tiết học phí.</p><Button variant="outline" size="sm" onClick={load}>Thử lại</Button></div> : contract && <>
        {rate != null && Number.isFinite(Number(rate)) && <p className="text-body-reg text-fg-secondary">Phí sàn theo hợp đồng: {new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 2 }).format(Number(rate))}. Thu nhập thực nhận sau phí được ghi trong Biến động ví khi giải ngân.</p>}
        {pending.length ? <ul className="divide-y divide-border">{pending.map(session => <li key={session.id} className="flex flex-wrap justify-between gap-3 py-3">
          <div className="min-w-0 space-y-1"><Link to={`/tutor/sessions/${session.id}`} className="inline-flex min-h-11 items-center font-medium text-primary hover:underline">Buổi #{session.sessionNumber}</Link><p className="text-caption text-fg-secondary">{session.startAt ? formatDateTime(session.startAt) : 'Chưa có lịch học'}</p><StateBadge status={session.status} domain="session" />{session.hasIssueReport ? <p className="text-caption text-holding-strong">Đang xử lý báo cáo sự cố</p> : session.status === 'AwaitingPayout' && session.gracePeriodEndsAt && <p className="text-caption text-fg-secondary">Bảo lưu đến {formatDateTime(session.gracePeriodEndsAt)}</p>}</div>
          <p className="self-center text-body-reg font-semibold text-holding-strong"><Money value={session.sessionPrice} /></p>
        </li>)}</ul> : <p className="text-body-reg text-fg-secondary">Không có buổi học đang chờ giải ngân trong danh sách này. Xem lộ trình để kiểm tra các khoản học phí.</p>}
      </>}
      <Button as={Link} to={`/tutor/enrollments/${summary.id}`} variant="outline" size="sm">Xem lộ trình và hợp đồng</Button>
    </div>
  </details>;
}

export default function TutorEscrowDetails() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const retry = useCallback(() => setReload(value => value + 1), []);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(false);
    enrollmentService.getAllMyEnrollments().then(result => { if (!cancelled) setContracts(result.items.filter(item => pendingTuition(item) > 0)); })
      .catch(() => { if (!cancelled) setError(true); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reload]);
  return <section id="escrow-details" aria-labelledby="escrow-details-title" className="scroll-mt-24 space-y-4 rounded-2xl border border-border bg-surface p-5 sm:p-6">
    <h2 id="escrow-details-title" className="text-xl font-semibold text-fg">Học phí chờ giải ngân theo hợp đồng</h2>
    <p className="text-body-reg leading-relaxed text-fg-secondary">Đây là học phí học viên ký quỹ trước phí sàn. Khoản này chưa phải số dư có thể rút. Mở từng hợp đồng để xem các buổi học.</p>
    {loading ? <p role="status" className="text-body-reg text-fg-secondary">Đang tải học phí theo hợp đồng…</p> : error ? <div className="space-y-3"><p className="text-body-reg text-fg-secondary">Chưa tải được các hợp đồng.</p><Button variant="outline" onClick={retry}>Thử lại</Button></div> : contracts.length ? <div className="space-y-3">{contracts.map(contract => <ContractEscrow key={contract.id} summary={contract} />)}</div> : <p className="py-4 text-body-reg text-fg-secondary">Chưa có hợp đồng còn học phí chờ giải ngân.</p>}
  </section>;
}
