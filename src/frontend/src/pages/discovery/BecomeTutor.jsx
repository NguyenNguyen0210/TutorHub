import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import '@/styles/become-tutor.css';

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
    desc: 'Dạy trực tuyến, chủ động sắp xếp lịch',
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
    desc: 'Tạo các gói học trực tuyến, đặt giá và mô tả nội dung rõ ràng.',
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
      'TutorHub giúp mình tiếp cận đúng những học viên thực sự có mục tiêu học tập rõ ràng. Cơ chế tự động giải ngân sau 12 giờ và lịch dạy được đồng bộ minh bạch giúp mình an tâm giảng dạy mà không bao giờ phải lo vấn đề công nợ học phí.',
    name: 'Nguyễn Mai Chi',
    role: 'Gia sư IELTS & Tiếng Anh · 5 năm kinh nghiệm',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80',
  },
  {
    quote:
      'Cơ chế ví ký quỹ bảo chứng Escrow trên TutorHub giải quyết triệt để bài toán bùng lịch. Học viên tin tưởng vì tiền được bảo đảm an toàn, còn gia sư như mình hoàn toàn chủ động thiết lập mức học phí và lộ trình khóa học chuyên sâu.',
    name: 'ThS. Đặng Hoàng Nam',
    role: 'Thủ khoa Toán Bách Khoa · 6 năm kinh nghiệm',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
  },
  {
    quote:
      'Mình đặc biệt thích tính năng xây dựng giáo trình chi tiết theo từng buổi học. Phụ huynh và học viên nhìn vào là nắm rõ lộ trình, giúp tỷ lệ đăng ký gói học trọn khóa tăng lên rõ rệt so với các kênh truyền thống.',
    name: 'Cô Đỗ Quỳnh Nga',
    role: 'Thủ khoa Bắc Kinh · 6 năm kinh nghiệm',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&auto=format&fit=crop&q=80',
  },
  {
    quote:
      'Giao diện quản lý buổi học và lịch rảnh rất trực quan, thao tác thuận tiện trên mọi thiết bị. Đội ngũ hỗ trợ của TutorHub luôn lắng nghe và phản hồi kịp thời, tạo môi trường sư phạm rất văn minh và chuyên nghiệp.',
    name: 'TS. Trần Quốc Huy',
    role: 'Giảng viên Vật lý & Bồi dưỡng HSG · 7 năm kinh nghiệm',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&auto=format&fit=crop&q=80',
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
      <section className="become-tutor-hero" aria-labelledby="become-tutor-heading">
        <div className="page-shell relative z-10">
          <div className="grid items-center gap-10 py-10 lg:min-h-[460px] lg:grid-cols-[minmax(0,1.05fr)_minmax(440px,.95fr)] lg:gap-12 lg:py-10">
            <div className="max-w-[680px]">
              <h1
                id="become-tutor-heading"
                className="become-tutor-display text-[38px] leading-[1.1] tracking-[-0.025em] sm:text-[48px] lg:text-[54px]"
              >
                Biến kiến thức của bạn
                <span className="block text-brand-primary-600">thành giá trị thực</span>
              </h1>

              <p className="mt-6 max-w-[600px] text-[15px] leading-7 text-fg-secondary sm:text-[17px]">
                Trở thành gia sư trên TutorHub để chia sẻ kiến thức, truyền cảm hứng và tạo thu
                nhập linh hoạt theo lịch của bạn. Chúng tôi hỗ trợ bạn từ bước đăng ký, xác minh
                đến quản lý lớp học và thanh toán.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button as={Link} to="/tutor/application" variant="primary" size="lg" iconRight={<Icon name="arrow_forward" size="sm" />}>
                  Đăng ký trở thành gia sư
                </Button>
                <Button as="a" href="#quy-trinh" variant="outline" size="lg">
                  Tìm hiểu quy trình
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[12px] font-semibold text-fg-secondary sm:text-[13px]">
                <span>Đặc quyền:</span>
                <span className="text-fg">Tự đặt giá</span>
                <span className="text-brand-primary-300" aria-hidden="true">•</span>
                <span className="text-fg">Linh hoạt lịch</span>
                <span className="text-brand-primary-300" aria-hidden="true">•</span>
                <span className="text-fg">Bảo vệ thanh toán</span>
              </div>
            </div>

            <div className="hidden lg:flex h-full items-center justify-center self-center">
              <div className="relative flex w-full max-w-[680px] select-none items-center justify-center">
                <div
                  className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-primary-100/70 blur-3xl"
                  aria-hidden="true"
                />
                <div className="relative z-10 flex w-full items-center justify-center scale-[1.22] origin-center">
                  <img
                    src="/images/hero-become-tutor-cutout.png"
                    alt="Không gian học tập trực tuyến TutorHub với lộ trình rõ ràng và gói học linh hoạt"
                    width="1774"
                    height="887"
                    className="pointer-events-none relative h-auto w-full select-none object-contain animate-float"
                    loading="eager"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface" aria-label="Đặc quyền dành cho gia sư">
        <div className="page-shell grid grid-cols-1 gap-4 py-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6 lg:py-7">
          {MINI_BENEFITS.map((benefit) => (
            <div key={benefit.title} className="flex items-start gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${benefit.iconBg}`}>
                <Icon name={benefit.icon} size="sm" />
              </div>
              <div>
                <h2 className="text-body-reg font-bold leading-tight text-fg">{benefit.title}</h2>
                <p className="mt-0.5 text-caption font-medium text-fg-secondary">{benefit.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 2. Quy trình 4 bước ─────────────────────────────── */}
      <section id="quy-trinh" className="py-6 sm:py-8 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-brand-xl border border-brand-primary-100 bg-brand-primary-50/50 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border/60">
              <div className="flex items-start gap-3">
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
              <Button
                as={Link}
                to="/tutor/application"
                variant="primary"
                size="md"
                iconRight={<Icon name="arrow_forward" size="sm" />}
                className="shrink-0 self-start sm:self-auto"
              >
                Tạo hồ sơ ngay
              </Button>
            </div>

            <ol className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {STEPS.map((s) => (
                <li key={s.num} className="flex items-stretch">
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

          <div className="flex flex-col">
            <h2 className="text-headline-2 text-fg">
              Gia sư nói gì về <span className="text-brand-primary-600">TutorHub?</span>
            </h2>
            <p className="text-body-reg text-fg-secondary mt-1 mb-5">
              Lắng nghe chia sẻ thực tế từ cộng đồng gia sư đang đồng hành cùng chúng tôi.
            </p>
            <div className="flex-1 bg-brand-primary-50/60 border border-brand-primary-100 rounded-brand-xl p-6 sm:p-7 flex flex-col sm:flex-row gap-5 overflow-hidden">
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <p className="text-body-reg text-fg leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3 mt-4">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="sm:hidden w-11 h-11 rounded-full object-cover object-top border border-border shrink-0 shadow-sm"
                      loading="lazy"
                    />
                    <div>
                      <p className="text-body-reg font-bold text-fg">{t.name}</p>
                      <p className="text-caption text-fg-secondary">{t.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-amber-400" role="img" aria-label="Đánh giá 5 trên 5 sao">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Icon key={i} name="star" size="xs" filled className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <button
                    type="button"
                    onClick={prev}
                    aria-label="Xem đánh giá trước"
                    className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-fg-secondary hover:text-fg hover:bg-neutral-50 transition-colors cursor-pointer shadow-sm"
                  >
                    <Icon name="arrow_back" size="sm" />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    aria-label="Xem đánh giá tiếp theo"
                    className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-fg-secondary hover:text-fg hover:bg-neutral-50 transition-colors cursor-pointer shadow-sm"
                  >
                    <Icon name="arrow_forward" size="sm" />
                  </button>
                  <span className="text-caption font-medium text-fg-secondary ml-1">
                    {active + 1} / {TESTIMONIALS.length}
                  </span>
                </div>
              </div>
              <div className="hidden sm:block shrink-0 w-36 lg:w-44 self-center">
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-brand-lg border border-border/80 shadow-brand-sm bg-surface">
                  <img
                    key={t.name}
                    src={t.avatar}
                    alt={t.name}
                    className="h-full w-full object-cover object-top select-none transition-opacity duration-200"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Final CTA ────────────────────────────────────── */}
      <section className="pb-12 sm:pb-16" aria-label="Đăng ký gia sư cùng TutorHub">
        <div className="page-shell">
          <div className="relative overflow-hidden rounded-3xl border border-blue-200/90 bg-gradient-to-br from-blue-50/90 via-sky-50/50 to-indigo-50/80 p-8 sm:p-10 lg:p-12 shadow-sm">
            {/* Vầng sáng nền mờ không đè lên chữ */}
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              {/* Nội dung bên trái */}
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/80 px-3 py-1 text-[12px] font-bold text-blue-700">
                  <Icon name="verified" size="xs" />
                  Đồng hành cùng cộng đồng TutorHub
                </span>
                <h2 className="mt-3 text-[26px] sm:text-[34px] font-extrabold text-slate-900 leading-[1.2] tracking-[-0.02em]">
                  Sẵn sàng chia sẻ tri thức?
                </h2>
                <p className="mt-2.5 text-[15px] sm:text-[16px] text-slate-600 leading-relaxed">
                  Đăng ký miễn phí, xét duyệt trong 1–3 ngày làm việc. Thu nhập minh bạch qua ví bảo chứng an toàn của TutorHub.
                </p>
              </div>

              {/* Cụm nút CTA bên phải */}
              <div className="flex flex-wrap items-center gap-3.5 shrink-0">
                <Link
                  to="/tutor/application"
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold px-6 py-3 shadow-md shadow-blue-500/20 transition-all active:scale-[0.98] text-[14px]"
                >
                  <span>Đăng ký ngay</span>
                  <Icon name="arrow_forward" size="sm" />
                </Link>

                <Link
                  to="/how-it-works"
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 hover:text-slate-950 border border-slate-200/90 font-bold px-6 py-3 shadow-sm transition-all active:scale-[0.98] text-[14px]"
                >
                  <span>Cách hoạt động</span>
                  <Icon name="arrow_forward" size="sm" />
                </Link>
              </div>
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
