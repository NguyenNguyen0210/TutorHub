import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import disputeService from '@/services/dispute.service';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StateBadge from '@/components/common/StateBadge';

export default function SessionDisputeAccess({ session, isTutor }) {
  const { user } = useAuthStore();
  const query = useQuery({ queryKey: ['my-disputes', user?.id], queryFn: disputeService.getMyDisputes, staleTime: 0 });
  const listPath = isTutor ? '/tutor/disputes' : '/student/disputes';
  const disputes = (query.data || []).filter(item => item.sessionId === session.id);
  return <Card padding="lg" variant="outlined" className="space-y-4 rounded-2xl">
    <h2 className="text-lg font-semibold text-fg">Khiếu nại & bằng chứng</h2>
    <p className="text-body-reg text-fg-secondary">Theo dõi kết quả xử lý và bổ sung tài liệu cho khiếu nại của buổi học này.</p>
    {query.isPending ? <p role="status" className="text-sm text-fg-secondary">Đang tải khiếu nại…</p>
      : query.isError ? <div className="space-y-3"><p role="alert" className="text-sm text-fg-secondary">Chưa tải được hồ sơ khiếu nại.</p><Button variant="outline" onClick={() => query.refetch()}>Thử lại</Button></div>
      : disputes.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><StateBadge domain="dispute" status={item.status} /><Button as={Link} to={`/app/disputes/${item.id}`} variant="outline">Xem khiếu nại & bằng chứng</Button></div>)}
    {!query.isPending && !query.isError && disputes.length === 0 && <p className="text-sm text-fg-secondary">Chưa tìm thấy hồ sơ khiếu nại tương ứng. Bạn có thể kiểm tra danh sách hoặc liên hệ hỗ trợ.</p>}
    <Link to={listPath} className="inline-flex min-h-11 items-center rounded text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring">Tất cả khiếu nại</Link>
  </Card>;
}
