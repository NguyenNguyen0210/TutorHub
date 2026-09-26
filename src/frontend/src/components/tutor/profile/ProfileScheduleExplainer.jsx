import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { SectionShell } from './SectionShell';

const STEPS = [
  {
    title: 'Đăng ký giữ chỗ',
    body: 'Chọn gói học phù hợp và thanh toán an toàn qua két ký quỹ TutorHub. Hệ thống giữ chỗ độc quyền 15 phút.',
  },
  {
    title: 'Gia sư xếp lịch',
    body: 'Sau khi giữ chỗ thành công, gia sư chủ động sắp xếp thời khóa biểu chi tiết cho từng buổi học cùng bạn.',
  },
  {
    title: 'Học & đối soát',
    body: 'Mỗi buổi học được báo trước tối thiểu 24 giờ và chỉ tất toán giải ngân sau khi bạn xác nhận hoàn thành.',
  },
];

/**
 * ProfileScheduleExplainer — tab "Lịch dạy" (SPEC §4.3, quyết định §7).
 *
 * TutorHub **không** public lịch trống của gia sư: lịch chỉ tồn tại sau khi
 * học viên giữ chỗ một gói. Vì vậy section này giải thích quy trình thay vì dựng
 * một lịch giả — đây là điểm cố ý, không phải phần chưa làm.
 */
export default function ProfileScheduleExplainer({ tutorId }) {
  return (
    <SectionShell
      id="lich-day"
      title="Lịch dạy & cách xếp lịch"
      icon="calendar_month"
      className="mt-8"
    >
      <Card padding="lg" className="space-y-4">
        <p className="text-caption text-fg-secondary leading-relaxed">
          TutorHub không mở lịch trống công khai. Lịch học được xác nhận sau khi bạn
          đăng ký một gói học, giúp gia sư chủ động sắp xếp theo thời khóa biểu thực tế.
        </p>

        <ol className="space-y-2.5">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="flex items-start gap-3 p-3 rounded-brand-md bg-neutral-50 border border-border"
            >
              <span
                aria-hidden="true"
                className="w-6 h-6 rounded-full bg-brand-primary-100 text-brand-primary-700 font-bold text-caption flex items-center justify-center shrink-0 mt-0.5 tabular-nums"
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-caption font-bold text-fg">{step.title}</p>
                <p className="text-caption text-fg-muted leading-relaxed mt-0.5">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="pt-1">
          <Button
            as={Link}
            to={`/app/messages?tutorId=${tutorId}`}
            variant="outline"
            fullWidth
            size="md"
            icon={<Icon name="chat" size="sm" />}
          >
            Hỏi gia sư về lịch dạy
          </Button>
        </div>
      </Card>
    </SectionShell>
  );
}

ProfileScheduleExplainer.propTypes = {
  tutorId: PropTypes.string.isRequired,
};
