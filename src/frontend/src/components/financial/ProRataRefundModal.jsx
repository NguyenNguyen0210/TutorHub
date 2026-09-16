import React, { useState } from 'react';
import { Modal, Button, Input, Divider, Tag, message } from 'antd';
import {
  ExclamationCircleFilled,
  SafetyCertificateFilled,
  CalculatorOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import { formatCurrency } from '@/utils/formatters';

const { TextArea } = Input;

export default function ProRataRefundModal({
  visible,
  onClose,
  enrollment,
  onConfirmCancel,
}) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!enrollment) return null;

  const totalSessions = enrollment.totalSessions || 10;
  const completedSessions = enrollment.completedSessions || 2;
  const remainingSessions = Math.max(0, totalSessions - completedSessions);
  const perSessionPrice = enrollment.perSessionPrice || Math.round(enrollment.price / totalSessions);
  const usedAmount = completedSessions * perSessionPrice;
  const refundAmount = remainingSessions * perSessionPrice;

  const handleConfirm = async () => {
    if (!reason.trim()) {
      message.warning('Vui lòng nhập lý do bạn muốn dừng hợp đồng học tập.');
      return;
    }

    setSubmitting(true);
    try {
      if (onConfirmCancel) {
        await onConfirmCancel(reason);
      }
      message.success(`Hủy hợp đồng thành công! Đã hoàn trả ${formatCurrency(refundAmount)} vào ví của bạn.`);
      onClose();
    } catch (err) {
      message.error('Không thể hủy hợp đồng.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      title={
        <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
          <ExclamationCircleFilled />
          <span>Xác Nhận Hủy Hợp Đồng Sớm (Pro-rata Refund)</span>
        </div>
      }
      width={560}
      className="rounded-2xl"
    >
      <div className="space-y-4 pt-2 text-xs">
        <p className="text-slate-600 leading-relaxed">
          TutorHub tôn trọng quyền quyết định của bạn. Theo cam kết <strong>Bảo Chứng Escrow</strong>, bạn được quyền dừng khóa học bất kỳ lúc nào và nhận lại 100% học phí của các buổi học chưa diễn ra mà không chịu bất kỳ khoản phạt nào.
        </p>

        {/* Bảng công thức tính tiền minh bạch */}
        <div className="rounded-2xl border border-brand-indigo-100 bg-brand-indigo-50/40 p-4 shadow-xs">
          <div className="flex items-center gap-1.5 font-bold text-brand-indigo-800 text-xs uppercase mb-3">
            <CalculatorOutlined /> Công Thức Tính Tiền Hoàn Trả Minh Bạch
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Tổng giá trị hợp đồng ban đầu ({totalSessions} buổi):</span>
              <span className="font-bold text-slate-800">{formatCurrency(enrollment.price)}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Đã hoàn thành ({completedSessions} buổi x {formatCurrency(perSessionPrice)}):</span>
              <span className="font-bold text-slate-800">- {formatCurrency(usedAmount)}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Số buổi chưa diễn ra ({remainingSessions} buổi):</span>
              <span className="font-medium text-emerald-700">{remainingSessions} buổi con</span>
            </div>

            <Divider className="my-2" />

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="font-extrabold text-slate-900 text-sm">Số Tiền Hoàn Về Ví Học Viên:</span>
                <p className="m-0 text-[10px] text-slate-400">Tiền hoàn sẽ được xử lý qua cổng thanh toán theo quy chế sàn (INV-REFUND-004)</p>
              </div>
              <div className="text-xl font-extrabold text-emerald-600">
                {formatCurrency(refundAmount)}
              </div>
            </div>
          </div>
        </div>

        {/* Form lý do hủy */}
        <div>
          <label htmlFor="cancel-contract-reason" className="block text-slate-700 font-bold mb-1.5">
            Lý do dừng hợp đồng: <span className="text-rose-500">*</span>
          </label>
          <TextArea
            id="cancel-contract-reason"
            aria-label="Lý do dừng hợp đồng"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Vui lòng chia sẻ lý do (ví dụ: bận lịch học thêm ở trường, muốn đổi môn học, gia sư không phù hợp...)"
            className="rounded-xl text-xs"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button onClick={onClose} className="rounded-xl">
            Tiếp Tục Học
          </Button>
          <Button
            danger
            type="primary"
            loading={submitting}
            onClick={handleConfirm}
            className="rounded-xl font-bold"
          >
            Xác Nhận Hủy & Nhận Hoàn Tiền ({formatCurrency(refundAmount)})
          </Button>
        </div>
      </div>
    </Modal>
  );
}
