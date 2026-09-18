import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/cn';
import adminService from '@/services/admin.service';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/Dialog';
import { TUTOR_APPLICATION_STATUS, getTutorApplicationStatusMeta } from '@/config/enums';
import { formatDateTime } from '@/utils/formatters';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import { PageHeader, Spinner } from '@/components/ui/StatCard';

export default function AdminTutorApplications() {
  const toast = useToast();
  const confirm = useConfirm();
  const [applicants, setApplicants] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null); // null = all
  const [searchQuery, setSearchQuery] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadApplications() {
      try {
        setLoading(true);
        const res = await adminService.getTutorApplications({
          status: statusFilter,
          pageSize: 50,
        });
        const items = res?.items || [];
        if (isMounted) {
          setApplicants(items);
          setSelectedAppId((prev) => {
            if (prev && items.some((it) => it.id === prev)) return prev;
            return items.length > 0 ? items[0].id : null;
          });
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

  const filteredApplicants = useMemo(() => {
    if (!searchQuery.trim()) return applicants;
    const q = searchQuery.toLowerCase().trim();
    return applicants.filter(
      (a) =>
        (a.userFullName || a.fullName || '').toLowerCase().includes(q) ||
        (a.education || '').toLowerCase().includes(q) ||
        (a.userEmail || '').toLowerCase().includes(q)
    );
  }, [applicants, searchQuery]);

  const current =
    filteredApplicants.find((a) => a.id === selectedAppId) ||
    filteredApplicants[0] ||
    applicants.find((a) => a.id === selectedAppId) ||
    applicants[0] ||
    null;

  const handleApprove = async () => {
    if (!current) return;
    const ok = await confirm({
      title: `Phê duyệt hồ sơ gia sư: ${current.userFullName || current.fullName}`,
      content: 'Gia sư sẽ được cấp Verified Badge và hiển thị trong danh mục tìm kiếm dịch vụ.',
      confirmText: 'Xác nhận phê duyệt',
      cancelText: 'Hủy bỏ',
    });
    if (!ok) return;
    try {
      setProcessing(true);
      await adminService.approveTutorApplication(current.id);
      toast.success(`Đã phê duyệt và cấp Verified Badge cho ${current.userFullName || current.fullName}!`);
      setReloadToken((t) => t + 1);
    } catch (err) {
      toast.error(err?.message || 'Không thể phê duyệt hồ sơ gia sư.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!current) return;
    let rejectReason = '';
    const ok = await confirm({
      title: `Từ chối hồ sơ gia sư: ${current.userFullName || current.fullName}`,
      content: 'Nhập lý do từ chối để gửi thông báo chi tiết cho gia sư:',
      confirmText: 'Xác nhận từ chối',
      cancelText: 'Hủy bỏ',
      danger: true,
      requireReason: true,
      reasonLabel: 'Lý do từ chối',
      reasonPlaceholder: 'Hồ sơ chưa đạt yêu cầu minh chứng văn bằng hoặc KYC',
      defaultReason: 'Hồ sơ chưa đạt yêu cầu minh chứng văn bằng hoặc KYC',
      minReasonLength: 10,
      onConfirmReason: (r) => {
        rejectReason = r;
      },
    });
    if (!ok) return;
    try {
      setProcessing(true);
      await adminService.rejectTutorApplication(
        current.id,
        rejectReason.trim() || 'Hồ sơ chưa đạt yêu cầu minh chứng văn bằng hoặc KYC'
      );
      toast.info(`Đã từ chối hồ sơ.`);
      setReloadToken((t) => t + 1);
    } catch (err) {
      toast.error(err?.message || 'Không thể từ chối hồ sơ gia sư.');
    } finally {
      setProcessing(false);
    }
  };

  const statusMeta = current ? getTutorApplicationStatusMeta(current.status) : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Bàn kiểm duyệt hồ sơ gia sư & Xác minh bằng cấp"
        subtitle="Kiểm tra bằng đại học, chứng chỉ sư phạm và thông tin KYC trước khi cấp huy hiệu Verified Master Tutor"
      />

      {/* Trust Invariant Banner */}
      <div className="p-4 rounded-brand-lg bg-surface border border-border shadow-brand-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-caption">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-brand-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <Icon name="verified" size="xs" />
          </div>
          <div className="space-y-0.5">
            <span className="font-bold text-fg block">
              Tiêu chuẩn xác thực gia sư (Verified Tutor Badge)
            </span>
            <p className="text-fg-secondary text-[12px] m-0">
              Chỉ các gia sư đã qua thẩm định văn bằng, căn cước công dân và chứng chỉ nghiệp vụ mới được cấp quyền niêm yết các gói dịch vụ học tập có bảo chứng Escrow.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="success" size="md">
            KYC & Diploma Verified
          </Badge>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-neutral-100 rounded-brand-md w-fit" role="group" aria-label="Lọc theo trạng thái hồ sơ">
        {[
          { key: null, label: 'Tất cả' },
          { key: TUTOR_APPLICATION_STATUS.PENDING, label: 'Chờ duyệt' },
          { key: TUTOR_APPLICATION_STATUS.APPROVED, label: 'Đã duyệt' },
          { key: TUTOR_APPLICATION_STATUS.REJECTED, label: 'Đã từ chối' },
        ].map((tab) => (
          <button
            key={String(tab.key)}
            type="button"
            aria-pressed={statusFilter === tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={cn(
              'px-3.5 py-1.5 rounded-brand-sm font-semibold text-caption cursor-pointer transition-colors',
              statusFilter === tab.key
                ? 'bg-brand-primary-600 text-white shadow-brand-sm'
                : 'text-fg-secondary hover:text-fg hover:bg-neutral-200/60'
            )}
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
        <Card className="p-12 text-center space-y-2">
          <Spinner size="lg" label="Đang tải hồ sơ gia sư" className="mx-auto" />
          <p className="text-caption text-fg-muted">Đang tải hồ sơ gia sư...</p>
        </Card>
      ) : applicants.length === 0 ? (
        <EmptyState
          icon="verified_user"
          title="Không có hồ sơ nào"
          description="Hiện tại không có hồ sơ đăng ký gia sư nào cần xử lý trong mục này."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Search & Applicant List */}
          <div className="space-y-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none">
                <Icon name="search" size="sm" />
              </span>
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm gia sư theo tên hoặc trường..."
                aria-label="Tìm kiếm hồ sơ gia sư"
                className="pl-9 pr-8"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Xóa tìm kiếm"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg p-1 cursor-pointer"
                >
                  <Icon name="close" size="xs" />
                </button>
              )}
            </div>

            <Card padding="sm" className="shadow-brand-sm">
              <div className="flex items-center justify-between pb-2 mb-2 px-1 border-b border-border/60">
                <span className="text-caption font-bold text-fg-muted">
                  Hồ sơ ({filteredApplicants.length})
                </span>
                <span className="text-[11px] text-fg-muted font-mono">
                  Tổng {applicants.length}
                </span>
              </div>

              {filteredApplicants.length === 0 ? (
                <div className="py-8 text-center text-caption text-fg-muted">
                  Không tìm thấy hồ sơ phù hợp.
                </div>
              ) : (
                <div
                  className="space-y-2 max-h-[640px] overflow-y-auto pr-1"
                  role="listbox"
                  aria-label="Danh sách hồ sơ gia sư"
                >
                  {filteredApplicants.map((a) => {
                    const selected = (current?.id || selectedAppId) === a.id;
                    const aMeta = getTutorApplicationStatusMeta(a.status);
                    return (
                      <button
                        type="button"
                        key={a.id}
                        role="option"
                        aria-selected={selected}
                        onClick={() => setSelectedAppId(a.id)}
                        className={cn(
                          'p-3 rounded-brand-md cursor-pointer transition-all border text-left w-full block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600',
                          selected
                            ? 'bg-brand-primary-50/80 border-brand-primary-500 shadow-brand-xs'
                            : 'bg-surface border-border hover:bg-neutral-50'
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <Avatar
                            name={a.userFullName || a.fullName}
                            src={a.userAvatarUrl}
                            size="md"
                            className="shrink-0 mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-center gap-1">
                              <span className="font-bold text-caption text-fg truncate">
                                {a.userFullName || a.fullName}
                              </span>
                              <Badge variant={aMeta.color} size="sm" className="shrink-0 text-[10px] py-0 px-1.5">
                                {aMeta.label}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-fg-secondary truncate mt-0.5 m-0 font-medium">
                              {a.education || 'Chưa cập nhật học vấn'}
                            </p>
                            <span className="text-[10px] text-fg-muted font-mono block mt-1">
                              Nộp lúc: {a.submittedAt ? formatDateTime(a.submittedAt, 'DD/MM/YYYY') : '—'}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Detailed Candidate Dossier */}
          {current && (
            <Card padding="lg" className="lg:col-span-2 space-y-6 shadow-brand-sm">
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div className="flex items-center gap-3.5">
                  <Avatar
                    name={current.userFullName || current.fullName}
                    src={current.userAvatarUrl}
                    size="lg"
                    className="w-14 h-14 text-headline-2"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-headline-2 text-fg m-0">
                        {current.userFullName || current.fullName}
                      </h2>
                      {current.status === TUTOR_APPLICATION_STATUS.APPROVED && (
                        <span title="Verified Tutor">
                          <Icon name="verified" size="sm" className="text-brand-primary-600" />
                        </span>
                      )}
                    </div>
                    <p className="text-caption text-fg-muted m-0 font-mono text-[12px]">
                      {current.userEmail || 'Chưa có email'}
                    </p>
                    <div className="flex items-center gap-3 text-[12px] text-brand-primary-700 font-semibold mt-1">
                      <span>Kinh nghiệm: {current.experienceYears || 0} năm</span>
                      <span>•</span>
                      <span>Hình thức: {current.teachingMode === 'Both' ? 'Online & Trực tiếp' : current.teachingMode || 'Online'}</span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <Badge variant={statusMeta?.color || 'neutral'} size="md">
                    {statusMeta?.label}
                  </Badge>
                  {current.submittedAt && (
                    <span className="text-[11px] text-fg-muted font-mono block mt-1">
                      Nộp ngày: {formatDateTime(current.submittedAt, 'DD/MM/YYYY HH:mm')}
                    </span>
                  )}
                </div>
              </div>

              {/* Dossier Sections */}
              <div className="space-y-4 text-caption">
                <div>
                  <h4 className="text-fg font-bold flex items-center gap-1.5 mb-1.5">
                    <Icon name="school" size="xs" className="text-brand-primary-600" />
                    Trình độ học thuật & Minh chứng văn bằng
                  </h4>
                  <div className="text-fg leading-relaxed bg-neutral-50 p-3.5 rounded-brand-md border border-border">
                    {current.education || 'Chưa cập nhật thông tin bằng cấp.'}
                  </div>
                </div>

                <div>
                  <h4 className="text-fg font-bold flex items-center gap-1.5 mb-1.5">
                    <Icon name="format_quote" size="xs" className="text-brand-primary-600" />
                    Giới thiệu bản thân & Triết lý sư phạm
                  </h4>
                  <div className="text-fg leading-relaxed bg-neutral-50 p-3.5 rounded-brand-md border border-border whitespace-pre-line">
                    {current.bio || 'Chưa có thông tin giới thiệu bản thân.'}
                  </div>
                </div>

                {current.address && (
                  <div>
                    <h4 className="text-fg font-bold flex items-center gap-1.5 mb-1.5">
                      <Icon name="location_on" size="xs" className="text-brand-primary-600" />
                      Khu vực giảng dạy trực tiếp (In-Person / Offline)
                    </h4>
                    <div className="text-fg bg-neutral-50 p-3.5 rounded-brand-md border border-border font-medium">
                      {current.address}
                    </div>
                  </div>
                )}

                {current.rejectionReason && (
                  <div>
                    <h4 className="text-danger-strong font-bold flex items-center gap-1.5 mb-1.5">
                      <Icon name="error" size="xs" />
                      Lý do từ chối đã gửi cho gia sư:
                    </h4>
                    <div className="text-danger-strong bg-danger-surface p-3.5 rounded-brand-md border border-danger-border">
                      {current.rejectionReason}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons for Pending Application */}
              {current.status === TUTOR_APPLICATION_STATUS.PENDING && (
                <div className="flex flex-wrap gap-3 pt-5 border-t border-border">
                  <Button
                    variant="success"
                    size="md"
                    loading={processing}
                    onClick={handleApprove}
                    icon={!processing && <Icon name="verified" size="sm" />}
                  >
                    Phê duyệt & Cấp Verified Badge
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    disabled={processing}
                    onClick={handleReject}
                    icon={<Icon name="close" size="sm" />}
                  >
                    Từ chối hồ sơ
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
