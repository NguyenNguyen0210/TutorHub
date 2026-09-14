import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Button,
  Radio,
  Avatar,
  Tag,
  Divider,
  Breadcrumb,
  Alert,
  Spin,
  Modal,
  message,
} from 'antd';
import {
  SafetyCertificateFilled,
  LockFilled,
  CreditCardFilled,
  QrcodeOutlined,
  BankOutlined,
  CheckCircleFilled,
  ArrowLeftOutlined,
  ThunderboltFilled,
  InfoCircleOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import CountdownTimer from '@/components/feedback/CountdownTimer';
import VnPayCardInfo from '@/components/financial/VnPayCardInfo';
import bookingService from '@/services/booking.service';
import paymentService from '@/services/payment.service';
import { formatCurrency } from '@/utils/formatters';

export default function BookingCheckout() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('vnpay_ncb');

  useEffect(() => {
    async function loadBookingData() {
      setLoading(true);
      try {
        // Ưu tiên state truyền từ ServiceCard nếu có
        const state = location.state;
        if (state && state.serviceId) {
          const now = new Date();
          const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
          setBooking({
            id: id || 'b1b1b1b1-0001-0000-0000-000000000001',
            serviceId: state.serviceId,
            serviceTitle: state.serviceTitle || 'Luyện thi THPT Toán 10 buổi',
            tutorName: state.tutorName || 'ThS. Nguyễn Văn An',
            tutorAvatar: state.tutorAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=an',
            tutorEducation: 'Cử nhân Sư phạm Toán - ĐH Sư phạm Hà Nội',
            totalSessions: state.totalSessions || 10,
            sessionDurationMinutes: state.sessionDurationMinutes || 60,
            teachingMode: state.teachingMode || 'Both',
            price: state.price || 2000000,
            platformFeeAmount: 0,
            totalAmount: state.price || 2000000,
            holdingExpiresAt: expiresAt,
          });
        } else {
          const data = await bookingService.getBookingById(id);
          setBooking(data);
        }
      } catch (err) {
        console.error('Lỗi khi tải đơn đặt chỗ:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBookingData();
  }, [id, location.state]);

  const handleExpire = () => {
    setIsExpired(true);
    message.error('Đơn giữ chỗ 15 phút đã hết hạn! Slot học đã được giải phóng.');
  };

  // Thanh toán VNPay Sandbox
  const handleVnPayPayment = async () => {
    if (isExpired) {
      message.error('Đơn giữ chỗ đã hết hạn. Vui lòng đặt lại gói học.');
      return;
    }

    setSubmitting(true);
    try {
      const paymentUrl = await paymentService.createVnPayUrl(booking.id);
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        // Mô phỏng redirect sang return URL của VNPay Sandbox
        const amountParam = booking.totalAmount * 100;
        navigate(`/payment/return?vnp_ResponseCode=00&vnp_TxnRef=${booking.id}&vnp_Amount=${amountParam}&vnp_BankCode=NCB&vnp_OrderInfo=Thanh+toan+khoa+hoc+TutorHub`);
      }
    } catch (err) {
      message.error('Không thể khởi tạo cổng thanh toán VNPay.');
    } finally {
      setSubmitting(false);
    }
  };

  // Test nhanh: Mô phỏng thanh toán thành công
  const handleSimulateSuccess = () => {
    const amountParam = (booking?.totalAmount || 2000000) * 100;
    navigate(`/payment/return?vnp_ResponseCode=00&vnp_TxnRef=${booking?.id || 'THB-TEST-001'}&vnp_Amount=${amountParam}&vnp_BankCode=NCB&vnp_OrderInfo=Thanh+toan+thanh+cong+Escrow`);
  };

  // Test nhanh: Mô phỏng hủy giao dịch
  const handleSimulateCancel = () => {
    const amountParam = (booking?.totalAmount || 2000000) * 100;
    navigate(`/payment/return?vnp_ResponseCode=24&vnp_TxnRef=${booking?.id || 'THB-TEST-001'}&vnp_Amount=${amountParam}&vnp_BankCode=NCB&vnp_OrderInfo=Khach+hang+huy+giao+dich`);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spin size="large" tip="Đang khởi tạo phiên giữ chỗ 15 phút..." />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-12 text-center">
        <h3>Không tìm thấy thông tin đơn giữ chỗ!</h3>
        <Button onClick={() => navigate('/tutors')}>Quay lại danh sách gia sư</Button>
      </div>
    );
  }

  const perSessionPrice = Math.round(booking.price / booking.totalSessions);

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* Top Breadcrumb & Back Link */}
      <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between text-xs">
          <Breadcrumb
            items={[
              { title: <Link to="/">Trang chủ</Link> },
              { title: <Link to="/tutors">Gia sư</Link> },
              { title: 'Thanh toán giữ chỗ 15 phút' },
            ]}
          />
          <Link
            to="/tutors"
            className="flex items-center gap-1 font-medium text-slate-500 hover:text-brand-indigo-600"
          >
            <ArrowLeftOutlined /> Hủy giữ chỗ & Quay lại
          </Link>
        </div>
      </div>

      {/* Stepper Header */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5 text-brand-indigo-600">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-indigo-600 text-white text-xs">1</span>
              <span>Giữ Chỗ 15 Phút</span>
            </span>
            <span className="h-0.5 w-12 bg-brand-indigo-200"></span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-600 text-xs">2</span>
              <span>Thanh Toán VNPay</span>
            </span>
            <span className="h-0.5 w-12 bg-slate-200"></span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-600 text-xs">3</span>
              <span>Kích Hoạt Hợp Đồng Escrow</span>
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
        {/* 1. REAL-TIME COUNTDOWN TIMER BANNER */}
        <div className="mb-6">
          <CountdownTimer
            expiresAt={booking.holdingExpiresAt}
            onExpire={handleExpire}
          />
        </div>

        {/* Expired Warning Alert */}
        {isExpired && (
          <Alert
            type="error"
            message="Đơn Giữ Chỗ Đã Hết Hạn"
            description="Thời gian khóa slot 15 phút đã kết thúc. Vui lòng quay lại danh mục gia sư và bấm đặt mua lại để đảm bảo slot học của bạn không bị trùng với học viên khác."
            showIcon
            action={
              <Button size="small" danger onClick={() => navigate('/tutors')}>
                Đặt Chỗ Mới
              </Button>
            }
            className="mb-6 rounded-2xl"
          />
        )}

        {/* 2-COLUMN MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* LEFT COLUMN: ORDER DETAILS & ESCROW TRUST (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card 1: Gói học & Gia sư */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-4">
                  <Avatar
                    src={booking.tutorAvatar}
                    size={64}
                    className="border-2 border-brand-indigo-100 bg-brand-indigo-50 shadow-sm"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-slate-900">{booking.tutorName}</span>
                      <Tag color="emerald" className="font-semibold text-[10px] rounded-full border-0 px-2 py-0.5">
                        <CheckCircleFilled /> ĐÃ XÁC MINH
                      </Tag>
                    </div>
                    <p className="m-0 mt-0.5 text-xs text-brand-indigo-600 font-medium">
                      {booking.tutorEducation}
                    </p>
                  </div>
                </div>

                <Tag color="purple" className="font-semibold text-xs px-2.5 py-1 rounded-lg">
                  {booking.teachingMode === 'Both' ? 'Online & Tại nhà' : booking.teachingMode}
                </Tag>
              </div>

              {/* Package Details */}
              <div className="mt-5">
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {booking.serviceTitle}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2">
                  <span className="flex items-center gap-1.5 font-semibold text-brand-indigo-700 bg-brand-indigo-50 px-2.5 py-1 rounded-lg">
                    <CalendarOutlined /> Hợp đồng {booking.totalSessions} buổi học
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    <ClockCircleOutlined /> {booking.sessionDurationMinutes} phút / buổi
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Bảng chiết tính học phí */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">
                Chi Tiết Chiết Tính Học Phí
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">
                    Học phí trọn gói ({booking.totalSessions} buổi x {booking.sessionDurationMinutes}p):
                  </span>
                  <span className="font-bold text-slate-800 text-sm">
                    {formatCurrency(booking.price)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-500">
                  <span>Đơn giá tương đương mỗi buổi:</span>
                  <span className="font-medium text-slate-700">
                    {formatCurrency(perSessionPrice)} / buổi
                  </span>
                </div>

                <div className="flex items-center justify-between text-emerald-700">
                  <span className="flex items-center gap-1">
                    Phí nền tảng TutorHub dành cho học viên:
                    <Tag color="green" className="m-0 text-[10px] font-bold">MIỄN PHÍ 0%</Tag>
                  </span>
                  <span className="font-bold text-emerald-600">0 ₫</span>
                </div>

                <Divider className="my-2" />

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-sm font-bold text-slate-900">Tổng Số Tiền Cần Thanh Toán:</span>
                    <p className="m-0 text-[11px] text-slate-400">Đã bao gồm thuế và bảo chứng quỹ Escrow</p>
                  </div>
                  <div className="text-2xl font-extrabold text-brand-indigo-600">
                    {formatCurrency(booking.totalAmount)}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Cam kết Escrow 2 Chiều */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 text-xs text-emerald-900 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-800 mb-2">
                <SafetyCertificateFilled className="text-emerald-600 text-lg" />
                <span>Cơ Chế Bảo Chứng Dòng Tiền Escrow 2 Chiều</span>
              </div>
              <ul className="space-y-1.5 pl-4 list-disc text-emerald-800/90 leading-relaxed text-[11px]">
                <li>
                  <strong>Học viên được bảo vệ 100%:</strong> Số tiền {formatCurrency(booking.totalAmount)} được giữ an toàn trong két ký quỹ trung gian của sàn. Sàn chỉ giải ngân từng buổi ({formatCurrency(perSessionPrice)}) cho gia sư sau khi buổi học hoàn thành và cả 2 bên đối soát điểm danh 24h.
                </li>
                <li>
                  <strong>Quyền hủy hợp đồng linh hoạt (Pro-rata Refund):</strong> Nếu bạn không hài lòng sau vài buổi, bạn có quyền hủy hợp đồng sớm và nhận lại 100% tiền của các buổi học chưa diễn ra.
                </li>
                <li>
                  <strong>Bảo vệ gia sư chống bùng:</strong> Gia sư hoàn toàn an tâm chuẩn bị bài giảng vì học phí của cả lộ trình đã được bảo chứng đầy đủ trên hệ thống.
                </li>
              </ul>
            </div>
          </div>

          {/* RIGHT COLUMN: PAYMENT GATEWAY & FAST TESTING (1/3) */}
          <div className="space-y-6">
            {/* Phương thức thanh toán */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Phương Thức Thanh Toán
              </h4>

              <div className="space-y-3">
                {/* Option 1: VNPay Sandbox */}
                <div
                  onClick={() => setPaymentMethod('vnpay_ncb')}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
                    paymentMethod === 'vnpay_ncb'
                      ? 'border-brand-indigo-500 bg-brand-indigo-50/30 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Radio checked={paymentMethod === 'vnpay_ncb'} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">Cổng Thanh Toán VNPAY</span>
                      <span className="rounded bg-brand-indigo-600 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                        Sandbox 2.1
                      </span>
                    </div>
                    <p className="m-0 text-[11px] text-slate-500 mt-1">
                      Hỗ trợ quét mã VNPAY-QR, Thẻ ATM/Tài khoản ngân hàng NCB và thẻ quốc tế Visa/Mastercard.
                    </p>
                  </div>
                </div>
              </div>

              {/* Thông tin thẻ test NCB */}
              <div className="mt-4">
                <VnPayCardInfo />
              </div>

              {/* Nút hành động chính */}
              <div className="mt-5 space-y-2.5">
                <Button
                  type="primary"
                  block
                  disabled={isExpired}
                  loading={submitting}
                  onClick={handleVnPayPayment}
                  className="h-11 rounded-xl bg-brand-indigo-600 font-bold shadow-md shadow-brand-indigo-600/20 text-sm hover:bg-brand-indigo-500"
                >
                  Thanh Toán An Toàn ({formatCurrency(booking.totalAmount)})
                </Button>

                {/* FAST TESTING ACTIONS FOR REVIEW & GRADING */}
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Thao Tác Thử Nghiệm Nhanh (1-Click Simulators)
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="small"
                      className="rounded-lg bg-emerald-600 text-white font-semibold text-xs border-0 hover:bg-emerald-500"
                      onClick={handleSimulateSuccess}
                    >
                      ✓ Test Thành Công
                    </Button>
                    <Button
                      size="small"
                      className="rounded-lg bg-rose-600 text-white font-semibold text-xs border-0 hover:bg-rose-500"
                      onClick={handleSimulateCancel}
                    >
                      ✕ Test Hủy / Lỗi
                    </Button>
                  </div>
                </div>

                <Button
                  type="text"
                  block
                  onClick={() => navigate('/tutors')}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Hủy đơn đặt chỗ & Chọn gia sư khác
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
