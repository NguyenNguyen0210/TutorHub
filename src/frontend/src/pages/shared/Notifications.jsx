import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { message } from 'antd';

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('All');

  const notifications = [
    {
      id: 'notif-1',
      category: 'Financial',
      icon: 'payment',
      borderColor: 'border-l-brand-indigo-600',
      title: 'Thanh toán hợp đồng thành công!',
      time: '10 phút trước',
      content: 'Bạn đã thanh toán 2.000.000 ₫ cho gói học Luyện thi THPT Toán 10 buổi. Học phí đang được bảo toàn trong Ví Escrow.',
      actionLink: '/student/enrollments/e1e1e1e1-0001',
      actionText: 'Xem Hợp Đồng',
      unread: true,
    },
    {
      id: 'notif-2',
      category: 'Attendance',
      icon: 'schedule',
      borderColor: 'border-l-amber-500',
      title: 'Cửa sổ đối soát điểm danh 24h sắp kết thúc',
      time: '2 giờ trước',
      content: 'Buổi học Toán #2 đã kết thúc. Vui lòng xác nhận điểm danh trước 18:00 hôm nay để tiền giải ngân cho gia sư.',
      actionLink: '/student/sessions/s2',
      actionText: 'Xác Nhận Điểm Danh Ngay',
      unread: true,
    },
    {
      id: 'notif-3',
      category: 'Dispute',
      icon: 'gavel',
      borderColor: 'border-l-rose-500',
      title: 'Cập nhật phán quyết tranh chấp buổi #3',
      time: 'Hôm qua',
      content: 'Admin đã xử lý đơn khiếu nại của bạn: Hoàn trả 200.000 ₫ về ví học viên thành công theo cơ chế DEC-S8-025.',
      actionLink: '/student/dashboard',
      actionText: 'Xem Chi Tiết Phán Quyết',
      unread: false,
    },
    {
      id: 'notif-4',
      category: 'Discipline',
      icon: 'warning',
      borderColor: 'border-l-rose-600',
      title: 'Cảnh báo vi phạm vắng mặt (0 / 3 Strikes)',
      time: '3 ngày trước',
      content: 'Tài khoản của bạn hiện có uy tín 100%. Tích lũy đủ 3 lần vắng mặt không phép sẽ bị tạm khóa đặt lịch.',
      actionLink: '/student/dashboard',
      actionText: 'Xem Quy Chế Sàn',
      unread: false,
    }
  ];

  const filtered = activeTab === 'All'
    ? notifications
    : notifications.filter((n) => n.category === activeTab);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Trung Tâm Thông Báo & Cảnh Báo Hệ Thống
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Theo dõi tức thời các biến động tài chính, đối soát điểm danh 24h và thông báo hợp đồng
          </p>
        </div>

        <button
          type="button"
          onClick={() => message.success('Đã đánh dấu tất cả thông báo là đã đọc')}
          className="text-xs font-bold text-brand-indigo-600 hover:underline self-start sm:self-auto"
        >
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-light pb-2 text-xs font-bold overflow-x-auto">
        {[
          { key: 'All', label: 'Tất Cả (4)' },
          { key: 'Financial', label: 'Tài Chính & Escrow' },
          { key: 'Attendance', label: 'Lịch Học & Điểm Danh' },
          { key: 'Dispute', label: 'Tranh Chấp & Kỷ Luật' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 rounded-xl transition-colors ${
              activeTab === t.key ? 'bg-brand-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Notification Cards */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`p-5 rounded-2xl bg-white border border-border-light border-l-4 ${item.borderColor} shadow-xs space-y-2`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-slate-600">{item.icon}</span>
                <h3 className="font-bold text-xs text-slate-900">{item.title}</h3>
                {item.unread && (
                  <span className="w-2 h-2 rounded-full bg-brand-indigo-600"></span>
                )}
              </div>
              <span className="text-[10px] text-text-muted">{item.time}</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed pl-6">{item.content}</p>

            <div className="pt-2 pl-6">
              <Link
                to={item.actionLink}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-indigo-50 hover:text-brand-indigo-600 text-slate-700 text-xs font-bold transition-colors inline-block"
              >
                {item.actionText}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
