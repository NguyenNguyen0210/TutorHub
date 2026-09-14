import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tag, Progress, Avatar, Alert } from 'antd';
import {
  SafetyCertificateFilled,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleFilled,
  VideoCameraFilled,
  WalletFilled,
  ArrowRightOutlined,
  ThunderboltFilled,
  WarningFilled,
} from '@ant-design/icons';
import { formatCurrency } from '@/utils/formatters';

export default function TutorDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 sm:p-8 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight m-0">
              Bảng Điều Hành Gia Sư — ThS. Nguyễn Văn An 👋
            </h1>
            <Tag color="emerald" className="font-bold border-0 px-2.5 py-0.5 rounded-full text-xs">
              VERIFIED TUTOR
            </Tag>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-0">
            Quản trị lịch dạy, chỉ số uy tín sàn và dòng tiền giải ngân từ két Escrow.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="primary"
            className="rounded-xl bg-brand-indigo-600 font-bold shadow-sm hover:bg-brand-indigo-500"
            onClick={() => navigate('/tutor/wallet/withdraw')}
          >
            Rút Tiền Nhanh
          </Button>
          <Button
            className="rounded-xl border-slate-300 font-semibold text-slate-700 hover:text-brand-indigo-600"
            onClick={() => navigate('/tutor/availability')}
          >
            Quản Lý Lịch Rảnh
          </Button>
        </div>
      </div>

      {/* 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Available Balance */}
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-emerald-800 tracking-wider">
              Số Dư Khả Dụng (Available)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <WalletFilled />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-emerald-700">
            {formatCurrency(900000)}
          </div>
          <p className="mt-1 text-[11px] text-emerald-600/90 font-medium">
            Đã trừ phí sàn 10% • Sẵn sàng rút
          </p>
        </div>

        {/* Card 2: Pending in Escrow */}
        <div className="rounded-2xl border border-brand-indigo-100 bg-gradient-to-br from-brand-indigo-50/60 via-white to-slate-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-brand-indigo-800 tracking-wider">
              Đang Giữ Trong Escrow
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-indigo-100 text-brand-indigo-600">
              <SafetyCertificateFilled />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-brand-indigo-700">
            {formatCurrency(3600000)}
          </div>
          <p className="mt-1 text-[11px] text-brand-indigo-600 font-medium">
            Giải ngân dần theo từng buổi dạy
          </p>
        </div>

        {/* Card 3: Class Today */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-600 tracking-wider">
              Ca Dạy Hôm Nay
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <CalendarOutlined />
            </div>
          </div>
          <div className="mt-3 text-xl font-extrabold text-slate-900">
            18:00 - 19:00
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-medium">
            Học viên: Phạm Minh Tuấn • Toán THPT
          </p>
        </div>

        {/* Card 4: Absent Strikes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-600 tracking-wider">
              Chỉ Số Uy Tín (Strikes)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <CheckCircleFilled />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-emerald-600">
            0 / 2 <span className="text-xs font-normal text-slate-400">Strikes</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">
            Tuyệt đối uy tín • Không vi phạm
          </p>
        </div>
      </div>

      {/* TODAY'S CLASS BANNER */}
      <div className="rounded-2xl border border-brand-indigo-200 bg-gradient-to-r from-brand-indigo-900 to-brand-navy-950 p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-indigo-500/30 px-3 py-1 text-xs font-bold text-brand-indigo-200 border border-brand-indigo-400/30 mb-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              LỚP DẠY SẮP DIỄN RA
            </span>
            <h3 className="text-xl font-bold text-white m-0">
              Buổi 3: Giá trị lớn nhất & nhỏ nhất trên đoạn (Thực chiến Casio)
            </h3>
            <p className="m-0 mt-1 text-xs text-slate-300">
              Học viên: <strong className="text-white">Phạm Minh Tuấn</strong> • Thời gian: Hôm nay 18:00 - 19:00 (60 phút) • Link Google Meet bảo mật
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="primary"
              size="large"
              icon={<VideoCameraFilled />}
              className="rounded-xl bg-emerald-600 font-bold border-0 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 h-11"
              href="https://meet.google.com/tutorhub-s3-math"
              target="_blank"
            >
              Vào Giảng Dạy Google Meet
            </Button>
          </div>
        </div>
      </div>

      {/* ACTIVE STUDENTS & ENROLLMENTS TABLE */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 m-0">
              Học Viên Đang Theo Học (Active Contracts)
            </h3>
            <p className="text-xs text-slate-500 m-0 mt-0.5">
              Học phí được bảo chứng đầy đủ trong Escrow, tự động giải ngân sau mỗi buổi dạy.
            </p>
          </div>
          <Button
            type="link"
            className="text-xs font-bold text-brand-indigo-600"
            onClick={() => navigate('/tutor/services')}
          >
            Quản lý gói dịch vụ →
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b">
              <tr>
                <th className="p-3">Học Viên</th>
                <th className="p-3">Gói Dịch Vụ</th>
                <th className="p-3">Tiến Độ</th>
                <th className="p-3">Học Phí Ký Quỹ</th>
                <th className="p-3">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/50">
                <td className="p-3 flex items-center gap-3">
                  <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=tuan" size={36} />
                  <div>
                    <div className="font-bold text-slate-900">Phạm Minh Tuấn</div>
                    <div className="text-[11px] text-slate-400">student.tuan@tutorhub.com</div>
                  </div>
                </td>
                <td className="p-3 font-medium text-slate-700">
                  Luyện thi THPT Toán 10 buổi Thực Chiến
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">2/10 buổi</span>
                    <Progress percent={20} size="small" strokeColor="#4F46E5" className="w-20 m-0" />
                  </div>
                </td>
                <td className="p-3 font-bold text-emerald-700">
                  {formatCurrency(1600000)} (Escrow)
                </td>
                <td className="p-3">
                  <Button
                    size="small"
                    className="rounded-lg text-xs font-semibold text-brand-indigo-600 border-brand-indigo-200 hover:bg-brand-indigo-50"
                    onClick={() => navigate('/student/enrollments/e1e1e1e1-0001')}
                  >
                    Xem Hợp Đồng
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
