import React from 'react';
import { CheckCircleOutlined, ClockCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';

const DAYS = [
  { key: 'Monday', label: 'Thứ Hai' },
  { key: 'Tuesday', label: 'Thứ Ba' },
  { key: 'Wednesday', label: 'Thứ Tư' },
  { key: 'Thursday', label: 'Thứ Năm' },
  { key: 'Friday', label: 'Thứ Sáu' },
  { key: 'Saturday', label: 'Thứ Bảy' },
  { key: 'Sunday', label: 'Chủ Nhật' },
];

const SHIFTS = [
  { key: 'morning', label: 'Ca Sáng', timeRange: '08:00 - 12:00' },
  { key: 'afternoon', label: 'Ca Chiều', timeRange: '13:00 - 17:00' },
  { key: 'evening', label: 'Ca Tối', timeRange: '18:00 - 22:00' },
];

export default function AvailabilityMatrix({ availability = [] }) {
  // Map availability list to quick lookup: [day][shift]
  const isAvailable = (dayKey, shiftKey) => {
    return availability.find((slot) => {
      if (slot.dayOfWeek !== dayKey) return false;
      const startHour = parseInt(slot.startTime.split(':')[0], 10);
      if (shiftKey === 'morning' && startHour >= 8 && startHour < 12) return true;
      if (shiftKey === 'afternoon' && startHour >= 12 && startHour < 18) return true;
      if (shiftKey === 'evening' && startHour >= 18 && startHour <= 22) return true;
      return false;
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <ClockCircleOutlined className="text-brand-indigo-600" />
          <h4 className="m-0 text-sm font-bold text-slate-800">
            Ma Trận Lịch Rảnh Giảng Dạy Tuần
          </h4>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md bg-emerald-500"></span>
            <span className="text-slate-600 font-medium">Sẵn sàng nhận lịch</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md bg-slate-200"></span>
            <span className="text-slate-400">Bận / Chưa mở</span>
          </span>
          <span className="text-brand-indigo-600 font-semibold bg-brand-indigo-50 px-2 py-0.5 rounded">
            Múi giờ: GMT+7 (Việt Nam)
          </span>
        </div>
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <th className="w-28 p-3 font-semibold text-slate-700 text-left pl-4">Khung Giờ</th>
              {DAYS.map((d) => (
                <th key={d.key} className="p-3 font-semibold text-slate-800">
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {SHIFTS.map((shift) => (
              <tr key={shift.key} className="hover:bg-slate-50/50">
                <td className="p-3 text-left pl-4 font-medium text-slate-700 bg-slate-50/40">
                  <div className="font-bold text-slate-800">{shift.label}</div>
                  <div className="text-[11px] text-slate-400">{shift.timeRange}</div>
                </td>

                {DAYS.map((day) => {
                  const slot = isAvailable(day.key, shift.key);
                  return (
                    <td key={day.key} className="p-2">
                      {slot ? (
                        <div className="inline-flex flex-col items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50/90 px-2.5 py-1.5 text-emerald-800 shadow-sm transition-transform hover:scale-105">
                          <span className="flex items-center gap-1 font-bold">
                            <CheckCircleOutlined className="text-[10px] text-emerald-600" />
                            {slot.startTime} - {slot.endTime}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-medium">Khả dụng</span>
                        </div>
                      ) : (
                        <div className="inline-block rounded-md border border-slate-100 bg-slate-50/50 px-2 py-1 text-[11px] text-slate-300">
                          —
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Callout */}
      <div className="border-t border-slate-100 bg-slate-50/50 p-3 text-xs text-slate-500 flex items-center gap-2">
        <InfoCircleOutlined className="text-brand-indigo-500" />
        <span>
          Lịch học của bạn sẽ được giữ chỗ cố định và đối soát 2 chiều trong suốt hợp đồng N buổi. Có thể đổi lịch trước 24 giờ mà không phát sinh phụ phí.
        </span>
      </div>
    </div>
  );
}
