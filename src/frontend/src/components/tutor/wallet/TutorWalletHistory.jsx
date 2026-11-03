import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import walletService from '@/services/wallet.service';
import Tabs from '@/components/ui/Tabs';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import DataTable from '@/components/common/DataTable';
import { TableSkeleton } from '@/components/common/Skeleton';
import StateBadge from '@/components/common/StateBadge';
import SignedAmount from '@/components/common/SignedAmount';
import Money from '@/components/ui/Money';
import { formatDateTime } from '@/utils/formatters';
import { maskBankAccount, walletTransactionDirection, walletTransactionLabel, walletTransactionLink } from '@/utils/tutorWallet';

const PAGE_SIZE = 15;
const COLUMNS = {
  withdrawals: [{ key: 'bank', label: 'Tài khoản nhận' }, { key: 'time', label: 'Ngày yêu cầu' }, { key: 'status', label: 'Trạng thái' }, { key: 'amount', label: 'Số tiền yêu cầu', align: 'right' }],
  statement: [{ key: 'type', label: 'Giao dịch' }, { key: 'time', label: 'Thời gian' }, { key: 'amount', label: 'Số tiền', align: 'right' }, { key: 'balance', label: 'Số dư sau', align: 'right' }],
};

export default function TutorWalletHistory() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'statement' ? 'statement' : 'withdrawals';
  const recordId = params.get('recordId');
  const requestedPage = Math.max(1, Number.parseInt(params.get('page'), 10) || 1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const change = changes => setParams(previous => {
    const next = new URLSearchParams(previous);
    Object.entries(changes).forEach(([key, value]) => value == null ? next.delete(key) : next.set(key, String(value)));
    return next;
  });
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true); setError(false);
      try {
        const get = tab === 'withdrawals' ? walletService.getWithdrawals : walletService.getWalletStatement;
        let page = recordId ? 1 : requestedPage;
        let result = await get({ pageNumber: page, pageSize: PAGE_SIZE });
        while (!cancelled && recordId && !result.items.some(item => item.id === recordId) && result.hasNextPage) result = await get({ pageNumber: ++page, pageSize: PAGE_SIZE });
        if (!cancelled) setData(result);
      } catch { if (!cancelled) setError(true); }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [tab, requestedPage, recordId, reload]);
  useEffect(() => {
    if (recordId && !loading) document.getElementById(`wallet-row-${recordId}`)?.scrollIntoView({ block: 'center', behavior: 'auto' });
  }, [recordId, loading, data]);

  const items = data?.items || [];
  return <section id="wallet-history" className="scroll-mt-24 space-y-5 rounded-2xl border border-border bg-surface p-5 sm:p-6" aria-labelledby="wallet-history-title">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="wallet-history-title" className="text-xl font-semibold text-fg">Lịch sử ví</h2>{!loading && !error && <span className="text-caption text-fg-secondary">{data?.totalCount || 0} {tab === 'withdrawals' ? 'yêu cầu' : 'giao dịch'}</span>}</div>
    <Tabs tabs={[{ key: 'withdrawals', label: 'Lịch sử rút tiền' }, { key: 'statement', label: 'Biến động ví' }]} value={tab} onChange={value => change({ tab: value, page: null, recordId: null })} />
    {loading ? <div role="status" aria-label="Đang tải lịch sử ví"><TableSkeleton rows={3} /></div>
      : error ? <div className="space-y-3 py-5"><p className="text-body-reg text-fg-secondary">Chưa tải được lịch sử ví. Vui lòng thử lại.</p><Button variant="outline" onClick={() => setReload(value => value + 1)}>Thử lại</Button></div>
      : <>
        {recordId && !items.some(item => item.id === recordId) && <p role="status" className="text-body-reg text-fg-secondary">Không tìm thấy giao dịch được liên kết trong lịch sử của bạn.</p>}
        {!items.length ? <div className="flex flex-col items-center py-8 text-center"><span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-50 text-fg-secondary"><Icon name="history" size="md" /></span><h3 className="font-semibold text-fg">{tab === 'withdrawals' ? 'Chưa có yêu cầu rút tiền' : 'Chưa có biến động ví'}</h3><p className="mt-2 max-w-md text-body-reg text-fg-secondary">{tab === 'withdrawals' ? 'Các yêu cầu rút tiền và trạng thái xử lý sẽ xuất hiện tại đây.' : 'Các khoản thu nhập, tiền rút và điều chỉnh số dư sẽ xuất hiện tại đây.'}</p></div>
          : <DataTable caption={tab === 'withdrawals' ? 'Lịch sử rút tiền của gia sư' : 'Biến động số dư ví gia sư'} columns={COLUMNS[tab]} minWidth={620}>
            {items.map(row => <tr id={`wallet-row-${row.id}`} key={row.id} className={row.id === recordId ? 'bg-brand-primary-50 ring-1 ring-inset ring-brand-primary-200' : 'hover:bg-neutral-50'}>
              {tab === 'withdrawals' ? <>
                <td className="px-4 py-4"><p className="font-medium text-fg">{row.bankName}</p><p className="mt-1 text-fg-secondary">{maskBankAccount(row.accountNumber)}</p><p className="mt-1 text-fg-secondary">{row.accountHolderName}</p></td>
                <td className="px-4 py-4 text-fg-secondary"><p>{formatDateTime(row.requestedAt)}</p>{row.note && <p className="mt-1 max-w-56 break-words">{row.note}</p>}</td>
                <td className="px-4 py-4"><StateBadge status={row.status} domain="withdrawal" />{row.processedAt && <p className="mt-2 text-fg-secondary">{row.status === 'Completed' ? 'Hoàn tất' : 'Cập nhật'} {formatDateTime(row.processedAt)}</p>}{row.status === 'Failed' && row.failureReason && <p className="mt-2 max-w-56 break-words text-danger-strong">{row.failureReason}</p>}</td>
                <td className="px-4 py-4 text-right font-semibold text-fg"><Money value={row.amount} /></td>
              </> : <>
                <td className="px-4 py-4"><p className="font-medium text-fg">{walletTransactionLabel(row.type)}</p>{walletTransactionLink(row) && <Link to={walletTransactionLink(row)} className="mt-1 inline-flex min-h-11 items-center text-primary hover:underline">{row.referenceType === 'Session' ? 'Xem buổi học' : 'Xem yêu cầu rút'}</Link>}</td>
                <td className="px-4 py-4 text-fg-secondary">{formatDateTime(row.createdAt)}</td>
                <td className="px-4 py-4 text-right">{walletTransactionDirection(row) ? <SignedAmount amount={row.amount} direction={walletTransactionDirection(row)} /> : <span className="font-semibold text-fg"><Money value={row.amount} /></span>}</td>
                <td className="px-4 py-4 text-right font-medium text-fg"><Money value={row.balanceAfter} /><p className="mt-1 text-[11px] font-normal text-fg-secondary">{row.type === 'WithdrawalSuccessSettlement' ? 'Khoản đang rút' : 'Số dư có thể rút'}</p></td>
              </>}
            </tr>)}
          </DataTable>}
        {(data?.hasPreviousPage || data?.hasNextPage) && <nav aria-label="Phân trang lịch sử ví" className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><Button size="sm" variant="outline" disabled={!data.hasPreviousPage} onClick={() => change({ page: data.pageNumber - 1, recordId: null })}>Trang trước</Button><span className="text-caption text-fg-secondary">Trang {data.pageNumber}/{data.totalPages}</span><Button size="sm" variant="outline" disabled={!data.hasNextPage} onClick={() => change({ page: data.pageNumber + 1, recordId: null })}>Trang sau</Button></nav>}
      </>}
  </section>;
}
