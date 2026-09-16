import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatCurrency } from '@/utils/formatters';
import { SESSION_STATUS, getSessionStatusMeta } from '@/config/enums';

export default function EnrollmentDetail() {
  const { id } = useParams();
  const contractId = id || 'e1e1e1e1-0001';

  const contract = {
    id: contractId,
    subject: 'Luyện thi THPT Toán 10 Buổi Cơ Bản Đến 8+',
    tutorName: 'ThS. Nguyễn Văn An',
    tutorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    totalSessions: 10,
    completedSessions: 2,
    totalPrice: 2000000,
    pricePerSession: 200000,
    platformFeeRate: '10%',
    status: 'Active',
    // status dùng đúng SessionStatus của backend (Unscheduled | Scheduled | Completed | Cancelled).
    // "Chờ điểm danh" KHÔNG phải một SessionStatus: đó là cửa sổ đối soát điểm danh 24h
    // (backend: AttendanceVerificationDueAt) nên được biểu diễn bằng cờ riêng.
    sessions: [
      { id: 's1', num: 1, date: '05/09/2026', time: '18:00 - 19:00', status: SESSION_STATUS.COMPLETED, tutorPayout: 180000, amount: 200000 },
      { id: 's2', num: 2, date: '08/09/2026', time: '18:00 - 19:00', status: SESSION_STATUS.SCHEDULED, attendancePending: true, tutorPayout: 180000, amount: 200000 },
      { id: 's3', num: 3, date: '12/09/2026', time: '18:00 - 19:00', status: SESSION_STATUS.SCHEDULED, tutorPayout: 180000, amount: 200000 },
      { id: 's4', num: 4, date: 'Chưa xếp', time: 'Chưa xếp', status: SESSION_STATUS.UNSCHEDULED, tutorPayout: 180000, amount: 200000 },
      { id: 's5', num: 5, date: 'Chưa xếp', time: 'Chưa xếp', status: SESSION_STATUS.UNSCHEDULED, tutorPayout: 180000, amount: 200000 },
      { id: 's6', num: 6, date: 'Chưa xếp', time: 'Chưa xếp', status: SESSION_STATUS.UNSCHEDULED, tutorPayout: 180000, amount: 200000 },
      { id: 's7', num: 7, date: 'Chưa xếp', time: 'Chưa xếp', status: SESSION_STATUS.UNSCHEDULED, tutorPayout: 180000, amount: 200000 },
      { id: 's8', num: 8, date: 'Chưa xếp', time: 'Chưa xếp', status: SESSION_STATUS.UNSCHEDULED, tutorPayout: 180000, amount: 200000 },
      { id: 's9', num: 9, date: 'Chưa xếp', time: 'Chưa xếp', status: SESSION_STATUS.UNSCHEDULED, tutorPayout: 180000, amount: 200000 },
      { id: 's10', num: 10, date: 'Chưa xếp', time: 'Chưa xếp', status: SESSION_STATUS.UNSCHEDULED, tutorPayout: 180000, amount: 200000 },
    ]
  };

  const STATUS_BADGE_CLASS = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    processing: 'bg-blue-50 text-blue-700 border-blue-200',
    default: 'bg-slate-100 text-slate-600 border-slate-200',
    error: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const getStatusBadge = (session) => {
    if (session.status === SESSION_STATUS.SCHEDULED && session.attendancePending) {
      return <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">Chờ Điểm Danh 24H ⏰</span>;
    }
    const meta = getSessionStatusMeta(session.status);
    const badgeClass = STATUS_BADGE_CLASS[meta.color] ?? STATUS_BADGE_CLASS.default;
    return (
      <span className={`px-2.5 py-1 rounded-full border text-xs font-bold ${badgeClass}`}>
        {meta.label}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header with Contract Summary */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border-light shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="font-monospace-num text-xs font-bold text-brand-indigo-600 block">HỢP ĐỒNG #{contract.id}</span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">{contract.subject}</h1>
            <p className="text-xs text-text-muted mt-0.5">Gia sư phụ trách: <strong>{contract.tutorName}</strong></p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              Đang Hiệu Lực (Escrow Locked)
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-700">Tiến độ hoàn thành buổi học:</span>
            <span className="text-brand-indigo-600 font-monospace-num">2 / 10 Buổi (20%)</span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-[20%] rounded-full transition-all"></div>
          </div>
        </div>

        {/* Financial Escrow Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border-light">
          <div className="p-4 rounded-2xl bg-slate-50">
            <span className="text-xs text-text-muted block">Tổng học phí đã nộp:</span>
            <span className="text-lg font-extrabold text-slate-900 font-monospace-num">{formatCurrency(contract.totalPrice)}</span>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50">
            <span className="text-xs text-emerald-800 block">Tiền còn trong Escrow:</span>
            <span className="text-lg font-extrabold text-financial-available font-monospace-num">{formatCurrency(1600000)}</span>
          </div>
          <div className="p-4 rounded-2xl bg-indigo-50">
            <span className="text-xs text-brand-indigo-800 block">Chính sách phí sàn:</span>
            <span className="text-lg font-extrabold text-brand-indigo-600 font-monospace-num">{contract.platformFeeRate}</span>
          </div>
        </div>
      </div>

      {/* 10-Session Timeline List */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border-light shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-border-light">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-indigo-600">view_timeline</span>
            Danh Sách 10 Buổi Học Con (Session Breakdown)
          </h3>
        </div>

        <div className="space-y-3">
          {contract.sessions.map((sess) => (
            <div
              key={sess.id}
              className="p-4 rounded-2xl border border-border-light bg-slate-50/60 hover:bg-white hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-indigo-100 text-brand-indigo-800 font-bold flex items-center justify-center text-sm font-monospace-num shrink-0">
                  #{sess.num}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800">Buổi Học Số {sess.num}</span>
                    <span className="text-xs text-text-muted font-monospace-num">({formatCurrency(sess.amount)})</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Thời gian: {sess.date} • {sess.time}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                {getStatusBadge(sess)}

                {sess.status === SESSION_STATUS.SCHEDULED && sess.attendancePending && (
                  <Link
                    to={`/student/sessions/${sess.id}`}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors"
                  >
                    Đối Soát
                  </Link>
                )}

                {sess.status === SESSION_STATUS.SCHEDULED && !sess.attendancePending && (
                  <Link
                    to={`/student/sessions/${sess.id}`}
                    className="px-3.5 py-1.5 rounded-xl bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white text-xs font-bold transition-colors"
                  >
                    Vào Học
                  </Link>
                )}

                {sess.status === SESSION_STATUS.COMPLETED && (
                  <Link
                    to={`/student/sessions/${sess.id}`}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                  >
                    Nhật Ký
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
