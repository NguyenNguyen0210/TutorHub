import React from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';

export default function TutorSessionActions({ session, permissions, record, recordError, onSchedule, onAddRecord, showProtection }) {
  const status = session.status;
  const title = status === 'Cancelled' ? 'Buổi học đã hủy'
    : status === 'Completed' ? 'Buổi học đã hoàn thành'
    : status === 'AwaitingPayout' ? session.hasIssueReport ? 'Báo cáo sự cố đang được xử lý' : 'Buổi học đang bảo lưu học phí'
    : status === 'Unscheduled' ? 'Thống nhất thời gian với học viên'
    : permissions.currentWindow ? 'Theo khung giờ đã xếp'
    : permissions.pastWindow ? 'Buổi học đã qua giờ kết thúc' : 'Lịch học đã được xác nhận';
  const description = status === 'Cancelled' ? 'Xem thông tin hủy và các buổi còn lại trong lộ trình.'
    : status === 'Completed' ? record ? 'Nhật ký đã được lưu và chia sẻ với học viên.' : 'Ghi lại nội dung đã dạy và bài tập để học viên tiếp tục luyện tập.'
    : status === 'AwaitingPayout' ? 'Theo dõi học phí và báo cáo sự cố nếu có. Bạn có thể thêm nhật ký sau khi buổi học hoàn thành.'
    : status === 'Unscheduled' ? 'Trao đổi lịch học phù hợp trước khi xác nhận thời gian bắt đầu.'
    : permissions.pastWindow ? 'Nhật ký có thể bổ sung khi buổi học được ghi nhận hoàn thành.'
    : 'Kiểm tra lịch giảng dạy, chuẩn bị nội dung và trao đổi với học viên khi cần.';
  return <Card as="aside" padding="lg" variant="outlined" className="order-2 min-w-0 rounded-2xl lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:sticky lg:top-24" aria-labelledby="session-action-title">
    <h2 id="session-action-title" className="text-headline-3 font-semibold text-fg">Quản lý buổi học</h2>
    <div className="mt-5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary-50 text-primary"><Icon name={status === 'Completed' ? 'menu_book' : 'calendar_month'} size="md" /></div>
    <h3 className="mt-4 font-semibold text-fg">{title}</h3><p className="mt-2 text-body-reg leading-relaxed text-fg-secondary">{description}</p>
    <div className="mt-5 space-y-3">
      {status === 'Unscheduled' && permissions.canSchedule && <Button onClick={onSchedule} fullWidth icon={<Icon name="calendar_month" size="sm" />}>Xếp lịch buổi học</Button>}
      {status === 'Scheduled' && permissions.canSchedule && <Button onClick={onSchedule} variant="outline" fullWidth icon={<Icon name="calendar_month" size="sm" />}>Đổi lịch học</Button>}
      {permissions.canCreateRecord && !recordError && <Button onClick={onAddRecord} fullWidth icon={<Icon name="edit" size="sm" />}>Thêm nhật ký</Button>}
      {record && <Button as="a" href="#session-record" variant="outline" fullWidth>Xem nhật ký</Button>}
      {status === 'AwaitingPayout' && showProtection && <Button as="a" href="#session-protection" variant="outline" fullWidth>{session.hasIssueReport ? 'Xem báo cáo sự cố' : 'Theo dõi bảo lưu học phí'}</Button>}
      {status === 'Cancelled' && <Button as="a" href="#session-cancellation" variant="outline" fullWidth>Xem thông tin hủy</Button>}
    </div>
  </Card>;
}
