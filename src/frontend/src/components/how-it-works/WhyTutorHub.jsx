import React from 'react';
import Icon from '@/components/ui/Icon';

const BENEFITS = [
  {
    icon: 'verified_user',
    iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100/60',
    title: 'Bảo chứng thanh toán',
    desc: 'Tiền học được giữ an toàn và giải ngân theo tiến độ.',
  },
  {
    icon: 'group',
    iconBg: 'bg-blue-50 text-[#2563EB] border border-blue-100/60',
    title: 'Gia sư được xác thực',
    desc: 'Kiểm duyệt hồ sơ, bằng cấp và kinh nghiệm giảng dạy.',
  },
  {
    icon: 'description',
    iconBg: 'bg-sky-50 text-sky-600 border border-sky-100/60',
    title: 'Minh bạch & công bằng',
    desc: 'Đánh giá, phản hồi và cơ chế xử lý tranh chấp rõ ràng.',
  },
  {
    icon: 'support_agent',
    iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100/60',
    title: 'Hỗ trợ tận tâm',
    desc: 'Đội ngũ hỗ trợ luôn sẵn sàng đồng hành cùng bạn.',
  },
];

export default function WhyTutorHub() {
  return (
    <section className="py-8 sm:py-10 lg:py-12">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-[22px] sm:text-[26px] font-bold text-neutral-900 mb-6 sm:mb-8">
          Vì sao chọn <span className="text-[#2563EB]">TutorHub</span>?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-6">
          {BENEFITS.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-neutral-50/80 transition-colors"
            >
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${item.iconBg}`}
              >
                <Icon name={item.icon} size="md" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[14.5px] font-bold text-neutral-900 leading-snug">
                  {item.title}
                </h3>
                <p className="text-[13px] text-neutral-500 leading-relaxed">
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
