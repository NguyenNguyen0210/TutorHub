import React from 'react';
import Icon from '@/components/ui/Icon';

const BENEFITS = [
  {
    icon: 'verified_user',
    iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    title: 'Bảo chứng thanh toán',
    desc: "TutorHub giữ học phí và chuyển cho gia sư theo tiến độ từng buổi học.",
  },
  {
    icon: 'group',
    iconBg: 'bg-blue-50 text-blue-600 border border-blue-100',
    title: 'Gia sư được xác thực',
    desc: 'Kiểm duyệt hồ sơ, bằng cấp chuyên môn và kinh nghiệm giảng dạy minh bạch.',
  },
  {
    icon: 'description',
    iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    title: 'Minh bạch & công bằng',
    desc: 'Đánh giá chân thật từ học viên và cơ chế giải quyết sự cố 12 giờ rõ ràng.',
  },
  {
    icon: 'support_agent',
    iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
    title: 'Hỗ trợ tận tâm',
    desc: 'Đội ngũ hỗ trợ đồng hành cùng học viên và gia sư trong mọi tình huống.',
  },
];

export default function WhyTutorHub() {
  return (
    <section className="border-b border-slate-200/80 bg-white py-12 sm:py-16">
      <div className="page-shell">
        <div className="mb-8 sm:mb-10 max-w-2xl">
          <h2 className="text-[26px] sm:text-[32px] font-extrabold tracking-[-0.02em] text-slate-900">
            Vì sao chọn <span className="text-blue-600">TutorHub</span>?
          </h2>
          <p className="mt-2 text-[15px] sm:text-[16px] text-slate-600 leading-relaxed">
            Nền tảng kết nối gia sư được xây dựng trên nguyên tắc minh bạch, bảo vệ tài chính và cam kết chất lượng dài lâu.
          </p>
        </div>

        {/* 4 Thẻ lợi ích đóng khung có nền xám nhạt và viền mảnh */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {BENEFITS.map((item) => (
            <div
              key={item.title}
              className="group flex flex-col items-start gap-4 p-5 sm:p-6 rounded-2xl border border-slate-200/80 bg-slate-50/80 shadow-sm transition-all duration-200 hover:border-blue-200 hover:bg-white hover:shadow-md hover:-translate-y-0.5"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 ${item.iconBg}`}
              >
                <Icon name={item.icon} size="md" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-[16px] font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-[13.5px] text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
