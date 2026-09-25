import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';

const MINI_BENEFITS = [
  {
    icon: 'payments',
    iconBg: 'bg-success-subtle text-success-strong border border-success/20',
    title: 'Thu nhập hấp dẫn',
    desc: 'Bạn chủ động đặt giá và quản lý lịch dạy',
  },
  {
    icon: 'calendar_month',
    iconBg: 'bg-danger-subtle text-danger-strong border border-danger/20',
    title: 'Linh hoạt thời gian',
    desc: 'Dạy online hoặc tại nhà, chủ động sắp xếp lịch',
  },
  {
    icon: 'group',
    iconBg: 'bg-brand-primary-50 text-brand-primary-600 border border-brand-primary-100',
    title: 'Hỗ trợ toàn diện',
    desc: 'Đội ngũ TutorHub đồng hành cùng bạn',
  },
  {
    icon: 'verified_user',
    iconBg: 'bg-brand-secondary-50 text-brand-secondary-600 border border-brand-secondary-100',
    title: 'Môi trường an toàn',
    desc: 'Xác minh học viên, bảo chứng thanh toán',
  },
];

const STEPS = [
  {
    num: 1,
    icon: 'description',
    title: 'Đăng ký và gửi hồ sơ',
    desc: 'Tạo tài khoản, hoàn thiện thông tin cá nhân, kinh nghiệm giảng dạy và tải lên bằng cấp (nếu có).',
  },
  {
    num: 2,
    icon: 'verified_user',
    title: 'Xác minh & phê duyệt',
    desc: 'Đội ngũ TutorHub sẽ xem xét hồ sơ và bằng cấp của bạn trong 1–3 ngày làm việc.',
  },
  {
    num: 3,
    icon: 'menu_book',
    title: 'Thiết lập dịch vụ',
    desc: 'Tạo các gói dịch vụ học tập, đặt giá, mô tả nội dung và lựa chọn hình thức dạy.',
  },
  {
    num: 4,
    icon: 'group',
    title: 'Bắt đầu giảng dạy',
    desc: 'Kết nối với học viên, quản lý lịch dạy, nhận thanh toán an toàn qua TutorHub.',
  },
];

const TOOLKIT = [
  {
    icon: 'timeline',
    title: 'Quản lý thu nhập minh bạch',
    desc: 'Theo dõi thu nhập, lịch sử giao dịch và rút tiền dễ dàng.',
  },
  {
    icon: 'event_available',
    title: 'Công cụ quản lý lớp học',
    desc: 'Lên lịch, nhắc lịch, quản lý học viên và tài liệu học tập.',
  },
  {
    icon: 'forum',
    title: 'Kết nối trực tiếp với học viên',
    desc: 'Hệ thống nhắn tin an toàn, thuận tiện trao đổi và hỗ trợ học viên.',
  },
  {
    icon: 'support_agent',
    title: 'Đội ngũ hỗ trợ chuyên nghiệp',
    desc: 'Luôn sẵn sàng hỗ trợ bạn trong suốt quá trình giảng dạy.',
  },
];

const TESTIMONIALS = [
  {
    quote:
      '“TutorHub giúp mình kết nối với nhiều học viên phù hợp, quản lý lịch dạy rất thuận tiện và thanh toán minh bạch. Đây là nơi tuyệt vời để phát triển sự nghiệp giảng dạy.”',
    name: 'Nguyễn Thị Mai Anh',
    role: 'Gia sư Tiếng Anh · 3 năm kinh nghiệm',
  },
  {
    quote:
      '“Hồ sơ xét duyệt rõ ràng, tạo gói học chỉ mất vài phút. Học viên nghiêm túc nhờ cơ chế bảo chứng, mình yên tâm dạy và nhận thu nhập đúng hẹn.”',
    name: 'Trần Văn Khoa',
    role: 'Gia sư Toán THPT · 5 năm kinh nghiệm',
  },
  {
    quote:
      '“Lịch rảnh linh hoạt, nhắn tin trao đổi trước khi nhận lớp rất tiện. Đội ngũ hỗ trợ phản hồi nhanh mỗi khi mình cần.”',
    name: 'Phạm Thu Trang',
    role: 'Gia sư IELTS · 4 năm kinh nghiệm',
  },
];

