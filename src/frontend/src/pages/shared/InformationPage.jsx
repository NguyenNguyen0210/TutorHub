import React from 'react';
import { Link } from 'react-router-dom';
import { SUPPORT_HOURS } from '@/content/servicePolicies';

const pages = {
  support: {
    title: 'Hỗ trợ học viên và gia sư',
    intro: `TutorHub tiếp nhận hỗ trợ trong khung giờ ${SUPPORT_HOURS}.`,
    sections: [
      ['Bạn cần hỗ trợ về buổi học?', 'Mở chi tiết buổi học để nhắn tin với gia sư, kiểm tra lịch và gửi báo cáo sự cố khi còn thời hạn phản hồi.'],
      ['Liên hệ hỗ trợ', 'Gửi email đến support@tutorhub.vn, kèm mã đơn đặt chỗ hoặc mã buổi học, thời điểm xảy ra lỗi và ảnh chụp nếu có. Không gửi mật khẩu hoặc mã OTP.'],
      ['Giao dịch chưa có kết quả', 'Kiểm tra lịch sử ví và trạng thái đơn trước khi thực hiện lại. Nếu số tiền đã bị trừ nhưng trạng thái chưa cập nhật, hãy cung cấp mã giao dịch cho bộ phận hỗ trợ.'],
    ],
  },
  refunds: {
    title: 'Hoàn tiền và tranh chấp',
    intro: 'Theo dõi học phí và gửi khiếu nại từ chính buổi học có sự cố.',
    sections: [
      ['Gửi báo cáo đúng thời hạn', 'Mở chi tiết buổi học và chọn “Báo cáo / khiếu nại”. Hệ thống hiển thị thời hạn phản hồi của buổi học; thời gian phản hồi thông thường là 12 giờ. Nút gửi chỉ khả dụng khi buổi học đủ điều kiện và còn thời hạn.'],
      ['Cung cấp thông tin và bằng chứng', 'Mô tả sự cố, chọn lý do và đính kèm bằng chứng liên quan. Nếu đã gửi báo cáo, mở lại hồ sơ khiếu nại để theo dõi và bổ sung thông tin theo yêu cầu.'],
      ['Xem xét và xử lý học phí', 'Quản trị viên xem xét nội dung từ các bên và quyết định phương án xử lý. Việc hoàn tiền toàn bộ hoặc một phần phụ thuộc vào kết quả giải quyết; gửi báo cáo không đồng nghĩa được tự động hoàn tiền. Kiểm tra lịch sử ví để đối soát kết quả.'],
      ['Đã hết thời hạn?', 'Liên hệ hỗ trợ kèm mã buổi học và bằng chứng để được hướng dẫn. Không tạo thêm giao dịch để thử khắc phục một khoản thanh toán đang chờ xác nhận.'],
    ],
  },
  about: {
    title: 'Về chúng tôi',
    intro: 'TutorHub kết nối học viên và gia sư thông qua các gói học có lịch trình và học phí rõ ràng.',
    sections: [
      ['Tìm người dạy phù hợp', 'Khám phá hồ sơ, môn học, nội dung gói học và các đánh giá đã có trước khi lựa chọn. Nhãn hồ sơ được phê duyệt cho biết hồ sơ đã qua bước xét duyệt trên nền tảng.'],
      ['Đồng hành trong quá trình học', 'Học viên và gia sư có thể trao đổi qua tin nhắn, quản lý lịch và xem nhật ký từng buổi học trong không gian cá nhân.'],
      ['Minh bạch về học phí', 'TutorHub hỗ trợ theo dõi thanh toán, ví và quá trình giải ngân, cùng cơ chế báo cáo sự cố cho từng buổi học.'],
    ],
  },
};

export default function InformationPage({ kind = 'support' }) {
  const page = pages[kind] || pages.support;
  return <article className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
    <h1 className="text-3xl font-bold text-fg">{page.title}</h1>
    <p className="mt-4 text-lg leading-8 text-fg-secondary">{page.intro}</p>
    <div className="mt-10 space-y-8">{page.sections.map(([title, content]) => <section key={title}>
      <h2 className="text-xl font-semibold text-fg">{title}</h2>
      <p className="mt-3 leading-7 text-fg-secondary">{content}</p>
    </section>)}</div>
    <nav aria-label="Thông tin liên quan" className="mt-10 flex flex-wrap gap-5 border-t border-border pt-6 text-primary underline">
      <Link to="/support">Hỗ trợ</Link><Link to="/refunds">Hoàn tiền và tranh chấp</Link>
      <Link to="/student/disputes">Khiếu nại của tôi</Link><a href="mailto:support@tutorhub.vn">Gửi email hỗ trợ</a>
    </nav>
  </article>;
}
