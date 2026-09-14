import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Breadcrumb,
  Button,
  Radio,
  Input,
  Upload,
  Alert,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  AlertFilled,
  SafetyCertificateFilled,
  InboxOutlined,
  UploadOutlined,
  ExclamationCircleFilled,
} from '@ant-design/icons';
import disputeService from '@/services/dispute.service';
import { formatCurrency } from '@/utils/formatters';

const { TextArea } = Input;
const { Dragger } = Upload;

export default function DisputeNew() {
  const navigate = useNavigate();

  const [reason, setReason] = useState('TutorNoShow');
  const [description, setDescription] = useState('');
  const [fileList, setFileList] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (description.trim().length < 20) {
      message.warning('Vui lòng mô tả chi tiết sự việc tối thiểu 20 ký tự để Ban Trọng Tài có căn cứ phân xử.');
      return;
    }

    setSubmitting(true);
    try {
      await disputeService.createDispute({
        sessionId: 's3s3s3s3-0001-0000-0000-000000000003',
        reason,
        description,
      });

      message.success('Đã nộp đơn khiếu nại thành công! Số tiền 200.000 ₫ đã được phong tỏa an toàn.');
      navigate('/student/enrollments/e1e1e1e1-0001-0000-0000-000000000001');
    } catch (err) {
      message.error('Không thể nộp đơn khiếu nại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Top Breadcrumb */}
      <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl flex items-center justify-between text-xs">
          <Breadcrumb
            items={[
              { title: <Link to="/student/dashboard">Bàn học</Link> },
              { title: 'Khiếu nại tranh chấp buổi học' },
            ]}
          />
          <Link
            to="/student/dashboard"
            className="flex items-center gap-1 font-medium text-slate-500 hover:text-brand-indigo-600"
          >
            <ArrowLeftOutlined /> Quay lại
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* HEADER */}
        <div className="rounded-3xl border border-rose-200/80 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 text-2xl flex-shrink-0">
              <AlertFilled />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 m-0">
                Nộp Đơn Khiếu Nại Tranh Chấp Buổi Học (DEC-S8)
              </h1>
              <p className="text-xs text-slate-500 mt-1 mb-0 leading-relaxed">
                Đơn khiếu nại của bạn sẽ được chuyển thẳng tới Ban Trọng Tài TutorHub. Số tiền <strong>200.000 ₫</strong> của buổi học này sẽ được <strong>lập tức phong tỏa trong két ký quỹ Escrow</strong> để bảo vệ quyền lợi của bạn.
              </p>
            </div>
          </div>
        </div>

        {/* FORM */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          {/* Thông tin buổi học */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Buổi Học Bị Khiếu Nại
            </span>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <strong className="text-slate-900 text-sm">Buổi 3: Giá trị lớn nhất & nhỏ nhất trên đoạn</strong>
                <div className="text-slate-500 mt-0.5">Gia sư: ThS. Nguyễn Văn An • Hợp đồng CTR-2026-THB-001</div>
              </div>
              <div className="text-right">
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Số tiền bị phong tỏa: 200.000 ₫
                </span>
              </div>
            </div>
          </div>

          {/* Lý do khiếu nại */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              1. Chọn Lý Do Khiếu Nại: <span className="text-rose-500">*</span>
            </label>

            <Radio.Group
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="flex flex-col gap-2.5 text-xs"
            >
              <Radio value="TutorNoShow">
                <strong>Gia sư vắng mặt không lý do (Tutor No-Show):</strong> Gia sư không vào Google Meet suốt ca học.
              </Radio>
              <Radio value="TutorLate">
                <strong>Gia sư vào lớp quá muộn:</strong> Trễ trên 15 phút làm ảnh hưởng nghiêm trọng đến thời lượng học.
              </Radio>
              <Radio value="IncompleteSession">
                <strong>Buổi học bị bỏ dở giữa chừng:</strong> Gia sư rời lớp sớm khi chưa đủ thời lượng 60 phút cam kết.
              </Radio>
              <Radio value="QualityIssue">
                <strong>Chất lượng không đúng cam kết:</strong> Đường truyền gia sư chập chờn hoặc không đúng giáo trình.
              </Radio>
              <Radio value="Other">
                <strong>Lý do khác.</strong>
              </Radio>
            </Radio.Group>
          </div>

          {/* Mô tả sự việc */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Mô Tả Chi Tiết Sự Việc: <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {description.length}/20 ký tự tối thiểu
              </span>
            </div>
            <TextArea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Vui lòng mô tả cụ thể: Bạn đã vào Meet lúc mấy giờ, đã nhắn tin cho gia sư chưa và phản hồi của gia sư như thế nào..."
              className="rounded-xl text-xs"
            />
          </div>

          {/* Bằng chứng */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              3. Tải Lên Bằng Chứng (Ảnh chụp màn hình Meet / Tin nhắn):
            </label>
            <Dragger
              fileList={fileList}
              onChange={({ fileList: fl }) => setFileList(fl)}
              beforeUpload={() => false}
              className="rounded-2xl"
            >
              <p className="ant-upload-drag-icon text-brand-indigo-600 text-3xl mb-2">
                <InboxOutlined />
              </p>
              <p className="text-xs font-bold text-slate-700 m-0">
                Kéo thả ảnh hoặc bấm để chọn tệp bằng chứng
              </p>
              <p className="text-[11px] text-slate-400 m-0 mt-1">
                Hỗ trợ PNG, JPG, JPEG (tối đa 10MB)
              </p>
            </Dragger>
          </div>

          {/* Pháp lý & Cam kết */}
          <Alert
            type="warning"
            showIcon
            message="Chính Sách Xử Lý Khiếu Nại Trọng Tài DEC-S8"
            description="Ban Trọng Tài sẽ đối soát lịch sử cuộc gọi Google Meet và yêu cầu gia sư giải trình trong vòng 24 giờ. Nếu xác định gia sư vi phạm, học viên được hoàn lại 100% học phí buổi học và gia sư bị ghi nhận 1 Strike kỷ luật."
            className="rounded-2xl text-xs"
          />

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button onClick={() => navigate(-1)} className="rounded-xl">
              Hủy Bỏ
            </Button>
            <Button
              danger
              type="primary"
              loading={submitting}
              onClick={handleSubmit}
              className="rounded-xl font-bold h-10 px-6"
            >
              Gửi Đơn Khiếu Nại & Phong Tỏa Tiền
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
