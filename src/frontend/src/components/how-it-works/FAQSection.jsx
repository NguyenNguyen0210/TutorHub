import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';

const FAQ_ITEMS = [
  {
    id: 'faq-1',
    question: 'TutorHub hoạt động như thế nào?',
    answer:
      "Bạn tìm gia sư, thống nhất mục tiêu, chọn gói học rồi thanh toán và xếp lịch học trực tuyến 1:1. TutorHub giữ học phí. Sau mỗi buổi học, bạn có 12 giờ phản hồi trước khi học phí buổi đó được chuyển cho gia sư.",
  },
  {
    id: 'faq-2',
    question: 'Thanh toán trên TutorHub có an toàn không?',
    answer:
      "TutorHub giữ học phí và chuyển cho gia sư theo từng buổi học đã hoàn thành. Nếu có sự cố về lịch học hoặc chất lượng không đúng cam kết, hãy gửi khiếu nại trong thời gian quy định để tạm giữ học phí buổi đó và xem xét giải quyết.",
  },
  {
    id: 'faq-3',
    question: 'Làm thế nào để trở thành gia sư trên TutorHub?',
    answer:
      'Bạn chỉ cần nhấn "Gửi hồ sơ gia sư", điền thông tin chuyên môn, kinh nghiệm giảng dạy và tải lên các chứng chỉ, bằng cấp liên quan. Đội ngũ TutorHub sẽ kiểm duyệt hồ sơ trong vòng 24–48 giờ làm việc trước khi kích hoạt tài khoản giảng dạy của bạn.',
  },
  {
    id: 'faq-4',
    question: 'Tôi có thể đổi lịch hoặc hủy buổi học đã đăng ký không?',
    answer:
      'Có. Bạn có thể chủ động đề xuất đổi lịch học linh hoạt trước giờ học ít nhất 2 tiếng thông qua hệ thống xếp lịch. Trong trường hợp có sự cố đột xuất hoặc gia sư vắng mặt, học viên được bảo vệ quyền lợi 100% qua cổng báo cáo sự cố 12 giờ.',
  },
  {
    id: 'faq-5',
    question: 'Chi phí sử dụng TutorHub được tính như thế nào?',
    answer:
      'Học viên không phải trả bất kỳ khoản phí thành viên hay phụ phí nền tảng nào — bạn chỉ trả đúng mức học phí trọn gói được niêm yết công khai của gia sư. Gia sư sẽ chi trả một mức phí hoa hồng duy trì hệ thống nhỏ trên mỗi buổi học hoàn thành.',
  },
  {
    id: 'faq-6',
    question: 'Buổi học trực tuyến diễn ra qua nền tảng nào?',
    answer:
      'Lớp học trực tuyến diễn ra qua các công cụ tương tác video chất lượng cao (Google Meet, Zoom hoặc phòng học tích hợp sẵn). Bạn sẽ nhận được đường dẫn phòng học, tài liệu và nhắc hẹn tự động trước mỗi buổi.',
  },
];

export default function FAQSection() {
  // Mặc định luôn mở sẵn câu hỏi đầu tiên ('faq-1')
  const [openIds, setOpenIds] = useState(() => new Set(['faq-1']));

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
    <section className="border-b border-slate-200/80 bg-slate-50/70 py-12 sm:py-16">
      <div className="page-shell">
        {/* Bố cục 2 cột đồng bộ với khối Hành trình phía trên */}
        <div className="grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          {/* Cột trái: Tiêu đề, mô tả và hộp hỗ trợ (Cố định sticky khi cuộn) */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-200/80 bg-blue-50 text-blue-600 shadow-sm">
                <Icon name="help" size="md" />
              </div>

              <h2 className="text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-slate-900 sm:text-[34px]">
                Câu hỏi thường gặp
              </h2>

              <p className="max-w-md text-[15px] leading-relaxed text-slate-600 sm:text-[16px]">
                Tất cả những điều bạn cần biết về quy trình học tập, bảo chứng tài chính và quyền lợi đôi bên trên nền tảng TutorHub.
              </p>
            </div>

            {/* Hộp hỗ trợ: Khoảng đệm rộng rãi 20px-24px */}
            <div className="mt-8 sm:mt-10 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
              <h3 className="text-[15px] font-bold text-slate-900 leading-snug">
                Vẫn còn thắc mắc?
              </h3>
              <p className="mt-1.5 text-[13px] text-slate-500 leading-relaxed">
                Đội ngũ chuyên viên tư vấn luôn sẵn sàng giải đáp chi tiết và đồng hành cùng bạn 24/7.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <a
                  href="mailto:support@tutorhub.vn"
                  className="inline-flex items-center gap-1.5 text-[13.5px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <span>Liên hệ bộ phận CSKH</span>
                  <Icon name="arrow_forward" size="xs" />
                </a>
              </div>
            </div>
          </div>

          {/* Cột phải: Danh sách câu hỏi dạng thẻ ngang đồng bộ */}
          <div className="space-y-3.5 sm:space-y-4">
            {FAQ_ITEMS.map((item) => {
              const isOpen = openIds.has(item.id);
              return (
                <div
                  key={item.id}
                  className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                    isOpen
                      ? 'border-blue-500 ring-2 ring-blue-500/10 bg-white shadow-md shadow-blue-500/10'
                      : 'border-slate-200/90 bg-white hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${item.id}`}
                    className="flex min-h-[58px] w-full items-center justify-between gap-4 p-5 sm:p-5.5 text-left cursor-pointer transition-colors"
                  >
                    <span
                      className={`text-[15px] sm:text-[16px] leading-snug transition-colors ${
                        isOpen ? 'font-extrabold text-blue-600' : 'font-bold text-slate-900 hover:text-blue-600'
                      }`}
                    >
                      {item.question}
                    </span>
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                        isOpen
                          ? 'rotate-180 bg-blue-100 text-blue-600 shadow-sm'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      <Icon name="keyboard_arrow_down" size="sm" />
                    </span>
                  </button>

                  <div
                    id={`faq-answer-${item.id}`}
                    role="region"
                    className={`grid transition-all duration-200 ease-in-out ${
                      isOpen
                        ? 'grid-rows-[1fr] opacity-100 pb-5 px-5 sm:px-5.5'
                        : 'grid-rows-[0fr] opacity-0 pb-0 px-5 sm:px-5.5 pointer-events-none'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-blue-100/80 pt-3.5">
                        <p className="text-[14px] sm:text-[14.5px] leading-relaxed text-slate-600">
                          {item.answer}
                        </p>
                      </div>
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
