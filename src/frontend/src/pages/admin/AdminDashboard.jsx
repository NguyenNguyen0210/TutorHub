import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Statistic, Tag, Button, Progress, Table, Alert } from 'antd';
import { 
  DollarCircleOutlined, 
  SafetyCertificateOutlined, 
  RiseOutlined, 
  AlertOutlined, 
  FileTextOutlined, 
  UserOutlined, 
  CheckCircleOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
  AuditOutlined
} from '@ant-design/icons';
import adminService from '../../services/admin.service';
import { formatVND } from '../../utils/formatters';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    adminService.getStats().then(setStats);
    adminService.getAuditLogs().then(setAuditLogs);
  }, []);

  if (!stats) return <div className="p-8 text-center text-slate-400">Đang tải dữ liệu Bảng Điều Hành Quản Trị...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Top Banner: Dark Slate Command Center */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <Tag color="purple" className="font-bold border-indigo-500/40 uppercase tracking-widest text-[10px]">
                Escrow Core Active • Node v20.11
              </Tag>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Trung Tâm Điều Hành Quản Trị & Giám Sát Sàn
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
              Giám sát dòng tiền ký quỹ Escrow, phân xử trọng tài theo khung DEC-S8 và điều phối chứng chỉ gia sư chuẩn sư phạm.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              icon={<AuditOutlined />}
              onClick={() => navigate('/admin/audit-logs')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs font-semibold h-10 px-4"
            >
              Sổ Cái Audit Log
            </Button>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={() => navigate('/admin/disputes/ba07ba07-0001')}
              className="bg-rose-600 hover:bg-rose-500 border-none text-xs font-bold h-10 px-5 shadow-lg shadow-rose-900/40"
            >
              Phân Xử Tranh Chấp Khẩn Cấp (1)
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* GMV */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng GMV Toàn Sàn</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <RiseOutlined className="text-lg" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{formatVND(stats.gmv)}</div>
          <div className="flex items-center space-x-1 mt-2 text-xs text-emerald-400 font-semibold">
            <span>+{stats.gmvGrowth}%</span>
            <span className="text-slate-500 font-normal">so với tháng trước</span>
          </div>
        </div>

        {/* Platform Revenue (10%) */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Doanh Thu Phí Sàn (10%)</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <DollarCircleOutlined className="text-lg" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">{formatVND(stats.platformFeeRevenue)}</div>
          <div className="text-xs text-slate-500 mt-2">
            Tự động khấu trừ minh bạch từng buổi học
          </div>
        </div>

        {/* Escrow Locked */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quỹ Ký Quỹ Đang Khóa</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <SafetyCertificateOutlined className="text-lg" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400">{formatVND(stats.escrowLocked)}</div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Bảo chứng trong ví trung gian an toàn
          </div>
        </div>

        {/* Dispute Resolution Rate */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tỷ Lệ Xử Lý &lt; 24H</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
              <CheckCircleOutlined className="text-lg" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-400">{stats.resolutionRate24h}%</div>
          <div className="mt-2">
            <Progress percent={stats.resolutionRate24h} size="small" strokeColor="#a855f7" showInfo={false} />
          </div>
        </div>

      </div>

      {/* Action Queue & Emergency Dispatch */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        
        {/* Urgent Task Queue */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertOutlined className="text-rose-500" />
              Hàng Đợi Xử Lý Ưu Tiên
            </h3>
            <Tag color="red" className="font-bold">{stats.activeDisputesCount} Việc Cần Phê Duyệt</Tag>
          </div>

          <div className="space-y-3">
            
            {/* Urgent Case Item */}
            <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Tag color="volcano" className="text-[10px] font-bold">TRANH CHẤP KHẨN CẤP</Tag>
                  <span className="text-xs font-mono text-rose-300">Case DEC-S8-025</span>
                </div>
                <h4 className="text-xs font-bold text-white">Vụ Học Viên Tuấn vs Gia Sư ThS. An (Buổi #3 vắng mặt)</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Số tiền tranh chấp: 200.000 ₫ • Học viên chờ 35 phút trong Meet • Đã quá hạn 4 giờ
                </p>
              </div>
              <Button
                type="primary"
                size="small"
                onClick={() => navigate('/admin/disputes/ba07ba07-0001')}
                className="bg-rose-600 hover:bg-rose-500 border-none text-xs font-bold shrink-0"
              >
                Vào Trọng Tài
              </Button>
            </div>

            {/* Pending Tutor Applications */}
            <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Tag color="blue" className="text-[10px] font-bold">XÁC MINH BẰNG CẤP</Tag>
                  <span className="text-xs text-slate-400">Hồ Sơ Gia Sư Mới</span>
                </div>
                <h4 className="text-xs font-bold text-white">3 Hồ sơ gia sư đang chờ duyệt bằng ĐH Sư Phạm & Video Trial</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Bao gồm: ThS. An (Toán), Bích Ngọc (IELTS 8.5), Hoàng Long (Olympic Tin)
                </p>
              </div>
              <Button
                size="small"
                onClick={() => navigate('/admin/tutor-applications')}
                className="bg-slate-800 text-indigo-400 border-indigo-500/40 hover:bg-indigo-950/40 text-xs font-bold shrink-0"
              >
                Kiểm Duyệt (3)
              </Button>
            </div>

            {/* Suspended User / Strike threshold */}
            <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Tag color="orange" className="text-[10px] font-bold">KỶ LUẬT SÀN</Tag>
                  <span className="text-xs text-amber-300">Chạm Ngưỡng 2 Strikes</span>
                </div>
                <h4 className="text-xs font-bold text-white">Học viên Trần Văn Bùng (2/3 Strikes - Vắng liên tiếp)</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Tài khoản đang bị tạm dừng đặt lịch 7 ngày • Cần duyệt gia hạn hoặc ân xá
                </p>
              </div>
              <Button
                size="small"
                onClick={() => navigate('/admin/users')}
                className="bg-slate-800 text-amber-400 border-amber-500/40 hover:bg-amber-950/40 text-xs font-bold shrink-0"
              >
                Xem Hồ Sơ
              </Button>
            </div>

          </div>
        </div>

        {/* Quick Links & Platform Health */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <SafetyCertificateOutlined className="text-emerald-400" />
              Chỉ Số Toàn Vẹn Hệ Thống (Health Check)
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-2.5 bg-slate-950/50 rounded-xl border border-slate-800">
                <span className="text-slate-400">VNPay Gateway IPN Status:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> 100% Khả dụng
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-950/50 rounded-xl border border-slate-800">
                <span className="text-slate-400">Central Audit Log Hash Match:</span>
                <span className="text-indigo-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" /> SHA-256 Verified
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-950/50 rounded-xl border border-slate-800">
                <span className="text-slate-400">Correlation ID Tracing:</span>
                <span className="text-slate-200 font-mono">X-Correlation-ID ACTIVE</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Truy Cập Nhanh Module Quản Trị:</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button block onClick={() => navigate('/admin/tutor-applications')} className="bg-slate-800 text-slate-300 border-slate-700 text-xs">
                Duyệt Gia Sư
              </Button>
              <Button block onClick={() => navigate('/admin/users')} className="bg-slate-800 text-slate-300 border-slate-700 text-xs">
                Quản Lý User
              </Button>
              <Button block onClick={() => navigate('/admin/audit-logs')} className="bg-slate-800 text-slate-300 border-slate-700 text-xs">
                Sổ Cái Kiểm Toán
              </Button>
              <Button block onClick={() => navigate('/tutors')} className="bg-slate-800 text-slate-300 border-slate-700 text-xs">
                Xem Sàn Khám Phá
              </Button>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Central Audit Ledger Entries */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AuditOutlined className="text-indigo-400" />
              Nhật Ký Kiểm Toán Bất Biến Mới Nhất (Audit Trail)
            </h3>
            <p className="text-xs text-slate-400">Ghi vết mọi biến động tài chính Escrow kèm mã băm SHA-256</p>
          </div>
          <Button size="small" onClick={() => navigate('/admin/audit-logs')} className="text-xs bg-slate-800 text-indigo-400 border-indigo-500/40">
            Xem Tất Cả Sổ Cái
          </Button>
        </div>

        <Table
          dataSource={auditLogs.slice(0, 4)}
          rowKey="id"
          pagination={false}
          size="small"
          className="admin-dark-table"
          columns={[
            {
              title: 'Thời Gian',
              dataIndex: 'timestamp',
              key: 'timestamp',
              render: (t) => <span className="text-[11px] font-mono text-slate-400">{t}</span>,
              width: 150,
            },
            {
              title: 'Hành Động',
              dataIndex: 'action',
              key: 'action',
              render: (a) => (
                <Tag color={a.includes('VERDICT') ? 'red' : a.includes('RELEASE') ? 'green' : 'blue'} className="text-[10px] font-mono font-bold">
                  {a}
                </Tag>
              ),
              width: 220,
            },
            {
              title: 'Nội Dung Kiểm Toán',
              dataIndex: 'summary',
              key: 'summary',
              render: (s) => <span className="text-xs text-slate-200">{s}</span>,
            },
            {
              title: 'Mã SHA-256 HMAC',
              dataIndex: 'sha256Hash',
              key: 'sha256Hash',
              render: (h) => (
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30">
                  {h.substring(0, 16)}...
                </span>
              ),
              width: 170,
            },
          ]}
        />
      </div>

    </div>
  );
}
