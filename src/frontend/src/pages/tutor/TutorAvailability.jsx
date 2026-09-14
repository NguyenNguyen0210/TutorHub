import React, { useState } from 'react';
import { message } from 'antd';

export default function TutorAvailability() {
  const [acceptingStudents, setAcceptingStudents] = useState(true);

  const daysOfWeek = [
    { name: 'Thứ Hai', slots: [{ time: '18:00 - 19:00', booked: true, student: 'Phạm Minh Tuấn' }, { time: '19:00 - 20:00', booked: false }] },
    { name: 'Thứ Ba', slots: [{ time: '18:00 - 20:00', booked: false }] },
    { name: 'Thứ Tư', slots: [{ time: '18:00 - 19:30', booked: true, student: 'Đặng Quốc Hùng' }] },
    { name: 'Thứ Năm', slots: [{ time: '18:00 - 20:00', booked: false }] },
    { name: 'Thứ Sáu', slots: [{ time: '18:00 - 19:00', booked: true, student: 'Phạm Minh Tuấn' }] },
    { name: 'Thứ Bảy', slots: [] },
    { name: 'Chủ Nhật', slots: [{ time: '08:00 - 11:00', booked: false }] },
  ];

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Quản Lý Thời Khóa Biểu & Khung Giờ Rảnh
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Thiết lập lịch rảnh hàng tuần theo múi giờ Asia/Ho_Chi_Minh (UTC+7)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setAcceptingStudents(!acceptingStudents);
              message.info(`Trạng thái nhận học viên: ${!acceptingStudents ? 'Đang nhận dạy' : 'Tạm dừng'}`);
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors ${
              acceptingStudents ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {acceptingStudents ? 'Đang Nhận Dạy ✅' : 'Tạm Dừng Tuyển Sinh'}
          </button>

          <button
            type="button"
            onClick={() => message.success('Mở hộp thoại tạo khung giờ rảnh mới')}
            className="px-4 py-2.5 rounded-xl bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Thêm Khung Giờ Mới
          </button>
        </div>
      </div>

      {/* Weekly Matrix Calendar Grid (7 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {daysOfWeek.map((day, idx) => (
          <div key={idx} className="p-4 rounded-2xl bg-white border border-border-light shadow-xs space-y-3 flex flex-col justify-between min-h-[260px]">
            <div>
              <span className="font-bold text-xs text-slate-900 block pb-2 border-b border-border-light">{day.name}</span>
              <div className="space-y-2 mt-3">
                {day.slots.length === 0 ? (
                  <p className="text-[11px] text-text-muted italic py-4 text-center">Nghỉ chuyên môn</p>
                ) : (
                  day.slots.map((s, sIdx) => (
                    <div
                      key={sIdx}
                      className={`p-2.5 rounded-xl text-xs space-y-1 ${
                        s.booked
                          ? 'bg-brand-indigo-50 border border-brand-indigo-200 text-brand-indigo-900'
                          : 'bg-emerald-50/70 border border-emerald-200/80 text-emerald-800'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold font-monospace-num text-[11px]">
                        <span>{s.time}</span>
                      </div>
                      <span className="text-[10px] block truncate font-medium">
                        {s.booked ? `Lịch: ${s.student}` : 'Trống (Sẵn sàng)'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              type="button"
              className="w-full py-1.5 rounded-lg border border-dashed border-slate-200 hover:bg-slate-50 text-slate-500 font-bold text-[10px] transition-colors"
            >
              + Giờ rảnh
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
