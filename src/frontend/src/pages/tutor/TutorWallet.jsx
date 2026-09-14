import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tag, Card, Divider } from 'antd';
import {
  WalletFilled,
  SafetyCertificateFilled,
  LockFilled,
  BankOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  HistoryOutlined,
} from '@ant-design/icons';
import { formatCurrency } from '@/utils/formatters';

export default function TutorWallet() {
  const navigate = useNavigate();

  // 4 balances
  const pendingBalance = 3600000;
  const availableBalance = 900000;
  const heldBalance = 200000;
  const withdrawableBalance = availableBalance - heldBalance; // 700.000 ₫

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 sm:p-8 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight m-0">
              Trung Tâm Tài Chính & Ví Bảo Chứng Escrow
            </h1>
            <Tag color="emerald" className="font-bold border-0 px-2.5 py-0.5 rounded-full text-xs">
              ESCROW PROTECTED
            </Tag>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-0">
            Sổ cái kiểm toán bất biến, giám sát dòng tiền ký quỹ và lệnh rút tiền về ngân hàng.
          </p>
        </div>

        <Button
          type="primary"
          size="large"
          className="rounded-xl bg-emerald-600 font-bold hover:bg-emerald-500 border-0 shadow-md shadow-emerald-600/25 h-11 px-6"
          onClick={() => navigate('/tutor/wallet/withdraw')}
        >
          Yêu Cầu Rút Tiền Ngân Hàng <ArrowRightOutlined />
        </Button>
      </div>

      {/* 4 EXCLUSIVE FINANCIAL CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: PendingBalance */}
        <div className="rounded-2xl border border-brand-indigo-100 bg-gradient-to-br from-brand-indigo-50/60 via-white to-slate-50 p-5 shadow-sm">
          <span className="text-xs font-bold uppercase text-brand-indigo-800 tracking-wider">
            1. Đang Giữ Trong Escrow (Pending)
          </span>
          <div className="mt-3 text-2xl font-extrabold text-brand-indigo-700">
            {formatCurrency(pendingBalance)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-medium">
            Ký quỹ bảo chứng cho các buổi học con sắp diễn ra
          </p>
        </div>

        {/* Card 2: AvailableBalance */}
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 p-5 shadow-sm">
          <span className="text-xs font-bold uppercase text-emerald-800 tracking-wider">
            2. Số Dư Khả Dụng (Available)
          </span>
          <div className="mt-3 text-2xl font-extrabold text-emerald-700">
            {formatCurrency(availableBalance)}
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">
            Đã hoàn tất điểm danh & trừ phí sàn 10%
          </p>
        </div>

        {/* Card 3: HeldBalance */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 shadow-sm">
          <span className="text-xs font-bold uppercase text-rose-800 tracking-wider">
            3. Đang Phong Tỏa (Held / Dispute)
          </span>
          <div className="mt-3 text-2xl font-extrabold text-rose-600">
            {formatCurrency(heldBalance)}
          </div>
          <p className="mt-1 text-[11px] text-rose-700 font-medium">
            Phong tỏa tạm thời do có khiếu nại buổi #3
          </p>
        </div>

        {/* Card 4: WithdrawableBalance */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900 text-white p-5 shadow-lg">
          <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider">
            4. Thực Tế Được Rút (Withdrawable)
          </span>
          <div className="mt-3 text-3xl font-extrabold text-emerald-400">
            {formatCurrency(withdrawableBalance)}
          </div>
          <p className="mt-1 text-[11px] text-slate-300 font-medium">
            = Available (900k) - Held (200k)
          </p>
        </div>
      </div>

      {/* KYC BANK ACCOUNT INFO */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 text-2xl">
              <BankOutlined />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">Tài Khoản Ngân Hàng Nhận Tiền Đã KYC</span>
                <Tag color="success" className="font-bold border-0 text-[10px]">ĐÃ XÁC THỰC</Tag>
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                Vietcombank • Số TK: <strong>0071001234567</strong> • Chủ TK: <strong>NGUYEN VAN AN</strong>
              </div>
            </div>
          </div>

          <span className="text-xs text-slate-400 italic">
            Tiền rút sẽ chuyển thẳng về tài khoản này trong 5-15 phút sau khi duyệt.
          </span>
        </div>
      </div>

      {/* IMMUTABLE LEDGER TRANSACTIONS */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 m-0">
              Sổ Cái Kiểm Toán Giao Dịch Bất Biến (Ledger Statement)
            </h3>
            <p className="text-xs text-slate-500 m-0 mt-0.5">
              Mọi biến động số dư đều được kiểm toán mã hóa và lưu trữ vĩnh viễn.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b">
              <tr>
                <th className="p-3">Thời Gian</th>
                <th className="p-3">Loại Giao Dịch</th>
                <th className="p-3">Biến Động</th>
                <th className="p-3">Số Dư Sau Biến Động</th>
                <th className="p-3">Mô Tả & Hợp Đồng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/50">
                <td className="p-3 text-slate-500 font-mono">12/09/2026 19:05</td>
                <td className="p-3">
                  <Tag color="green" className="font-bold border-0 text-[10px]">GIẢI NGÂN BUỔI HỌC</Tag>
                </td>
                <td className="p-3 font-bold text-emerald-600">+ 180.000 ₫</td>
                <td className="p-3 font-bold text-slate-800">900.000 ₫</td>
                <td className="p-3 text-slate-600">Giải ngân Buổi 2 (200k - 10% phí sàn = 180k) • CTR-2026-THB-001</td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="p-3 text-slate-500 font-mono">10/09/2026 19:05</td>
                <td className="p-3">
                  <Tag color="green" className="font-bold border-0 text-[10px]">GIẢI NGÂN BUỔI HỌC</Tag>
                </td>
                <td className="p-3 font-bold text-emerald-600">+ 180.000 ₫</td>
                <td className="p-3 font-bold text-slate-800">720.000 ₫</td>
                <td className="p-3 text-slate-600">Giải ngân Buổi 1 (200k - 10% phí sàn = 180k) • CTR-2026-THB-001</td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="p-3 text-slate-500 font-mono">08/09/2026 14:20</td>
                <td className="p-3">
                  <Tag color="blue" className="font-bold border-0 text-[10px]">KÝ QUỸ ESCROW</Tag>
                </td>
                <td className="p-3 font-bold text-brand-indigo-600">+ 2.000.000 ₫ (Pending)</td>
                <td className="p-3 font-bold text-slate-800">3.600.000 ₫ (Pending)</td>
                <td className="p-3 text-slate-600">Học viên Tuấn thanh toán gói 10 buổi THPT • Ký quỹ két Escrow</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
