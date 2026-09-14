import React, { useState } from 'react';
import { Button, Switch, Tag, message } from 'antd';
import { ClockCircleOutlined, PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import AvailabilityMatrix from '@/components/discovery/AvailabilityMatrix';

export default function TutorAvailability() {
  const [acceptingStudents, setAcceptingStudents] = useState(true);
  const [availability, setAvailability] = useState([
    { dayOfWeek: 'Monday', startTime: '18:00', endTime: '20:00' },
    { dayOfWeek: 'Wednesday', startTime: '18:00', endTime: '20:00' },
    { dayOfWeek: 'Friday', startTime: '18:00', endTime: '20:00' },
    { dayOfWeek: 'Sunday', startTime: '08:00', endTime: '11:00' },
  ]);

  const handleSave = () => {
    message.success('Đã lưu ma trận lịch rảnh giảng dạy thành công!');
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight m-0">
            Quản Lý Thời Khóa Biểu & Ma Trận Lịch Rảnh
          </h1>
          <p className="text-xs text-slate-500 mt-1 mb-0">
            Học viên sẽ chỉ có thể xếp lịch vào các khung giờ màu xanh khả dụng của bạn.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border shadow-xs text-xs">
            <span className="text-slate-600 font-medium">Nhận học viên mới:</span>
            <Switch checked={acceptingStudents} onChange={(val) => setAcceptingStudents(val)} />
          </div>

          <Button
            type="primary"
            icon={<SaveOutlined />}
            className="rounded-xl bg-brand-indigo-600 font-bold"
            onClick={handleSave}
          >
            Lưu Thay Đổi
          </Button>
        </div>
      </div>

      {/* MATRIX PREVIEW */}
      <AvailabilityMatrix availability={availability} />

      {/* SLOT MANAGEMENT CARDS */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-sm font-bold text-slate-900 m-0">
            Danh Sách Ca Dạy Khả Dụng Trong Tuần (4 Slots Đã Mở)
          </h3>
          <Button size="small" icon={<PlusOutlined />} className="rounded-lg text-xs font-semibold">
            Thêm Khung Giờ Mới
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {availability.map((slot, index) => (
            <div key={index} className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-emerald-900 text-sm">{slot.dayOfWeek}</div>
                <div className="text-emerald-700 font-mono mt-0.5">{slot.startTime} - {slot.endTime}</div>
              </div>
              <Button type="text" danger icon={<DeleteOutlined />} size="small" className="hover:bg-rose-50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
