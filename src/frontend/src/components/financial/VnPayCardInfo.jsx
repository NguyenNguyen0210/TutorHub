import React from 'react';
import { message } from 'antd';
import { CopyOutlined, CreditCardFilled, CheckOutlined } from '@ant-design/icons';

export default function VnPayCardInfo() {
  const [copiedKey, setCopiedKey] = React.useState(null);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    message.success(`Đã sao chép: ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const cardData = [
    { label: 'Ngân hàng', value: 'NCB (Ngân hàng Quốc Dân)', key: 'bank' },
    { label: 'Số thẻ test', value: '9704198526191432198', key: 'cardNumber', isCode: true },
    { label: 'Tên chủ thẻ', value: 'NGUYEN VAN A', key: 'cardHolder', isCode: true },
    { label: 'Ngày phát hành', value: '07/15', key: 'issueDate', isCode: true },
    { label: 'Mã OTP SMS', value: '123456', key: 'otp', isCode: true },
  ];

  return (
    <div className="rounded-2xl border border-brand-indigo-100 bg-gradient-to-br from-brand-indigo-50/40 via-white to-slate-50 p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <CreditCardFilled className="text-brand-indigo-600 text-base" />
          <span className="font-bold text-xs text-slate-900 uppercase tracking-wide">
            Thông Tin Thẻ Test VNPay Sandbox
          </span>
        </div>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
          Môi Trường Kiểm Thử
        </span>
      </div>

      <div className="space-y-2 text-xs">
        {cardData.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-2 py-0.5">
            <span className="text-slate-500 font-medium">{item.label}:</span>
            <div className="flex items-center gap-1.5">
              <span className={`font-bold ${item.isCode ? 'font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]' : 'text-slate-800'}`}>
                {item.value}
              </span>
              <button
                onClick={() => copyToClipboard(item.value, item.key)}
                className="text-slate-400 hover:text-brand-indigo-600 p-1 rounded transition-colors"
                title="Sao chép"
              >
                {copiedKey === item.key ? (
                  <CheckOutlined className="text-emerald-600 text-xs" />
                ) : (
                  <CopyOutlined className="text-xs" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="m-0 mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-400 italic">
        * Đây là thẻ test giả lập của cổng VNPay Sandbox 2.1.0, không trừ tiền thật.
      </p>
    </div>
  );
}
