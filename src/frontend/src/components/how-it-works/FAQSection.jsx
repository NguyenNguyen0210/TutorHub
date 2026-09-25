import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';

const FAQ_ITEMS = [
  {
    id: 'faq-1',
    question: 'TutorHub hoạt động như thế nào?',
    answer:
      'TutorHub kết nối học viên với gia sư chất lượng. Bạn tìm kiếm gia sư phù hợp, chọn gói học, thanh toán an toàn qua hệ thống bảo chứng (Escrow), và bắt đầu học tập. Tiền chỉ được giải ngân cho gia sư sau khi buổi học hoàn thành.',
  },
  {
    id: 'faq-2',
    question: 'Thanh toán trên TutorHub có an toàn không?',
    answer:
      'Hoàn toàn an toàn. TutorHub sử dụng hệ thống bảo chứng Escrow — tiền học phí được giữ trong ví TutorHub và chỉ giải ngân cho gia sư sau khi buổi học được xác nhận hoàn thành bởi cả hai bên.',
  },
  {
    id: 'faq-3',
    question: 'Làm thế nào để trở thành gia sư trên TutorHub?',
    answer:
      'Bạn đăng ký tài khoản, gửi hồ sơ giảng dạy (bao gồm bằng cấp, kinh nghiệm), chờ đội ngũ TutorHub phê duyệt. Sau khi được duyệt, bạn có thể tạo dịch vụ học tập và bắt đầu nhận học viên.',
  },
  {
    id: 'faq-4',
    question: 'Tôi có thể hủy gói học đã mua không?',
    answer:
      'Bạn có thể yêu cầu hủy gói học trước khi buổi học đầu tiên bắt đầu. Sau khi đã bắt đầu học, việc hủy sẽ tuân theo chính sách hoàn tiền của TutorHub, đảm bảo quyền lợi cho cả hai bên.',
  },
  {
    id: 'faq-5',
    question: 'Chi phí sử dụng TutorHub là bao nhiêu?',
    answer:
      'Học viên không mất phí đăng ký hay phí nền tảng. Bạn chỉ thanh toán cho gói học mà bạn chọn. Gia sư sẽ chịu một khoản phí dịch vụ nhỏ trên mỗi giao dịch thành công.',
  },
  {
    id: 'faq-6',
    question: 'TutorHub hỗ trợ những hình thức học nào?',
    answer:
      'TutorHub hỗ trợ cả học Online (qua Google Meet, Zoom) và học Tại nhà (gia sư đến trực tiếp). Bạn có thể lọc theo hình thức học khi tìm kiếm gia sư hoặc dịch vụ.',
  },
];

export default function FAQSection() {
  const [openIds, setOpenIds] = useState(new Set(['faq-1']));

  const toggleItem = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <section className="py-10 sm:py-14 lg:py-16">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-[840px] mx-auto">
          {/* Header Row: Title & Link */}
          <div className="flex items-center justify-between pb-6 border-b border-neutral-200">
            <h2 className="text-[22px] sm:text-[26px] font-bold text-neutral-900">
              Câu hỏi <span className="text-[#2563EB]">thường gặp</span>
            </h2>
            <button
              type="button"
              onClick={() => {
                // If not all open, open all; otherwise collapse all
                if (openIds.size === FAQ_ITEMS.length) {
                  setOpenIds(new Set());
                } else {
                  setOpenIds(new Set(FAQ_ITEMS.map((item) => item.id)));
                }
              }}
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#2563EB] hover:text-blue-700 transition-colors cursor-pointer"
            >
              <span>{openIds.size === FAQ_ITEMS.length ? 'Thu gọn' : 'Xem tất cả'}</span>
              <Icon name="arrow_forward" size="xs" />
            </button>
          </div>

          {/* Accordion List */}
          <div className="divide-y divide-neutral-200/80">
            {FAQ_ITEMS.map((item) => {
              const isOpen = openIds.has(item.id);
              return (
                <div key={item.id} className="py-4 sm:py-5">
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${item.id}`}
                    className="w-full flex items-center justify-between gap-4 text-left group cursor-pointer"
                  >
                    <span className="text-[15px] sm:text-[16px] font-semibold text-neutral-900 group-hover:text-[#2563EB] transition-colors leading-snug">
                      {item.question}
                    </span>
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-neutral-400 group-hover:text-[#2563EB] transition-all transform duration-200 ${
                        isOpen ? 'rotate-180 bg-blue-50 text-[#2563EB]' : 'hover:bg-neutral-100'
                      }`}
                    >
                      <Icon name="expand_more" size="sm" />
                    </span>
                  </button>

                  <div
                    id={`faq-answer-${item.id}`}
                    role="region"
                    className={`grid transition-all duration-200 ease-in-out ${
                      isOpen ? 'grid-rows-[1fr] opacity-100 mt-2.5' : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-[13.5px] sm:text-[14px] text-neutral-600 leading-relaxed pr-6">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