export default function BecomeTutor() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    document.title = 'Trở thành gia sư — TutorHub';
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const prev = () => setActive((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  const next = () => setActive((i) => (i + 1) % TESTIMONIALS.length);
  const t = TESTIMONIALS[active];

  return (
    <div className="min-h-screen bg-canvas">
      {/* ── 1. Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#EFF6FF] to-[#ECFEFF] border-b border-sky-100/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-6 space-y-5">
              <nav className="flex items-center gap-1.5 text-caption font-medium text-fg-secondary" aria-label="Breadcrumb">
                <Link to="/" className="hover:text-brand-primary-600 transition-colors">
                  Trang chủ
                </Link>
                <span className="text-neutral-300" aria-hidden="true">
                  ›
                </span>
                <span className="text-brand-primary-600 font-semibold" aria-current="page">
                  Trở thành gia sư
                </span>
              </nav>

              <h1 className="text-display-hero text-fg tracking-tight">
                Biến kiến thức của bạn
                <br />
                <span className="text-brand-primary-600">thành giá trị thực</span>
              </h1>

              <p className="text-body-lg text-fg-secondary max-w-xl">
                Trở thành gia sư trên TutorHub để chia sẻ kiến thức, truyền cảm hứng và tạo thu
                nhập linh hoạt theo lịch của bạn. Chúng tôi hỗ trợ bạn từ bước đăng ký, xác minh
                đến quản lý lớp học và thanh toán.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button as={Link} to="/tutor/application" variant="primary" size="lg" iconRight={<Icon name="arrow_forward" size="sm" />}>
                  Đăng ký trở thành gia sư
                </Button>
                <Button as="a" href="#quy-trinh" variant="outline" size="lg">
                  Tìm hiểu quy trình
                </Button>
              </div>

              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {MINI_BENEFITS.map((b) => (
                  <div key={b.title} className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${b.iconBg}`}>
                      <Icon name={b.icon} size="sm" />
                    </div>
                    <div>
                      <p className="text-body-reg font-bold text-fg leading-tight">{b.title}</p>
                      <p className="text-caption text-fg-secondary font-medium mt-0.5">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 relative flex items-center justify-center">
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] bg-brand-primary-100/60 rounded-full blur-3xl -z-0 pointer-events-none"
                aria-hidden="true"
              />
              <p aria-hidden="true" className="hidden md:block absolute top-0 left-2 -rotate-6 text-body-reg font-semibold italic text-brand-primary-700 leading-tight">
                Teach
                <br />
                Share
                <br />
                Inspire
                <br />
                Grow.
              </p>

              <div className="relative w-full max-w-[480px] select-none">
                <img
                  src="/images/hero-become-tutor.jpg"
                  alt="Gia sư TutorHub đang giảng dạy"
                  className="w-full h-auto aspect-[4/3] object-cover rounded-brand-xl border border-white/70 shadow-brand-lg"
                  loading="eager"
                  srcSet="/images/hero-become-tutor.jpg 1x"
                />

                <div className="absolute top-2 -right-1 sm:right-0 bg-surface/95 backdrop-blur-md px-3 py-2.5 rounded-brand-lg shadow-brand-md border border-border flex items-center gap-2.5 animate-float">
                  <div className="w-8 h-8 rounded-brand-md bg-brand-primary-50 text-brand-primary-600 flex items-center justify-center shrink-0">
                    <Icon name="group" size="sm" />
                  </div>
                  <div>
                    <p className="text-body-reg font-bold text-fg leading-tight">500+</p>
                    <p className="text-caption text-fg-secondary">Học viên đã tin tưởng</p>
                  </div>
                </div>

                <div className="absolute top-1/3 -right-1 sm:right-2 bg-surface/95 backdrop-blur-md px-3 py-2.5 rounded-brand-lg shadow-brand-md border border-border flex items-center gap-2.5 animate-float" style={{ animationDelay: '0.8s' }}>
                  <div className="w-8 h-8 rounded-brand-md bg-brand-secondary-50 text-brand-secondary-600 flex items-center justify-center shrink-0">
                    <Icon name="star" size="sm" />
                  </div>
                  <div>
                    <p className="text-body-reg font-bold text-fg leading-tight">4.9/5</p>
                    <p className="text-caption text-fg-secondary">Đánh giá trung bình</p>
                  </div>
                </div>

                <div className="absolute bottom-6 -left-2 sm:left-0 bg-surface/95 backdrop-blur-md px-3 py-2.5 rounded-brand-lg shadow-brand-md border border-border flex items-center gap-2.5 animate-float" style={{ animationDelay: '1.4s' }}>
                  <div className="w-8 h-8 rounded-brand-md bg-info-subtle text-info flex items-center justify-center shrink-0">
                    <Icon name="timeline" size="sm" />
                  </div>
                  <div>
                    <p className="text-body-reg font-bold text-fg leading-tight">Thu nhập linh hoạt</p>
                    <p className="text-caption text-fg-secondary">Theo thời gian của bạn</p>
                  </div>
                </div>
              </div>

              <p aria-hidden="true" className="hidden md:block absolute bottom-2 right-0 rotate-6 text-body-reg font-semibold italic text-brand-primary-700 leading-tight text-right">
                Better
                <br />
                Learning
                <br />
                Brighter
                <br />
                Future.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Quy trình 4 bước ─────────────────────────────── */}
      <section id="quy-trinh" className="py-6 sm:py-8 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-brand-xl border border-brand-primary-100 bg-brand-primary-50/50 p-6 sm:p-8">
            <div className="flex items-start gap-3 pb-6 border-b border-border/60">
              <div className="w-11 h-11 rounded-brand-lg bg-brand-primary-100 text-brand-primary-600 flex items-center justify-center shrink-0">
                <Icon name="description" size="md" />
              </div>
              <div>
                <h2 className="text-headline-2 text-fg">Quy trình trở thành gia sư</h2>
                <p className="text-body-reg text-fg-secondary mt-0.5">
                  Chỉ với 4 bước đơn giản, bạn có thể bắt đầu hành trình giảng dạy trên TutorHub.
                </p>
              </div>
            </div>

            <ol className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {STEPS.map((s, idx) => (
                <li key={s.num} className="relative flex items-stretch">
                  <div className="w-full bg-surface rounded-brand-lg p-5 sm:p-6 border border-border shadow-brand-sm flex flex-col">
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-full bg-brand-primary-600 text-white flex items-center justify-center text-caption font-bold shrink-0">
                        {s.num}
                      </span>
                      <div className="w-9 h-9 rounded-brand-md bg-brand-primary-50 text-brand-primary-600 flex items-center justify-center shrink-0">
                        <Icon name={s.icon} size="sm" />
                      </div>
                    </div>
                    <h3 className="text-[15px] font-bold text-fg mt-4 mb-1.5 leading-snug">{s.title}</h3>
                    <p className="text-body-reg text-fg-secondary leading-relaxed">{s.desc}</p>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-brand-primary-500 pointer-events-none" aria-hidden="true">
                      <Icon name="arrow_forward" size="sm" />
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── 3. Nhận được gì + Testimonial ───────────────────── */}
      <section className="pb-6 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <h2 className="text-headline-2 text-fg">Bạn sẽ nhận được gì?</h2>
            <p className="text-body-reg text-fg-secondary mt-1 mb-5">
              TutorHub cung cấp đầy đủ công cụ và hỗ trợ để bạn tập trung vào việc giảng dạy.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TOOLKIT.map((item) => (
                <div key={item.title} className="bg-surface rounded-brand-lg border border-border p-5 shadow-brand-sm">
                  <div className="w-10 h-10 rounded-brand-md bg-brand-primary-50 text-brand-primary-600 flex items-center justify-center mb-3">
                    <Icon name={item.icon} size="md" />
                  </div>
                  <h3 className="text-body-reg font-bold text-fg leading-snug">{item.title}</h3>
                  <p className="text-body-reg text-fg-secondary mt-1 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-brand-primary-50/60 border border-brand-primary-100 rounded-brand-xl p-6 sm:p-7 flex flex-col sm:flex-row gap-5 overflow-hidden">
            <div className="flex-1 min-w-0">
              <h2 className="text-headline-2 text-fg">
                Gia sư nói gì về <span className="text-brand-primary-600">TutorHub?</span>
              </h2>
              <div className="mt-4 min-h-[132px]" aria-live="polite">
                <p className="text-body-reg text-fg leading-relaxed">{t.quote}</p>
                <p className="text-body-reg font-bold text-fg mt-3">{t.name}</p>
                <p className="text-caption text-fg-secondary">{t.role}</p>
                <div className="flex items-center gap-0.5 mt-1.5 text-brand-secondary-500" role="img" aria-label="Đánh giá 5 trên 5 sao">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Icon key={i} name="star" size="xs" />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Xem đánh giá trước"
                  className="w-11 h-11 rounded-full bg-surface border border-border flex items-center justify-center text-fg-secondary hover:text-fg hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <Icon name="arrow_back" size="sm" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Xem đánh giá tiếp theo"
                  className="w-11 h-11 rounded-full bg-surface border border-border flex items-center justify-center text-fg-secondary hover:text-fg hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <Icon name="arrow_forward" size="sm" />
                </button>
                <span className="text-caption text-fg-secondary ml-1">
                  {active + 1} / {TESTIMONIALS.length}
                </span>
              </div>
            </div>
            <img
              src="/images/hero-become-tutor.jpg"
              alt=""
              aria-hidden="true"
              className="hidden sm:block w-40 lg:w-48 aspect-[3/4] object-cover self-center rounded-brand-lg pointer-events-none select-none"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* ── 4. Final CTA ────────────────────────────────────── */}
      <section className="pb-10 sm:pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-brand-xl bg-gradient-to-r from-brand-primary-600 to-brand-primary-800 text-white p-6 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-brand-lg">
            <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-white/10 pointer-events-none" aria-hidden="true" />
            <div className="absolute -bottom-28 right-48 w-80 h-80 rounded-full bg-white/10 pointer-events-none" aria-hidden="true" />
            <div className="relative z-10 max-w-xl">
              <h2 className="text-headline-1">
                Sẵn sàng chia sẻ tri thức?
              </h2>
              <p className="text-body-reg text-white/85 mt-2">
                Đăng ký miễn phí, xét duyệt trong 1–3 ngày làm việc. Thu nhập minh bạch qua ví
                bảo chứng TutorHub.
              </p>
            </div>
            <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/tutor/application"
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-brand-md bg-white text-brand-primary-700 hover:bg-brand-primary-50 font-semibold text-body-lg shadow-sm transition-colors"
              >
                <span>Đăng ký ngay</span>
                <Icon name="arrow_forward" size="sm" />
              </Link>
              <Link
                to="/how-it-works"
                className="inline-flex items-center justify-center h-12 px-6 rounded-brand-md border border-white/40 text-white hover:bg-white/10 font-semibold text-body-lg transition-colors"
              >
                Cách hoạt động
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky mobile CTA */}
      <div className="lg:hidden sticky bottom-0 z-30 bg-surface/95 backdrop-blur-md border-t border-border px-4 py-3">
        <Button as={Link} to="/tutor/application" variant="primary" size="lg" fullWidth>
          Đăng ký trở thành gia sư
        </Button>
      </div>
    </div>
  );
}
