import { userFacingError } from '@/utils/userFacingError';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import tutorService from '@/services/tutor.service';
import Money from '@/components/ui/Money';
import { CardSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Tabs from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/Dialog';
import ServiceRow from '@/components/tutor/services/ServiceRow';
import ServiceFilterBar from '@/components/tutor/services/ServiceFilterBar';
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';

const STATUS_TABS = [
  { id: 'All', label: 'Tất cả' },
  { id: 'Draft', label: 'Bản nháp' },
  { id: 'Published', label: "Đã đăng" },
  { id: 'Paused', label: 'Tạm dừng' },
  { id: 'Unpublished', label: "Đã ẩn gói học" },
];

export default function TutorServices() {
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const editState = { serviceReturn: { path: location.pathname + location.search, key: location.key } };

  const [services, setServices] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Packages only exist for approved tutors: the API answers 404 until an admin
  // approves the application, so the page explains the gate instead of failing.
  const [applicationStatus, setApplicationStatus] = useState(null);

  // Tabs & Filters
  const activeTab = STATUS_TABS.some(tab => tab.id === params.get('status')) ? params.get('status') : 'All';
  const search = params.get('search') || '';
  const subjectFilter = params.get('subject') || 'All';
  const changeFilters = useCallback(changes => setParams(previous => {
    const next = new URLSearchParams(previous);
    Object.entries(changes).forEach(([key, value]) => !value || value === 'All' ? next.delete(key) : next.set(key, value));
    return next;
  }, { replace: true }), [setParams]);
  const setActiveTab = value => changeFilters({ status: value });
  const setSearch = value => changeFilters({ search: value });
  const setSubjectFilter = value => changeFilters({ subject: value });

  const [actionInProgressId, setActionInProgressId] = useState(null);

  // Fetch Services & Subjects
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [applicationRes, servicesRes, subjectsRes] = await Promise.allSettled([
        tutorService.getMyApplication(),
        tutorService.getMyServices(),
        tutorService.getSubjects(),
      ]);

      const application = applicationRes.status === 'fulfilled' ? applicationRes.value : null;
      const approved = application?.status === 'Approved';
      setApplicationStatus(application?.status ?? null);

      if (servicesRes.status === 'fulfilled') {
        setServices(Array.isArray(servicesRes.value) ? servicesRes.value : []);
      } else if (approved) {
        // Before approval the 404 is expected, not a failure worth showing.
        setError(servicesRes.reason);
      }

      if (subjectsRes.status === 'fulfilled') {
        setSubjects(Array.isArray(subjectsRes.value) ? subjectsRes.value : []);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Create flow (dedicated wizard page)
  const handleOpenCreate = () => {
    navigate('/tutor/services/new');
  };

  // Publish Action
  const handlePublish = async (pkg) => {
    // The API rejects an incomplete draft with a generic 400, so explain the
    // missing fields before asking the tutor to confirm.
    const incomplete = !pkg.title?.trim()
      || !pkg.description?.trim()
      || !(Number(pkg.totalSessions) > 0)
      || !(Number(pkg.sessionDurationMinutes) > 0)
      || !(Number(pkg.price) > 0);
    if (incomplete) {
      toast.error('Chưa thể đăng gói học: cần có tiêu đề, mô tả, số buổi, thời lượng và học phí. Hãy mở trang chỉnh sửa để bổ sung.');
      return;
    }

    const ok = await confirm({
      title: "Đăng gói học",
      content: (
        <div className="space-y-2 text-caption text-fg-secondary">
          <p>
            Bạn có chắc chắn muốn đăng gói học <strong>&ldquo;{pkg.title}&rdquo;</strong> lên sàn giao dịch?
          </p>
          <div className="bg-neutral-50 p-3 rounded-brand-md border border-border space-y-1">
            <div className="flex justify-between">
              <span>Số buổi:</span>
              <strong className="text-fg">{pkg.totalSessions} buổi ({pkg.sessionDurationMinutes} phút/buổi)</strong>
            </div>
            <div className="flex justify-between">
              <span>Học phí:</span>
              <strong className="text-success-strong">
                <Money value={pkg.price} />
              </strong>
            </div>
          </div>
          <p className="text-[11px] text-fg-muted">
            Sau khi đăng, gói học sẽ hiển thị công khai trên hồ sơ của bạn để học viên đặt mua.
          </p>
        </div>
      ),
      confirmText: "Đăng ngay",
      cancelText: 'Hủy',
      danger: false,
    });

    if (!ok) return;

    try {
      setActionInProgressId(pkg.id);
      await tutorService.publishService(pkg.id);
      toast.success("Gói học đã được đăng công khai.");
      await loadData();
    } catch (err) {
      toast.error(userFacingError(err, "Chưa đăng được gói học. Vui lòng thử lại."));
    } finally {
      setActionInProgressId(null);
    }
  };

  // Unpublish Action
  const handleUnpublish = async (pkg) => {
    const ok = await confirm({
      title: "Ẩn gói học",
      content: (
        <div className="space-y-2 text-caption text-fg-secondary">
          <p>
            Gỡ gói học <strong>&ldquo;{pkg.title}&rdquo;</strong> khỏi hồ sơ công khai của bạn?
          </p>
          <p className="text-xs text-fg-muted">
            Học viên sẽ không thể đặt chỗ gói này nữa. Các hợp đồng đã thanh toán trước đó vẫn tiếp tục học bình thường.
          </p>
        </div>
      ),
      confirmText: "Ẩn gói học",
      cancelText: 'Hủy',
      danger: true,
    });

    if (!ok) return;

    try {
      setActionInProgressId(pkg.id);
      await tutorService.unpublishService(pkg.id);
      toast.success("Đã ẩn gói học.");
      await loadData();
    } catch (err) {
      toast.error(userFacingError(err, 'Chưa ẩn được gói học. Vui lòng thử lại.'));
    } finally {
      setActionInProgressId(null);
    }
  };

  // Pause Action (Published -> Paused)
  const handlePause = async (pkg) => {
    const ok = await confirm({
      title: "Tạm dừng nhận học viên",
      content: (
        <div className="space-y-2 text-caption text-fg-secondary">
          <p>
            Tạm dừng nhận học viên cho gói học <strong>&ldquo;{pkg.title}&rdquo;</strong>? Học viên sẽ
            không thấy gói này trên sàn cho đến khi bạn tiếp tục.
          </p>
          <p className="text-xs text-fg-muted">
            Các hợp đồng đã thanh toán trước đó vẫn tiếp tục học bình thường.
          </p>
        </div>
      ),
      confirmText: 'Tạm dừng',
      cancelText: 'Hủy',
      danger: false,
    });

    if (!ok) return;

    try {
      setActionInProgressId(pkg.id);
      await tutorService.pauseService(pkg.id);
      toast.success("Đã tạm dừng nhận học viên cho gói học.");
      await loadData();
    } catch (err) {
      toast.error(userFacingError(err, 'Chưa tạm dừng được gói học. Vui lòng thử lại.'));
    } finally {
      setActionInProgressId(null);
    }
  };

  // Resume Action (Paused -> Published)
  const handleResume = async (pkg) => {
    try {
      setActionInProgressId(pkg.id);
      await tutorService.resumeService(pkg.id);
      toast.success('Đã tiếp tục tuyển sinh gói học.');
      await loadData();
    } catch (err) {
      toast.error(userFacingError(err, 'Chưa mở lại việc nhận học viên. Vui lòng thử lại.'));
    } finally {
      setActionInProgressId(null);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const published = services.filter((s) => s.status === 'Published').length;
    const draft = services.filter((s) => s.status === 'Draft').length;
    const paused = services.filter((s) => s.status === 'Paused').length;
    const unpublished = services.filter((s) => s.status === 'Unpublished').length;
    return {
      total: services.length,
      published,
      draft,
      paused,
      unpublished,
    };
  }, [services]);

  const tabCounts = useMemo(
    () => ({
      All: stats.total,
      Draft: stats.draft,
      Published: stats.published,
      Paused: stats.paused,
      Unpublished: stats.unpublished,
    }),
    [stats]
  );

  // Clear search + dropdown filters (keeps the active status tab)
  const handleClearFilters = useCallback(() => {
    changeFilters({ search: null, subject: null });
  }, [changeFilters]);

  // Clear everything including the status tab
  const handleClearAll = useCallback(() => {
    changeFilters({ search: null, subject: null, status: null });
  }, [changeFilters]);

  // Active filter chips (search keyword + dropdowns)
  const activeChips = useMemo(() => {
    const chips = [];
    const keyword = search.trim();
    if (keyword) {
      chips.push({ key: 'search', label: `Từ khóa: ${keyword}`, clear: () => changeFilters({ search: null }) });
    }
    if (subjectFilter !== 'All') {
      const name = subjects.find((s) => s.id === subjectFilter)?.name || 'Môn học';
      chips.push({ key: 'subject', label: name, clear: () => changeFilters({ subject: null }) });
    }
    return chips;
  }, [search, subjectFilter, subjects, changeFilters]);

  // Filtered services
  const filteredServices = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return services.filter((item) => {
      const matchTab = activeTab === 'All' || item.status === activeTab;
      const matchSubject = subjectFilter === 'All' || item.subjectId === subjectFilter;
      const matchSearch =
        !keyword ||
        item.title?.toLowerCase().includes(keyword) ||
        item.subjectName?.toLowerCase().includes(keyword);
      return matchTab && matchSubject && matchSearch;
    });
  }, [services, activeTab, subjectFilter, search]);

  const approved = applicationStatus === 'Approved';

  if (!loading && !approved) {
    const title = applicationStatus === 'Pending'
      ? 'Hồ sơ gia sư đang chờ duyệt'
      : applicationStatus === 'Rejected' ? 'Hồ sơ gia sư đã bị từ chối' : 'Bạn chưa gửi hồ sơ gia sư';
    const hint = applicationStatus === 'Pending'
      ? 'Bạn tạo được gói học ngay sau khi quản trị viên duyệt hồ sơ. Trong lúc chờ, hãy kiểm tra lại thông tin hồ sơ của mình.'
      : applicationStatus === 'Rejected'
        ? 'Gói học chỉ mở sau khi hồ sơ được duyệt. Hãy xem lý do từ chối và gửi lại hồ sơ.'
        : 'Gói học chỉ mở sau khi hồ sơ gia sư của bạn được duyệt.';

    return (
      <div className="space-y-6 lg:space-y-8">
        <WorkspacePageHeader title="Gói học của tôi" description="Quản lý nội dung, học phí và trạng thái tuyển sinh của các gói học." />
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <p className="text-body-reg font-semibold text-fg">{title}</p>
          <p className="mt-2 max-w-2xl text-caption leading-relaxed text-fg-secondary">{hint}</p>
          <Button variant="primary" size="md" className="mt-4" onClick={() => navigate('/tutor/application')}>
            {applicationStatus === 'Rejected' ? 'Xem lý do và gửi lại hồ sơ' : 'Mở hồ sơ gia sư'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8" data-discovery-loading={loading}>
      {/* Title row */}
      <WorkspacePageHeader title="Gói học của tôi" description="Quản lý nội dung, học phí và trạng thái tuyển sinh của các gói học."
        actions={approved ? <Button
          variant="primary"
          size="md"
          onClick={handleOpenCreate}
          icon={<Icon name="add" size="sm" />}
          className="shrink-0"
        >
          Tạo gói học
        </Button> : undefined} />

      {!loading && !error && <dl aria-label="Tóm tắt gói học" className="flex flex-wrap gap-x-8 gap-y-4 rounded-2xl border border-border bg-surface px-5 py-4 sm:px-6">
        {[[stats.total, 'Tổng gói học'], [stats.published, 'Đang tuyển sinh'], [stats.draft, 'Bản nháp'], [stats.paused, 'Tạm dừng']].map(([value, label]) => <div key={label} className="flex items-baseline gap-2"><dt className="text-caption text-fg-secondary">{label}</dt><dd className="text-xl font-semibold text-fg">{value}</dd></div>)}
      </dl>}

      {/* Status tabs with counts */}
      <Tabs
        tabs={STATUS_TABS.map((t) => ({
          key: t.id,
          label: `${t.label} (${tabCounts[t.id] ?? 0})`,
        }))}
        value={activeTab}
        onChange={setActiveTab}
      />

      {/* Search & filters */}
      <ServiceFilterBar
        search={search}
        onSearchChange={setSearch}
        subjects={subjects}
        subjectId={subjectFilter}
        onSubjectIdChange={setSubjectFilter}
        onClear={handleClearFilters}
      />

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-caption">
          <span className="text-fg-secondary font-medium">Đang lọc:</span>
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.clear}
              className="inline-flex min-h-11 items-center gap-1.5 pl-3 pr-2 rounded-full bg-brand-primary-50 border border-brand-primary-100 text-brand-primary-700 font-medium hover:bg-brand-primary-100 transition-colors cursor-pointer"
              aria-label={`Xóa bộ lọc ${chip.label}`}
            >
              {chip.label}
              <Icon name="close" size="xs" />
            </button>
          ))}
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex min-h-11 items-center px-2 text-fg-secondary hover:text-fg font-medium underline underline-offset-2 cursor-pointer"
          >
            Xóa tất cả
          </button>
        </div>
      )}

      {/* Content */}
      {loading && <CardSkeleton count={3} />}

      {error && (
        <ErrorState
          error={error}
          title="Không thể tải danh sách gói học"
          onRetry={loadData}
        />
      )}

      {!loading && !error && filteredServices.length === 0 && (
        <EmptyState
          icon="inventory_2"
          title={
            search || subjectFilter !== 'All'
              ? 'Không tìm thấy gói học phù hợp'
              : activeTab !== 'All'
                ? `Chưa có gói học nào ở trạng thái ${
                    STATUS_TABS.find((t) => t.id === activeTab)?.label
                  }`
                : 'Bạn chưa tạo gói học nào'
          }
          description={
            search || subjectFilter !== 'All'
              ? 'Hãy thử thay đổi từ khóa hoặc bộ lọc.'
              : activeTab === 'All' ? 'Tạo gói học đầu tiên để giới thiệu lộ trình của bạn tới học viên.' : 'Chọn trạng thái khác để xem các gói học của bạn.'
          }
          actionLabel={!search && activeTab === 'All' && subjectFilter === 'All' ? 'Tạo gói học ngay' : undefined}
          onAction={!search && activeTab === 'All' && subjectFilter === 'All' ? handleOpenCreate : undefined}
        />
      )}

      {!loading && !error && filteredServices.length > 0 && (
        <div className="space-y-4">
          {filteredServices.map((pkg) => (
            <ServiceRow
              key={pkg.id}
              pkg={pkg}
              isActing={actionInProgressId === pkg.id}
              editState={editState}
              disabled={Boolean(actionInProgressId)}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
              onPause={handlePause}
              onResume={handleResume}
            />
          ))}
        </div>
      )}

    </div>
  );
}
