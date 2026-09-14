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
        // Æ¯u tiÃªn state truyá»n tá»« ServiceCard náº¿u cÃ³
        const state = location.state;
        if (state && state.serviceId) {
          const now = new Date();
          const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
          setBooking({
            id: id || 'b1b1b1b1-0001-0000-0000-000000000001',
            serviceId: state.serviceId,
            serviceTitle: state.serviceTitle || 'Luyá»‡n thi THPT ToÃ¡n 10 buá»•i',
            tutorName: state.tutorName || 'ThS. Nguyá»…n VÄƒn An',
            tutorAvatar: state.tutorAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=an',
            tutorEducation: 'Cá»­ nhÃ¢n SÆ° pháº¡m ToÃ¡n - ÄH SÆ° pháº¡m HÃ  Ná»™i',
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
        console.error('Lá»—i khi táº£i Ä‘Æ¡n Ä‘áº·t chá»—:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBookingData();
  }, [id, location.state]);

  const handleExpire = () => {
    setIsExpired(true);
    message.error('ÄÆ¡n giá»¯ chá»— 15 phÃºt Ä‘Ã£ háº¿t háº¡n! Slot há»c Ä‘Ã£ Ä‘Æ°á»£c giáº£i phÃ³ng.');
  };

  // Thanh toÃ¡n VNPay Sandbox
  const handleVnPayPayment = async () => {
    if (isExpired) {
      message.error('ÄÆ¡n giá»¯ chá»— Ä‘Ã£ háº¿t háº¡n. Vui lÃ²ng Ä‘áº·t láº¡i gÃ³i há»c.');
      return;
    }

    setSubmitting(true);
    try {
      const paymentUrl = await paymentService.createVnPayUrl(booking.id);
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        // MÃ´ phá»ng redirect sang return URL cá»§a VNPay Sandbox
        const amountParam = booking.totalAmount * 100;
        navigate(`/payment/return?vnp_ResponseCode=00&vnp_TxnRef=${booking.id}&vnp_Amount=${amountParam}&vnp_BankCode=NCB&vnp_OrderInfo=Thanh+toan+khoa+hoc+TutorHub`);
      }
    } catch (err) {
      message.error('KhÃ´ng thá»ƒ khá»Ÿi táº¡o cá»•ng thanh toÃ¡n VNPay.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spin size="large" tip="Äang khá»Ÿi táº¡o phiÃªn giá»¯ chá»— 15 phÃºt..." />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-12 text-center">
        <h3>KhÃ´ng tÃ¬m tháº¥y thÃ´ng tin Ä‘Æ¡n giá»¯ chá»—!</h3>
        <Button onClick={() => navigate('/tutors')}>Quay láº¡i danh sÃ¡ch gia sÆ°</Button>
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
              { title: <Link to="/">Trang chá»§</Link> },
              { title: <Link to="/tutors">Gia sÆ°</Link> },
              { title: 'Thanh toÃ¡n giá»¯ chá»— 15 phÃºt' },
            ]}
          />
          <Link
            to="/tutors"
            className="flex items-center gap-1 font-medium text-slate-500 hover:text-brand-indigo-600"
          >
            <ArrowLeftOutlined /> Há»§y giá»¯ chá»— & Quay láº¡i
          </Link>
        </div>
      </div>

      {/* Stepper Header */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5 text-brand-indigo-600">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-indigo-600 text-white text-xs">1</span>
              <span>Giá»¯ Chá»— 15 PhÃºt</span>
            </span>
            <span className="h-0.5 w-12 bg-brand-indigo-200"></span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-600 text-xs">2</span>
              <span>Thanh ToÃ¡n VNPay</span>
            </span>
            <span className="h-0.5 w-12 bg-slate-200"></span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-600 text-xs">3</span>
              <span>KÃ­ch Hoáº¡t Há»£p Äá»“ng Escrow</span>
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
            message="ÄÆ¡n Giá»¯ Chá»— ÄÃ£ Háº¿t Háº¡n"
            description="Thá»i gian khÃ³a slot 15 phÃºt Ä‘Ã£ káº¿t thÃºc. Vui lÃ²ng quay láº¡i danh má»¥c gia sÆ° vÃ  báº¥m Ä‘áº·t mua láº¡i Ä‘á»ƒ Ä‘áº£m báº£o slot há»c cá»§a báº¡n khÃ´ng bá»‹ trÃ¹ng vá»›i há»c viÃªn khÃ¡c."
            showIcon
            action={
              <Button size="small" danger onClick={() => navigate('/tutors')}>
                Äáº·t Chá»— Má»›i
              </Button>
            }
            className="mb-6 rounded-2xl"
          />
        )}

        {/* 2-COLUMN MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* LEFT COLUMN: ORDER DETAILS & ESCROW TRUST (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card 1: GÃ³i há»c & Gia sÆ° */}
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
                        <CheckCircleFilled /> ÄÃƒ XÃC MINH
                      </Tag>
                    </div>
                    <p className="m-0 mt-0.5 text-xs text-brand-indigo-600 font-medium">
                      {booking.tutorEducation}
                    </p>
                  </div>
                </div>

                <Tag color="purple" className="font-semibold text-xs px-2.5 py-1 rounded-lg">
                  {booking.teachingMode === 'Both' ? 'Online & Táº¡i nhÃ ' : booking.teachingMode}
                </Tag>
              </div>

              {/* Package Details */}
              <div className="mt-5">
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {booking.serviceTitle}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2">
                  <span className="flex items-center gap-1.5 font-semibold text-brand-indigo-700 bg-brand-indigo-50 px-2.5 py-1 rounded-lg">
                    <CalendarOutlined /> Há»£p Ä‘á»“ng {booking.totalSessions} buá»•i há»c
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    <ClockCircleOutlined /> {booking.sessionDurationMinutes} phÃºt / buá»•i
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Báº£ng chiáº¿t tÃ­nh há»c phÃ­ */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">
                Chi Tiáº¿t Chiáº¿t TÃ­nh Há»c PhÃ­
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">
                    Há»c phÃ­ trá»n gÃ³i ({booking.totalSessions} buá»•i x {booking.sessionDurationMinutes}p):
                  </span>
                  <span className="font-bold text-slate-800 text-sm">
                    {formatCurrency(booking.price)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-500">
                  <span>ÄÆ¡n giÃ¡ tÆ°Æ¡ng Ä‘Æ°Æ¡ng má»—i buá»•i:</span>
                  <span className="font-medium text-slate-700">
                    {formatCurrency(perSessionPrice)} / buá»•i
                  </span>
                </div>

                <div className="flex items-center justify-between text-emerald-700">
                  <span className="flex items-center gap-1">
                    PhÃ­ ná»n táº£ng TutorHub dÃ nh cho há»c viÃªn:
                    <Tag color="green" className="m-0 text-[10px] font-bold">MIá»„N PHÃ 0%</Tag>
                  </span>
                  <span className="font-bold text-emerald-600">0 â‚«</span>
                </div>

                <Divider className="my-2" />

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-sm font-bold text-slate-900">Tá»•ng Sá»‘ Tiá»n Cáº§n Thanh ToÃ¡n:</span>
                    <p className="m-0 text-[11px] text-slate-400">ÄÃ£ bao gá»“m thuáº¿ vÃ  báº£o chá»©ng quá»¹ Escrow</p>
                  </div>
                  <div className="text-2xl font-extrabold text-brand-indigo-600">
                    {formatCurrency(booking.totalAmount)}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Cam káº¿t Escrow 2 Chiá»u */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 text-xs text-emerald-900 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-800 mb-2">
                <SafetyCertificateFilled className="text-emerald-600 text-lg" />
                <span>CÆ¡ Cháº¿ Báº£o Chá»©ng DÃ²ng Tiá»n Escrow 2 Chiá»u</span>
              </div>
              <ul className="space-y-1.5 pl-4 list-disc text-emerald-800/90 leading-relaxed text-[11px]">
                <li>
                  <strong>Há»c viÃªn Ä‘Æ°á»£c báº£o vá»‡ 100%:</strong> Sá»‘ tiá»n {formatCurrency(booking.totalAmount)} Ä‘Æ°á»£c giá»¯ an toÃ n trong kÃ©t kÃ½ quá»¹ trung gian cá»§a sÃ n. SÃ n chá»‰ giáº£i ngÃ¢n tá»«ng buá»•i ({formatCurrency(perSessionPrice)}) cho gia sÆ° sau khi buá»•i há»c hoÃ n thÃ nh vÃ  cáº£ 2 bÃªn Ä‘á»‘i soÃ¡t Ä‘iá»ƒm danh 24h.
                </li>
                <li>
                  <strong>Quyá»n há»§y há»£p Ä‘á»“ng linh hoáº¡t (Pro-rata Refund):</strong> Náº¿u báº¡n khÃ´ng hÃ i lÃ²ng sau vÃ i buá»•i, báº¡n cÃ³ quyá»n há»§y há»£p Ä‘á»“ng sá»›m vÃ  nháº­n láº¡i 100% tiá»n cá»§a cÃ¡c buá»•i há»c chÆ°a diá»…n ra.
                </li>
                <li>
                  <strong>Báº£o vá»‡ gia sÆ° chá»‘ng bÃ¹ng:</strong> Gia sÆ° hoÃ n toÃ n an tÃ¢m chuáº©n bá»‹ bÃ i giáº£ng vÃ¬ há»c phÃ­ cá»§a cáº£ lá»™ trÃ¬nh Ä‘Ã£ Ä‘Æ°á»£c báº£o chá»©ng Ä‘áº§y Ä‘á»§ trÃªn há»‡ thá»‘ng.
                </li>
              </ul>
            </div>
          </div>

          {/* RIGHT COLUMN: PAYMENT GATEWAY & FAST TESTING (1/3) */}
          <div className="space-y-6">
            {/* PhÆ°Æ¡ng thá»©c thanh toÃ¡n */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                PhÆ°Æ¡ng Thá»©c Thanh ToÃ¡n
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
                      <span className="font-bold text-xs text-slate-800">Cá»•ng Thanh ToÃ¡n VNPAY</span>
                      <span className="rounded bg-brand-indigo-600 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                        Sandbox 2.1
                      </span>
                    </div>
                    <p className="m-0 text-[11px] text-slate-500 mt-1">
                      Há»— trá»£ quÃ©t mÃ£ VNPAY-QR, Tháº» ATM/TÃ i khoáº£n ngÃ¢n hÃ ng NCB vÃ  tháº» quá»‘c táº¿ Visa/Mastercard.
                    </p>
                  </div>
                </div>
              </div>

              {/* ThÃ´ng tin tháº» test NCB */}
              <div className="mt-4">
                <VnPayCardInfo />
              </div>

              {/* NÃºt hÃ nh Ä‘á»™ng chÃ­nh */}
              <div className="mt-5 space-y-2.5">
                <Button
                  type="primary"
                  block
                  disabled={isExpired}
                  loading={submitting}
                  onClick={handleVnPayPayment}
                  className="h-11 rounded-xl bg-brand-indigo-600 font-bold shadow-md shadow-brand-indigo-600/20 text-sm hover:bg-brand-indigo-500"
                >
                  Thanh ToÃ¡n An ToÃ n ({formatCurrency(booking.totalAmount)})
                </Button>
                <Button
                  type="text"
                  block
                  onClick={() => navigate('/tutors')}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Há»§y Ä‘Æ¡n Ä‘áº·t chá»— & Chá»n gia sÆ° khÃ¡c
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
