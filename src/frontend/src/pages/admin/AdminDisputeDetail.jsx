import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Tag, Button, Alert, Modal, Input, message, Timeline, Divider, Row, Col } from 'antd';
import { 
  SafetyCertificateFilled, 
  WarningFilled, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  DollarCircleOutlined, 
  ClockCircleOutlined,
  VideoCameraOutlined,
  ThunderboltOutlined,
  AuditOutlined
} from '@ant-design/icons';
import adminService from '../../services/admin.service';
import { formatVND } from '../../utils/formatters';

export default function AdminDisputeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [verdictModalVisible, setVerdictModalVisible] = useState(false);
  const [selectedVerdict, setSelectedVerdict] = useState(null);
  const [verdictNotes, setVerdictNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    adminService.getDisputeDetail(id).then(setCaseData);
  }, [id]);

  if (!caseData) return <div className="p-8 text-center text-slate-400">Đang tải hồ sơ trọng tài vụ án...</div>;

  const handleApplyVerdict = () => {
    if (!selectedVerdict) return;
    setIsSubmitting(true);
    adminService.applyDisputeVerdict(caseData.id, selectedVerdict, verdictNotes).then((v) => {
      setIsSubmitting(false);
      setVerdictModalVisible(false);
      message.success('Đã áp dụng phán quyết trọng tài và ghi vào Sổ Cái Kiểm Toán Bất Biến!');
      setCaseData(prev => ({
        ...prev,
        status: 'RESOLVED',
        verdict: v
      }));
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Case Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <Tag color="volcano" className="font-mono font-bold text-xs uppercase tracking-wider">
                Vụ Án: #{caseData.code}
              </Tag>
              <Tag color="magenta" className="text-xs font-bold">
                Quy Chuẩn DEC-S8-025
              </Tag>
              {caseData.status === 'RESOLVED' ? (
                <Tag color="green" className="font-bold">ĐÃ PHÁN QUYẾT</Tag>
              ) : (
                <Tag color="gold" className="font-bold">ĐANG THỤ LÝ TRỌNG TÀI</Tag>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white">
              Phân Xử Tranh Chấp Vắng Mặt: {caseData.contractTitle}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Buổi học #{caseData.sessionNumber} ({caseData.sessionDate}) • Giá trị bảo chứng: <span className="text-amber-400 font-bold">{formatVND(caseData.sessionPrice)}</span>
            </p>
          </div>

          <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-right shrink-0">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Trạng Thái Escrow:</span>
            <span className="text-base font-black text-white flex items-center gap-1.5 justify-end">
              <SafetyCertificateFilled className="text-amber-400" />
              HELD (Phong Tỏa Bảo Vệ)
            </span>
            <span className="text-[11px] text-slate-400">Số tiền 200.000 ₫ đóng băng chờ lệnh</span>
          </div>
        </div>
      </div>

      {/* Grid: 2 Parties Claims & Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        
        {/* Left: 2 Parties Testimony */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Student Testimony */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Nguyên Đơn (Học Viên)</span>
                <h4 className="text-sm font-bold text-white">{caseData.student.name}</h4>
              </div>
              <Tag color="blue">Strike: {caseData.student.strikes}/3</Tag>
            </div>
            
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed mb-3">
              "{caseData.student.claim}"
            </div>

            <div className="text-[11px] text-slate-400 space-y-1">
              <p>• Thời gian vào phòng: <span className="text-emerald-400 font-mono font-bold">{caseData.student.joinTime}</span></p>
              <p>• Thời lượng chờ đợi: <span className="text-white font-bold">{caseData.student.durationMinutes} phút</span></p>
              <p>• Yêu cầu: <span className="text-rose-400 font-bold">Hoàn trả 100% (200.000 ₫)</span></p>
            </div>
          </div>

          {/* Tutor Testimony */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Bị Đơn (Gia Sư)</span>
                <h4 className="text-sm font-bold text-white">{caseData.tutor.name}</h4>
              </div>
              <Tag color="orange">Strike: {caseData.tutor.strikes}/3</Tag>
            </div>
            
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed mb-3">
              "{caseData.tutor.statement}"
            </div>

            <div className="text-[11px] text-slate-400 space-y-1">
              <p>• Ghi nhận hệ thống: <span className="text-rose-400 font-mono font-bold">{caseData.tutor.joinTime}</span></p>
              <p>• Lý do nêu: <span className="text-white">Mất điện & mất sóng 4G đột ngột</span></p>
              <p>• Đề xuất: <span className="text-indigo-400 font-bold">Xếp lịch dạy bù không hoàn tiền</span></p>
            </div>
          </div>

        </div>

        {/* Right: Meet Telemetry Evidence Logs */}
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <VideoCameraOutlined className="text-emerald-400" />
                Bằng Chứng Telemetry Google Meet Độc Lập
              </h3>
              <Tag color="cyan" className="font-mono text-[10px]">Tự Động Ghi Vết</Tag>
            </div>

            <div className="mb-4">
              <Alert
                type="info"
                showIcon
                message="Kết Luận Của Hệ Thống Giám Sát:"
                description={caseData.meetTelemetry.analysis}
                className="text-xs bg-indigo-950/40 border-indigo-500/30 text-indigo-200"
              />
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Nhật ký phiên học (Room Log):</h4>
              {caseData.meetTelemetry.studentLogs.map((log, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-slate-950/60 rounded-lg border border-slate-800/80 font-mono text-[11px]">
                  <span className="text-emerald-400">{log.timestamp}</span>
                  <span className="text-slate-200">{log.event}</span>
                  <span className="text-slate-400">{log.duration || log.totalDuration || log.ip}</span>
                </div>
              ))}
              <div className="p-2 bg-rose-950/30 rounded-lg border border-rose-500/30 font-mono text-[11px] text-rose-300">
                18:00:00 — 18:35:00: KHÔNG CÓ KẾT NỐI TỪ IP GIA SƯ
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Mã liên kết phòng học: meet.google.com/abc-defg-hij</span>
            <span className="text-indigo-400 font-mono">Bảo mật SHA-256</span>
          </div>
        </div>

      </div>

      {/* DEC-S8-025 Decision Calculator Matrix */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/60 border-2 border-indigo-500/40 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Máy Tính Cân Đối Phí Sàn DEC-S8-025
            </span>
            <h2 className="text-lg md:text-xl font-black text-white mt-0.5">
              3 Phương Án Phán Quyết Trọng Tài Khuyến Nghị
            </h2>
          </div>
          <Tag color="purple" className="text-xs font-bold">Khung Chuẩn Escrow S8</Tag>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Option A: 100% Student Refund (Recommended) */}
          <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-2xl p-5 relative flex flex-col justify-between hover:shadow-emerald-950/30 hover:shadow-2xl transition-all">
            <div className="absolute -top-3 left-4 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow">
              Khuyến Nghị Sàn (DEC-S8)
            </div>

            <div>
              <h3 className="text-sm font-bold text-white mb-2">Phương Án A: Hoàn 100% Học Viên</h3>
              <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
                Bảo vệ tối đa quyền lợi học sinh khi gia sư vắng mặt quá 15 phút.
              </p>

              <div className="space-y-2 text-xs bg-slate-950/80 p-3 rounded-xl border border-slate-800 mb-4 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Học viên nhận:</span>
                  <span className="text-emerald-400 font-bold">+200.000 ₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Thu hồi gia sư:</span>
                  <span className="text-rose-400 font-bold">-180.000 ₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phí sàn miễn:</span>
                  <span className="text-indigo-400 font-bold">-20.000 ₫</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Kỷ luật gia sư:</span>
                  <span className="text-amber-400 font-bold">+1 Strike</span>
                </div>
              </div>
            </div>

            <Button
              type="primary"
              block
              disabled={caseData.status === 'RESOLVED'}
              onClick={() => {
                setSelectedVerdict('REFUND_100_STUDENT');
                setVerdictNotes('Gia sư vắng mặt không lý do chính đáng trong thời gian quy định theo telemetry. Hoàn trả 100% cho học viên và cộng 1 Strike gia sư.');
                setVerdictModalVisible(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 border-none font-bold text-xs h-9"
            >
              Chọn Phán Quyết A
            </Button>
          </div>

          {/* Option B: 100% Tutor Payout */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <h3 className="text-sm font-bold text-white mb-2">Phương Án B: Bác Bỏ Khiếu Nại</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                Chỉ áp dụng nếu gia sư chứng minh được sự cố bất khả kháng được sàn chấp nhận.
              </p>

              <div className="space-y-2 text-xs bg-slate-950/80 p-3 rounded-xl border border-slate-800 mb-4 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Giải ngân gia sư:</span>
                  <span className="text-white font-bold">+180.000 ₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sàn thu phí:</span>
                  <span className="text-indigo-400 font-bold">+20.000 ₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Học viên nhận:</span>
                  <span className="text-slate-500">0 ₫</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Kỷ luật gia sư:</span>
                  <span className="text-slate-400">0 Strike</span>
                </div>
              </div>
            </div>

            <Button
              block
              disabled={caseData.status === 'RESOLVED'}
              onClick={() => {
                setSelectedVerdict('PAYOUT_100_TUTOR');
                setVerdictNotes('Bác bỏ khiếu nại. Giải ngân đầy đủ cho gia sư.');
                setVerdictModalVisible(true);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 font-bold text-xs h-9"
            >
              Chọn Phán Quyết B
            </Button>
          </div>

          {/* Option C: 50 / 50 Split */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <h3 className="text-sm font-bold text-white mb-2">Phương Án C: Hòa Giải 50/50</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                Áp dụng khi 2 bên đồng ý xếp lịch học bù một nửa và chia sẻ rủi ro kỹ thuật.
              </p>

              <div className="space-y-2 text-xs bg-slate-950/80 p-3 rounded-xl border border-slate-800 mb-4 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Hoàn học viên:</span>
                  <span className="text-emerald-400 font-bold">+100.000 ₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gia sư nhận:</span>
                  <span className="text-white font-bold">+90.000 ₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phí sàn (10%):</span>
                  <span className="text-indigo-400 font-bold">+10.000 ₫</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Kỷ luật:</span>
                  <span className="text-amber-400">Cảnh cáo</span>
                </div>
              </div>
            </div>

            <Button
              block
              disabled={caseData.status === 'RESOLVED'}
              onClick={() => {
                setSelectedVerdict('SPLIT_50_50');
                setVerdictNotes('Thỏa thuận hòa giải 50-50: Mỗi bên chịu một phần thiệt hại kỹ thuật.');
                setVerdictModalVisible(true);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 font-bold text-xs h-9"
            >
              Chọn Phán Quyết C
            </Button>
          </div>

        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        title={
          <div className="text-white text-base font-bold flex items-center gap-2">
            <AuditOutlined className="text-indigo-400" />
            Xác Nhận Ban Hành Phán Quyết Trọng Tài
          </div>
        }
        open={verdictModalVisible}
        onCancel={() => setVerdictModalVisible(false)}
        onOk={handleApplyVerdict}
        confirmLoading={isSubmitting}
        okText="Ký Số & Ban Hành Phán Quyết"
        okButtonProps={{ className: 'bg-emerald-600 hover:bg-emerald-500 font-bold' }}
      >
        <div className="py-3 text-xs text-slate-300 space-y-3">
          <p>
            Phán quyết này sẽ được <span className="font-bold text-amber-400">ký số bất biến (SHA-256 HMAC)</span>, tự động giải ngân/hoàn tiền tài khoản Escrow và ghi vào Sổ Cái Trung Tâm.
          </p>

          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">Ghi Chú Phán Quyết (Biên bản trọng tài):</label>
            <Input.TextArea
              rows={3}
              value={verdictNotes}
              onChange={e => setVerdictNotes(e.target.value)}
              className="text-xs bg-slate-950 border-slate-700 text-white"
            />
          </div>
        </div>
      </Modal>

    </div>
  );
}
