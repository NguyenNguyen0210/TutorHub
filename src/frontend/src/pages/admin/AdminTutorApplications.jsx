import React, { useState, useEffect } from 'react';
import adminService from '@/services/admin.service';
import { message, Modal } from 'antd';
import { TUTOR_APPLICATION_STATUS, getTutorApplicationStatusMeta } from '@/config/enums';
import { formatDateTime } from '@/utils/formatters';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';

export default function AdminTutorApplications() {
  const [applicants, setApplicants] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null); // null = all
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadApplications() {
      try {
        setLoading(true);
        const res = await adminService.getTutorApplications({
          status: statusFilter,
          pageSize: 20,
        });
        const items = res?.items || [];
        if (isMounted) {
          setApplicants(items);
          setSelectedAppId((prev) => prev || (items.length > 0 ? items[0].id : null));
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadApplications();
    return () => {
      isMounted = false;
    };
  }, [statusFilter, reloadToken]);

  const current = applicants.find((a) => a.id === selectedAppId) || applicants[0] || null;

  const handleApprove = () => {
    if (!current) return;
    Modal.confirm({
      title: `Phê duyệt hồ sơ gia sư: ${current.userFullName || current.fullName}`,
      content: 'Gia sư sẽ được cấp Verified Badge và hiển thị trong danh mục tìm kiếm.',
      okText: 'Xác nhận phê duyệt',
      cancelText: 'Hủy bỏ',
      onOk: async () => {
        try {
          setProcessing(true);
          await adminService.approveTutorApplication(current.id);
          message.success(`Đã phê duyệt và cấp Verified Badge cho ${current.userFullName || current.fullName}!`);
          setReloadToken((t) => t + 1);
        } catch (err) {
          message.error(err?.message || 'Không thể phê duyệt hồ sơ gia sư.');
        } finally {
          setProcessing(false);
        }
      },
    });
  };

  const handleReject = () => {
    if (!current) return;
    let rejectReason = '';
    Modal.confirm({
      title: `Từ chối hồ sơ gia sư: ${current.userFullName || current.fullName}`,
      content: (
        <div className="space-y-2 pt-2 text-xs">
          <p className="m-0 text-slate-600">Nhập lý do từ chối để gửi thông báo cho gia sư:</p>
          <textarea
            rows={3}
            defaultValue="Hồ sơ chưa đạt yêu cầu minh chứng văn bằng hoặc KYC"
            onChange={(e) => {
              rejectReason = e.target.value;
            }}
            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
          />
        </div>
      ),
      okText: 'Xác nhận từ chối',
      okButtonProps: { danger: true },
      cancelText: 'Hủy bỏ',
      onOk: async () => {
        try {
          setProcessing(true);
          await adminService.rejectTutorApplication(
            current.id,
            rejectReason.trim() || 'Hồ sơ chưa đạt yêu cầu minh chứng văn bằng hoặc KYC'
          );
          message.info(`Đã từ chối hồ sơ.`);
          setReloadToken((t) => t + 1);
        } catch (err) {
          message.error(err?.message || 'Không thể từ chối hồ sơ gia sư.');
        } finally {
          setProcessing(false);
        }
      },
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Bàn Kiểm Duyệt Hồ Sơ Gia Sư & Xác Minh Bằng Cấp
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Kiểm tra bằng đại học, chứng chỉ sư phạm và thông tin KYC trước khi cấp huy hiệu Verified Master Tutor
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 text-xs font-bold">
        {[
          { key: null, label: 'Tất Cả' },
          { key: TUTOR_APPLICATION_STATUS.PENDING, label: 'Chờ Duyệt ⏳' },
          { key: TUTOR_APPLICATION_STATUS.APPROVED, label: 'Đã Duyệt ✅' },
          { key: TUTOR_APPLICATION_STATUS.REJECTED, label: 'Đã Từ Chối' },
        ].map((tab) => (
          <button
            key={String(tab.key)}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-xl transition-colors ${
              statusFilter === tab.key
                ? 'bg-brand-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <ErrorState
          error={error}
          title="Không tải được danh sách hồ sơ"
          onRetry={() => setReloadToken((t) => t + 1)}
        />
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          <span className="material-symbols-outlined animate-spin text-2xl block mb-2">sync</span>
          Đang tải hồ sơ gia sư...
        </div>
      ) : applicants.length === 0 ? (
        <EmptyState
          icon="verified_user"
          title="Không có hồ sơ nào"
          description="Hiện tại không có hồ sơ đăng ký gia sư nào cần xử lý trong mục này."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Applicants List */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
              <span className="text-xs font-bold text-slate-400 block mb-3">
                Danh Sách Hồ Sơ ({applicants.length})
              </span>
              <div className="space-y-2">
                {applicants.map((a) => (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => setSelectedAppId(a.id)}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all border text-left w-full block ${
                      (current?.id || selectedAppId) === a.id
                        ? 'bg-brand-indigo-600/20 border-brand-indigo-500 text-white'
                        : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs">{a.userFullName || a.fullName}</span>
                      <span className="text-[10px] text-slate-400">
                        {a.submittedAt ? formatDateTime(a.submittedAt, 'DD/MM') : '—'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate m-0">
                      {a.education || 'Chưa cập nhật học vấn'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Selected Applicant Review */}
          {current && (
            <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-slate-800/80 border border-slate-700 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div>
                  <h2 className="text-lg font-bold text-white m-0">
                    {current.userFullName || current.fullName}
                  </h2>
                  <p className="text-xs text-brand-indigo-400 mt-0.5 m-0">
                    Kinh nghiệm: {current.experienceYears || 0} năm • Hình thức: {current.teachingMode || 'Online'}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
                  {getTutorApplicationStatusMeta(current.status).label}
                </span>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div>
                  <span className="text-slate-400 block font-bold">Giới thiệu & Triết lý giảng dạy:</span>
                  <p className="text-slate-200 mt-1 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-700">
                    {current.bio || 'Chưa có thông tin giới thiệu.'}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 block font-bold">Học thuật & Bằng cấp:</span>
                  <p className="text-slate-200 mt-1 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-700">
                    {current.education || 'Chưa có thông tin bằng cấp.'}
                  </p>
                </div>

                {current.address && (
                  <div>
                    <span className="text-slate-400 block font-bold">Khu vực giảng dạy (Offline):</span>
                    <span className="text-slate-200">{current.address}</span>
                  </div>
                )}
              </div>

              {/* Decision Buttons */}
              {current.status === TUTOR_APPLICATION_STATUS.PENDING && (
                <div className="flex gap-3 pt-4 border-t border-slate-700">
                  <button
                    type="button"
                    disabled={processing}
                    onClick={handleApprove}
                    className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">verified</span>
                    {processing ? 'Đang xử lý...' : 'Phê Duyệt & Cấp Verified Badge'}
                  </button>
                  <button
                    type="button"
                    disabled={processing}
                    onClick={handleReject}
                    className="py-3 px-6 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    Từ Chối Hồ Sơ
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
