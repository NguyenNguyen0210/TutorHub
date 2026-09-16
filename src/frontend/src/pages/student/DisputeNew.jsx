import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import disputeService from '@/services/dispute.service';
import { message } from 'antd';

export default function DisputeNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId') || 's3s3s3s3-0003';

  const [reason, setReason] = useState('TutorNoShow');
  const [description, setDescription] = useState('Em đã vào phòng học Google Meet lúc 18:00 và chờ 30 phút đến 18:30 nhưng thầy An không vào lớp và không trả lời tin nhắn của em.');
  const [loading, setLoading] = useState(false);

  const reasonsList = [
    { key: 'TutorNoShow', title: 'Gia sư vắng mặt không báo trước', desc: 'Học viên vào lớp đúng giờ nhưng gia sư không xuất hiện.' },
    { key: 'IncompleteSession', title: 'Buổi học không trọn vẹn thời lượng', desc: 'Gia sư kết thúc buổi học sớm hơn thời gian quy định.' },
    { key: 'QualityIssue', title: 'Nội dung không đúng cam kết', desc: 'Gia sư không chuẩn bị bài hoặc dạy không đúng lộ trình.' },
    { key: 'TutorLate', title: 'Gia sư vào lớp muộn quá 15 phút', desc: 'Không bù giờ hoặc làm ảnh hưởng nghiêm trọng đến việc học.' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || description.length < 20) {
      message.error('Mô tả chi tiết phải từ 20 ký tự trở lên.');
      return;
    }

    try {
      setLoading(true);
      await disputeService.createDispute({
        sessionId,
        reason,
        description,
        evidenceUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
      });
      message.success('Đã gửi đơn khiếu nại thành công! Tiền học buổi này sẽ được bảo chứng chờ Admin xử lý.');
      navigate('/student/dashboard');
    } catch (err) {
      message.error(err?.message || 'Không thể gửi đơn khiếu nại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Link to="/student/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-indigo-600 transition-colors">
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Quay lại Bàn Học
      </Link>

      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border-light shadow-xs space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Mở Đơn Khiếu Nại Tranh Chấp Buổi Học</h1>
          <p className="text-xs text-text-muted">
            Hệ thống Bàn Trọng Tài DEC-S8 bảo vệ quyền lợi tài chính minh bạch cho học viên và gia sư
          </p>
        </div>

        {/* Selected Session Snapshot */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-800 block">Buổi #3: Môn Toán THPT (10/09/2026)</span>
            <span className="text-text-muted">Gia sư: ThS. Nguyễn Văn An</span>
          </div>
          <span className="font-monospace-num font-extrabold text-financial-available text-sm">200.000 ₫</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reason Selection Cards */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-800 block">Chọn lý do khiếu nại chính</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {reasonsList.map((r) => (
                <div
                  key={r.key}
                  onClick={() => setReason(r.key)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    reason === r.key
                      ? 'border-rose-500 bg-rose-50/50 text-rose-950 shadow-xs'
                      : 'border-border-light hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{r.title}</span>
                    {reason === r.key && (
                      <span className="material-symbols-outlined text-rose-600 text-lg">radio_button_checked</span>
                    )}
                  </div>
                  <p className="text-[11px] text-text-muted mt-1 leading-normal">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed description */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 block">
              Mô tả chi tiết vụ việc (Tối thiểu 20 ký tự)
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả diễn biến cụ thể để trọng tài có đầy đủ cơ sở phân xử..."
              className="w-full p-4 rounded-2xl border border-border-light text-xs text-slate-900 focus:ring-2 focus:ring-rose-500 outline-hidden leading-relaxed"
            />
          </div>

          {/* Evidence Upload Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 block">Bằng chứng minh họa (Ảnh chụp màn hình, video...)</label>
            <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-2 bg-slate-50/50">
              <span className="material-symbols-outlined text-3xl text-slate-400">cloud_upload</span>
              <p className="text-xs text-slate-600">Đã đính kèm tệp: <strong>screenshot-google-meet-waiting-18h25.png</strong> (854 KB)</p>
            </div>
          </div>

          {/* Escrow Freeze Warning */}
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-3">
            <span className="material-symbols-outlined text-rose-600 text-xl shrink-0">lock</span>
            <div>
              <span className="font-bold block">Quy tắc bảo chứng tài chính:</span>
              <span>Sau khi gửi khiếu nại thành công, học phí buổi học sẽ được bảo chứng trong Escrow và chỉ được giải ngân hoặc hoàn trả theo phán quyết phân xử của Admin.</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="py-3 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">send</span>
              {loading ? 'Đang gửi...' : 'Gửi Đơn Khiếu Nại Lên Admin'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/student/dashboard')}
              className="py-3 px-6 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
            >
              Hủy Bỏ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
