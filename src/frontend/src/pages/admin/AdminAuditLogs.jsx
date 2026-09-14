import React, { useState } from 'react';

export default function AdminAuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');

  const auditLogs = [
    {
      id: 'log-1',
      timestamp: '13/09/2026 22:30:15',
      correlationId: 'CORR-882194',
      action: 'DisputeResolved',
      entity: 'Dispute (#ba07ba07-0001)',
      actor: 'Admin (admin@tutorhub.com)',
      desc: 'Hoàn tiền 200.000 ₫ cho học viên Phạm Minh Tuấn theo DEC-S8-025',
    },
    {
      id: 'log-2',
      timestamp: '13/09/2026 22:15:00',
      correlationId: 'CORR-771023',
      action: 'SessionPayoutCredit',
      entity: 'WalletTransaction',
      actor: 'System AutoJob (24h Window)',
      desc: 'Giải ngân 180.000 ₫ cho gia sư Nguyễn Văn An (Buổi #1)',
    },
    {
      id: 'log-3',
      timestamp: '13/09/2026 20:45:10',
      correlationId: 'CORR-660192',
      action: 'AttendanceConflictRaised',
      entity: 'Session (#s3s3s3s3-0003)',
      actor: 'System Event',
      desc: 'Phát hiện bất đồng điểm danh: Student Attended vs Tutor Absent',
    },
    {
      id: 'log-4',
      timestamp: '12/09/2026 14:00:00',
      correlationId: 'CORR-554101',
      action: 'EnrollmentCreated',
      entity: 'Enrollment (#e1e1e1e1-0001)',
      actor: 'Student (student.tuan)',
      desc: 'Khởi tạo hợp đồng 10 buổi học - Snapshot phí sàn 10%',
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Sổ Cái Kiểm Toán Bất Biến Trung Tâm (Central Audit Log)
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Hệ thống sổ cái Append-Only ghi nhận vĩnh viễn mọi biến động Escrow, hợp đồng và phán quyết trọng tài
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm theo CorrelationId, EntityId, Actor..."
          className="w-full max-w-md px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-brand-indigo-500 outline-hidden"
        />
        <span className="text-xs text-slate-400 font-mono">Hiển thị {auditLogs.length} bản ghi</span>
      </div>

      {/* Audit Table */}
      <div className="p-6 rounded-3xl bg-slate-800/80 border border-slate-700 overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="text-slate-400 font-bold border-b border-slate-700 pb-2">
            <tr>
              <th className="p-3">Thời gian</th>
              <th className="p-3">CorrelationId</th>
              <th className="p-3">Hành động</th>
              <th className="p-3">Thực thể</th>
              <th className="p-3">Người thực hiện</th>
              <th className="p-3">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/60 text-slate-300">
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-700/30">
                <td className="p-3 font-mono text-slate-400">{log.timestamp}</td>
                <td className="p-3 font-mono font-bold text-brand-indigo-400">{log.correlationId}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-emerald-400 font-mono text-[10px] font-bold">
                    {log.action}
                  </span>
                </td>
                <td className="p-3 font-bold text-white">{log.entity}</td>
                <td className="p-3 text-slate-400">{log.actor}</td>
                <td className="p-3 text-slate-300 leading-normal">{log.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
