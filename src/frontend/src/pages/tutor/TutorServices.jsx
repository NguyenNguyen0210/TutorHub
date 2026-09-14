import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tag, Divider, message } from 'antd';
import { PlusOutlined, EditOutlined, CheckCircleFilled, ThunderboltFilled } from '@ant-design/icons';
import { formatCurrency } from '@/utils/formatters';

export default function TutorServices() {
  const navigate = useNavigate();

  const services = [
    {
      id: '5e521ce5-0001',
      title: 'Luyện thi THPT Toán 10 buổi Thực Chiến',
      sessions: 10,
      duration: 60,
      price: 2000000,
      status: 'Published',
      activeStudents: 1,
      totalRevenue: 2000000,
    },
    {
      id: '5e521ce5-0002',
      title: 'Toán Nâng Cao 15 buổi Chuyên Đề 9+',
      sessions: 15,
      duration: 90,
      price: 3500000,
      status: 'Published',
      activeStudents: 0,
      totalRevenue: 0,
    },
    {
      id: '5e521ce5-0003',
      title: 'Lấy gốc Toán THCS lớp 9 vào 10',
      sessions: 12,
      duration: 60,
      price: 1800000,
      status: 'Draft',
      activeStudents: 0,
      totalRevenue: 0,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight m-0">
            Quản Lý Danh Mục Gói Dịch Vụ Niêm Yết
          </h1>
          <p className="text-xs text-slate-500 mt-1 mb-0">
            Các gói học trọn gói được bảo chứng Escrow niêm yết công khai trên Marketplace.
          </p>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="rounded-xl bg-brand-indigo-600 font-bold"
          onClick={() => message.info('Mở form tạo gói học mới.')}
        >
          Tạo Gói Dịch Vụ Mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((svc) => (
          <div
            key={svc.id}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between transition-all hover:border-brand-indigo-300 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <Tag
                  color={svc.status === 'Published' ? 'emerald' : 'default'}
                  className="font-bold border-0 text-[10px] px-2.5 py-0.5 rounded-full"
                >
                  {svc.status === 'Published' ? 'ĐANG NIÊM YẾT' : 'BẢN NHÁP'}
                </Tag>
                <span className="text-xs text-slate-400 font-mono">ID: {svc.id}</span>
              </div>

              <h3 className="text-base font-bold text-slate-900 m-0 mb-2">
                {svc.title}
              </h3>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div>Số buổi: <strong className="text-slate-800">{svc.sessions} buổi x {svc.duration}p</strong></div>
                <div>Đang học: <strong className="text-brand-indigo-600">{svc.activeStudents} học viên</strong></div>
                <div>Đã thu về: <strong className="text-emerald-700">{formatCurrency(svc.totalRevenue)}</strong></div>
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-xs text-slate-400">Giá gói trọn gói</span>
                <span className="text-xl font-extrabold text-brand-indigo-600">
                  {formatCurrency(svc.price)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button size="small" icon={<EditOutlined />} className="flex-1 rounded-lg text-xs font-semibold">
                  Chỉnh Sửa
                </Button>
                {svc.status === 'Published' ? (
                  <Button size="small" danger className="rounded-lg text-xs">
                    Gỡ Khỏi Sàn
                  </Button>
                ) : (
                  <Button size="small" type="primary" className="rounded-lg text-xs bg-emerald-600 border-0">
                    Đăng Bán
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
