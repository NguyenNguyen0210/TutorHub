import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, InputNumber, Button, Tag, Alert, message, Table } from 'antd';
import {
  BankOutlined,
  SafetyCertificateFilled,
  CheckCircleFilled,
  ArrowLeftOutlined,
  DollarCircleFilled,
} from '@ant-design/icons';
import { formatCurrency } from '@/utils/formatters';
import walletService from '@/services/wallet.service';

export default function TutorWithdraw() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);

  useEffect(() => {
    walletService.getMyWallet().then(setWallet);
    walletService.getWithdrawals().then(setWithdrawals);
  }, []);

  const withdrawableBalance = wallet ? wallet.withdrawableBalance : 700000;
  const bank = wallet?.bankAccount || {
    bankName: 'Ngân Hàng TMCP Ngoại Thương Việt Nam (Vietcombank)',
    accountNumber: '0011001234567',
    accountHolderName: 'NGUYEN VAN AN',
  };

  const onFinish = (values) => {
    setLoading(true);
    walletService.createWithdrawal({
      amount: values.amount,
      note: values.note || 'Yêu cầu rút tiền thù lao'
    }).then((res) => {
      setLoading(false);
      message.success(`Đã khởi tạo lệnh rút ${formatCurrency(values.amount)} thành công!`);
      form.resetFields();
      walletService.getWithdrawals().then(setWithdrawals);
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8 space-y-8">
      {/* Back button */}
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/tutor/wallet')}
        className="p-0 text-slate-500 hover:text-slate-800 text-xs font-semibold"
      >
        Quay lại Trung tâm Ví Escrow
      </Button>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight m-0">
            Yêu Cầu Rút Tiền Về Ngân Hàng
          </h1>
          <p className="text-xs text-slate-500 mt-1 mb-0">
            Chuyển tiền thù lao khả dụng về tài khoản ngân hàng chính chủ KYC trong vòng 2-4 giờ làm việc.
          </p>
        </div>

        <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/40 p-3 px-4 text-right">
          <span className="text-[10px] font-extrabold uppercase text-emerald-700 block">Hạn Mức Khả Dụng Rút:</span>
          <span className="text-xl font-black text-emerald-600">{formatCurrency(withdrawableBalance)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Container */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <BankOutlined className="text-emerald-600 text-2xl" />
            <div className="text-xs">
              <span className="font-bold text-slate-800 block">{bank.bankName}</span>
              <span className="text-slate-500 font-mono font-bold text-[11px]">{bank.accountNumber} • {bank.accountHolderName}</span>
            </div>
            <Tag color="success" className="ml-auto m-0 text-[10px] font-bold">KYC VERIFIED</Tag>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ amount: Math.min(500000, withdrawableBalance) }}
          >
            <Form.Item
              name="amount"
              label={<span className="text-xs font-bold text-slate-700 uppercase">Số Tiền Muốn Rút (₫)</span>}
              rules={[
                { required: true, message: 'Vui lòng nhập số tiền!' },
                {
                  validator: (_, value) => {
                    if (value < 50000) return Promise.reject('Số tiền rút tối thiểu là 50.000 ₫');
                    if (value > withdrawableBalance) return Promise.reject(`Số tiền vượt quá hạn mức khả dụng (${formatCurrency(withdrawableBalance)})`);
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <InputNumber
                className="w-full rounded-xl text-sm"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                min={50000}
                max={withdrawableBalance}
                step={50000}
              />
            </Form.Item>

            <div className="flex gap-2 mb-4">
              {[100000, 200000, 500000, withdrawableBalance].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => form.setFieldsValue({ amount: val })}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 hover:border-emerald-500 hover:text-emerald-700"
                >
                  {val === withdrawableBalance ? 'Toàn bộ' : formatCurrency(val)}
                </button>
              ))}
            </div>

            <Form.Item
              name="note"
              label={<span className="text-xs font-bold text-slate-700 uppercase">Ghi Chú Rút Tiền (Tùy chọn)</span>}
            >
              <Input placeholder="Ví dụ: Rút thù lao giảng dạy tuần 2 tháng 9" className="rounded-xl text-xs py-2" />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              className="h-11 rounded-xl bg-emerald-600 font-bold text-sm shadow-md shadow-emerald-600/25 hover:bg-emerald-500 border-0"
            >
              Xác Nhận Rút Tiền Ngay
            </Button>
          </Form>
        </div>

        {/* Withdrawal History Table */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 m-0">Lịch Sử Lệnh Rút Gần Nhất</h3>

          <div className="space-y-3">
            {withdrawals.map((w) => (
              <div key={w.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-black text-slate-800">{formatCurrency(w.amount)}</span>
                  <Tag color={w.status === 'Completed' ? 'success' : w.status === 'Pending' ? 'processing' : 'error'} className="m-0 text-[10px] font-bold">
                    {w.status === 'Completed' ? 'ĐÃ CHUYỂN' : w.status === 'Pending' ? 'ĐANG DUYỆT' : 'THẤT BẠI'}
                  </Tag>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>{w.bankName || 'VCB'} • {w.accountNumber || '0011001234567'}</span>
                  <span>{w.requestedAt ? new Date(w.requestedAt).toLocaleDateString('vi-VN') : 'Hôm nay'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
