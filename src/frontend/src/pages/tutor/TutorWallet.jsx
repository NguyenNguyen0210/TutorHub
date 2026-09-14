import React, { useState, useEffect } from 'react';
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
import walletService from '@/services/wallet.service';

export default function TutorWallet() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);

  useEffect(() => {
    walletService.getMyWallet().then(setWallet);
    walletService.getWithdrawals().then(setWithdrawals);
  }, []);

  const pendingBalance = wallet ? wallet.pendingBalance : 3600000;
  const availableBalance = wallet ? wallet.availableBalance : 900000;
  const heldBalance = wallet ? wallet.heldBalance : 200000;
  const withdrawableBalance = wallet ? wallet.withdrawableBalance : 700000;
  const bank = wallet?.bankAccount || {
    bankName: 'Ngân Hàng TMCP Ngoại Thương Việt Nam (Vietcombank)',
    accountNumber: '0011001234567',
    accountHolderName: 'NGUYEN VAN AN',
  };

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
          Tạo Lệnh Rút Tiền →
        </Button>
      </div>

      {/* 4 FINANCIAL BALANCES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Pending Balance */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tiền Chờ Giải Ngân (Pending)</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <LockFilled />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(pendingBalance)}</div>
            <p className="text-[11px] text-slate-400 mt-1 mb-0">
              Khóa trong Escrow cho 4 buổi học chưa hoàn thành
            </p>
          </div>
        </div>

        {/* Card 2: Available Balance */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Số Dư Đã Giải Ngân (Available)</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <WalletFilled />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(availableBalance)}</div>
            <p className="text-[11px] text-slate-400 mt-1 mb-0">
              Thù lao tích lũy từ các buổi học đã xác nhận điểm danh
            </p>
          </div>
        </div>

        {/* Card 3: Held Balance */}
        <div className="rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/40 via-white to-white p-6 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Tạm Giữ Tranh Chấp (Held)</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
              <SafetyCertificateFilled />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600 tracking-tight">{formatCurrency(heldBalance)}</div>
            <p className="text-[11px] text-rose-500 mt-1 mb-0">
              Phong tỏa bảo đảm quyền lợi khiếu nại buổi #3
            </p>
          </div>
        </div>

        {/* Card 4: Withdrawable Balance (DEC-WD-001) */}
        <div className="rounded-2xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-50/50 via-white to-white p-6 shadow-md shadow-emerald-500/10 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">Khả Dụng Rút Tiền</span>
            <Tag color="success" className="font-bold border-0 text-[10px] m-0">DEC-WD-001</Tag>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 tracking-tight">{formatCurrency(withdrawableBalance)}</div>
            <p className="text-[11px] text-slate-500 mt-1 mb-0">
              = Available (900k) - Held (200k) phong tỏa
            </p>
          </div>
        </div>
      </div>

      {/* KYC BANK ACCOUNT & IMMUTABLE LEDGER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KYC Bank Info */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BankOutlined className="text-emerald-600 text-lg" />
              <h3 className="text-sm font-bold text-slate-900 m-0">Tài Khoản Ngân Hàng Thụ Hưởng</h3>
            </div>
            <Tag color="success" className="m-0 text-[10px] font-bold">XÁC MINH KYC</Tag>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Ngân Hàng:</span>
              <span className="font-bold text-slate-800">{bank.bankName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Số Tài Khoản:</span>
              <span className="font-mono font-bold text-slate-900 text-sm tracking-wide">{bank.accountNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Chủ Tài Khoản:</span>
              <span className="font-bold text-slate-800 uppercase">{bank.accountHolderName}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            * Lệnh rút tiền chỉ được chuyển về tài khoản chính chủ đã xác minh KYC danh tính.
          </p>
        </div>

        {/* Immutable Ledger Statement Table */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <HistoryOutlined className="text-indigo-600 text-lg" />
              <h3 className="text-sm font-bold text-slate-900 m-0">Lịch Sử Biến Động Sổ Cái (Audit Trail)</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Append-Only Immutability</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Thời Gian</th>
                  <th className="py-2.5 px-3">Mã GD / Sự Kiện</th>
                  <th className="py-2.5 px-3">Loại Giao Dịch</th>
                  <th className="py-2.5 px-3 text-right">Biến Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <tr>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">13/09 20:30</td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-800">DISP-HELD-003</td>
                  <td className="py-3 px-3"><Tag color="error">Held Tranh Chấp #3</Tag></td>
                  <td className="py-3 px-3 text-right font-bold text-rose-600">-200.000 ₫ (Phong tỏa)</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">12/09 19:30</td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-800">PAYOUT-SES-002</td>
                  <td className="py-3 px-3"><Tag color="success">Giải Ngân Buổi #2</Tag></td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-600">+180.000 ₫</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">10/09 19:30</td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-800">PAYOUT-SES-001</td>
                  <td className="py-3 px-3"><Tag color="success">Giải Ngân Buổi #1</Tag></td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-600">+180.000 ₫</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">08/09 14:15</td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-800">ESCROW-LOCK-10S</td>
                  <td className="py-3 px-3"><Tag color="purple">Ký Quỹ Hợp Đồng 10 Buổi</Tag></td>
                  <td className="py-3 px-3 text-right font-bold text-amber-600">+2.000.000 ₫ (Pending)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
