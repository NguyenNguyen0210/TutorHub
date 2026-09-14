import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Tag, Button, Modal, Image, Avatar, message, Input } from 'antd';
import { 
  SafetyCertificateFilled, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  EyeOutlined, 
  VideoCameraOutlined,
  BankOutlined,
  BookOutlined,
  AuditOutlined
} from '@ant-design/icons';
import adminService from '../../services/admin.service';
import { formatVND } from '../../utils/formatters';

export default function AdminTutorApplications() {
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);

  useEffect(() => {
    adminService.getTutorApplications().then(setApps);
  }, []);

  const handleApprove = (app) => {
    adminService.approveTutorApplication(app.id).then(() => {
      message.success(`Đã phê duyệt hồ sơ của ${app.applicantName} và cấp huy hiệu Verified Master Tutor!`);
      setApps(prev => prev.map(a => a.id === app.id ? { ...a, status: 'APPROVED' } : a));
      setModalVisible(false);
    });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      message.error('Vui lòng nhập lý do từ chối hồ sơ');
      return;
    }
    adminService.rejectTutorApplication(selectedApp.id, rejectReason).then(() => {
      message.warning(`Đã từ chối hồ sơ của ${selectedApp.applicantName}`);
      setApps(prev => prev.map(a => a.id === selectedApp.id ? { ...a, status: 'REJECTED' } : a));
      setRejectModalVisible(false);
      setModalVisible(false);
      setRejectReason('');
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <SafetyCertificateFilled className="text-indigo-400" />
            Bàn Kiểm Duyệt Hồ Sơ Gia Sư & Bằng Cấp
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Xác minh chứng chỉ sư phạm, video dạy thử và tài khoản ngân hàng thụ hưởng nhận tiền ký quỹ
          </p>
        </div>
        <Tag color="cyan" className="font-bold text-xs px-3 py-1 self-start sm:self-auto">
          {apps.filter(a => a.status === 'PENDING').length} Hồ Sơ Đang Chờ Duyệt
        </Tag>
      </div>

      {/* Applications Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
        <Table
          dataSource={apps}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          className="admin-dark-table"
          columns={[
            {
              title: 'Ứng Viên',
              key: 'applicant',
              render: (_, record) => (
                <div className="flex items-center space-x-3">
                  <Avatar src={record.avatar} size={42} />
                  <div>
                    <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                      {record.applicantName}
                      {record.status === 'APPROVED' && (
                        <Tag color="success" className="text-[10px] m-0">Verified Master</Tag>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-400">{record.email}</p>
                    <span className="text-[10px] text-indigo-400 font-mono">{record.phone}</span>
                  </div>
                </div>
              )
            },
            {
              title: 'Học Vị & Trường Đào Tạo',
              key: 'education',
              render: (_, record) => (
                <div>
                  <p className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                    <BookOutlined className="text-indigo-400" />
                    {record.university}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{record.degree}</p>
                  <span className="text-[10px] text-slate-500">{record.experienceYears} năm kinh nghiệm</span>
                </div>
              )
            },
            {
              title: 'Môn Dạy & Giá',
              key: 'subjects',
              render: (_, record) => (
                <div>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {record.subjects.map((sub, i) => (
                      <Tag key={i} color="blue" className="text-[10px] m-0">{sub}</Tag>
                    ))}
                  </div>
                  <span className="text-xs font-extrabold text-amber-400">{formatVND(record.hourlyRate)}/h</span>
                </div>
              )
            },
            {
              title: 'Trạng Thái',
              dataIndex: 'status',
              key: 'status',
              render: (st) => {
                if (st === 'APPROVED') return <Tag color="green" className="font-bold">ĐÃ PHÊ DUYỆT</Tag>;
                if (st === 'REJECTED') return <Tag color="red" className="font-bold">TỪ CHỐI</Tag>;
                return <Tag color="gold" className="font-bold">CHỜ XÉT DUYỆT</Tag>;
              }
            },
            {
              title: 'Hành Động',
              key: 'action',
              render: (_, record) => (
                <div className="flex items-center space-x-2">
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => {
                      setSelectedApp(record);
                      setModalVisible(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white border-none text-xs font-semibold"
                  >
                    Xem Chi Tiết
                  </Button>
                  {record.status === 'PENDING' && (
                    <Button
                      size="small"
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleApprove(record)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white border-none text-xs font-semibold"
                    >
                      Duyệt Nhanh
                    </Button>
                  )}
                </div>
              )
            }
          ]}
        />
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <Modal
          title={
            <div className="flex items-center space-x-2 text-white text-base font-bold">
              <AuditOutlined className="text-indigo-400" />
              <span>Thẩm Định Hồ Sơ: {selectedApp.applicantName}</span>
            </div>
          }
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          width={720}
          footer={[
            <Button key="close" onClick={() => setModalVisible(false)} className="border-slate-700 text-slate-300">
              Đóng
            </Button>,
            selectedApp.status === 'PENDING' && (
              <Button 
                key="reject" 
                danger 
                icon={<CloseCircleOutlined />}
                onClick={() => setRejectModalVisible(true)}
              >
                Từ Chối Hồ Sơ
              </Button>
            ),
            selectedApp.status === 'PENDING' && (
              <Button 
                key="approve" 
                type="primary" 
                icon={<CheckCircleOutlined />}
                onClick={() => handleApprove(selectedApp)}
                className="bg-emerald-600 hover:bg-emerald-500 border-none font-bold"
              >
                Phê Duyệt & Cấp Huy Hiệu Master
              </Button>
            )
          ]}
          className="admin-modal"
        >
          <div className="space-y-4 text-xs text-slate-300 my-4">
            
            {/* Applicant Summary */}
            <div className="flex items-center space-x-4 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
              <Avatar src={selectedApp.avatar} size={64} className="border-2 border-indigo-500" />
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">{selectedApp.applicantName}</h3>
                <p className="text-slate-400">{selectedApp.university} • {selectedApp.degree}</p>
                <div className="flex items-center space-x-3 mt-1.5 text-[11px]">
                  <span className="text-indigo-400">Kinh nghiệm: {selectedApp.experienceYears} năm</span>
                  <span>•</span>
                  <span className="text-amber-400 font-bold">Học phí: {formatVND(selectedApp.hourlyRate)}/giờ</span>
                </div>
              </div>
            </div>

            {/* Bank KYC verification */}
            <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BankOutlined className="text-xl text-emerald-400" />
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Tài Khoản Thụ Hưởng Nhận Tiền Escrow:</span>
                  <p className="font-bold text-white text-xs">
                    {selectedApp.bankAccount.bankName} - {selectedApp.bankAccount.accountNumber}
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono">CHỦ TK: {selectedApp.bankAccount.accountHolder}</span>
                </div>
              </div>
              <Tag color="success">ĐÃ XÁC MINH KYC</Tag>
            </div>

            {/* Scanned Degree Certificate */}
            <div>
              <h4 className="font-bold text-white mb-2 flex items-center gap-1.5">
                <SafetyCertificateFilled className="text-indigo-400" />
                Bằng Cấp & Chứng Chỉ Sư Phạm Gốc Scan:
              </h4>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex justify-center">
                <Image
                  src={selectedApp.degreeScanUrl}
                  alt="Bằng cấp sư phạm scan"
                  className="rounded-lg max-h-56 object-cover"
                />
              </div>
            </div>

            {/* Trial Video Section */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <VideoCameraOutlined className="text-xl text-rose-400" />
                <div>
                  <h4 className="font-bold text-white">Video Giảng Dạy Mẫu (Trial 3 Phút)</h4>
                  <p className="text-[11px] text-slate-400">Đánh giá tác phong sư phạm, phương pháp truyền đạt và phát âm</p>
                </div>
              </div>
              <Button 
                size="small" 
                onClick={() => window.open(selectedApp.trialVideoUrl, '_blank')}
                className="bg-rose-600/20 text-rose-300 border-rose-500/40 text-xs font-bold"
              >
                Mở Xem Video
              </Button>
            </div>

          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      <Modal
        title="Nhập Lý Do Từ Chối Hồ Sơ"
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        onOk={handleReject}
        okText="Xác Nhận Từ Chối"
        okButtonProps={{ danger: true }}
      >
        <div className="py-3">
          <p className="text-xs text-slate-400 mb-2">Lý do từ chối sẽ được gửi qua email kèm hướng dẫn bổ sung:</p>
          <Input.TextArea
            rows={4}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Ví dụ: Bằng scan chưa rõ dấu mộc đỏ hoặc thời lượng video dạy thử chưa đủ 2 phút..."
          />
        </div>
      </Modal>

    </div>
  );
}
