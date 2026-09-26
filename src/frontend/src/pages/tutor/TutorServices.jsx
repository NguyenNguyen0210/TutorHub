import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import tutorService from '@/services/tutor.service';
import Money from '@/components/ui/Money';
import { TEACHING_MODE } from '@/config/enums';
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
import ServiceDrawer from '@/components/tutor/services/ServiceDrawer';
import {
  createInitialFormState,
  validateServiceForm,
  collectFaqs,
  buildServicePayload,
} from '@/components/tutor/services/serviceFormUtils';

const INITIAL_FORM_STATE = createInitialFormState();

const STATUS_TABS = [
  { id: 'All', label: 'Tất cả' },
  { id: 'Draft', label: 'Bản nháp' },
  { id: 'Published', label: 'Đã xuất bản' },
  { id: 'Paused', label: 'Tạm dừng' },
  { id: 'Unpublished', label: 'Đã gỡ xuất bản' },
];

const STATUS_LABELS = {
  All: 'Tất cả',
  Draft: 'Bản nháp',
  Published: 'Đã xuất bản',
  Paused: 'Tạm dừng',
  Unpublished: 'Đã gỡ xuất bản',
};

export default function TutorServices() {
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Drawer State (Create / Edit)
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState(null);

  useEffect(() => {
    document.title = 'Dịch vụ của tôi — TutorHub';
  }, []);

  // Fetch Services & Subjects
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [servicesRes, subjectsRes] = await Promise.allSettled([
        tutorService.getMyServices(),
        tutorService.getSubjects(),
      ]);

      if (servicesRes.status === 'fulfilled') {
        setServices(Array.isArray(servicesRes.value) ? servicesRes.value : []);
      } else {
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

  // Open Edit Drawer
  const handleOpenEdit = (pkg) => {
    setEditingService(pkg);
    setFormData({
      subjectId: pkg.subjectId || '',
      title: pkg.title || '',
      shortDescription: pkg.shortDescription || '',
      description: pkg.description || '',
      learningScope: pkg.learningScope || '',
      expectedOutcome: pkg.expectedOutcome || '',
      totalSessions: pkg.totalSessions || 10,
      sessionDurationMinutes: pkg.sessionDurationMinutes || 60,
      price: pkg.price || 0,
      teachingMode: pkg.teachingMode || TEACHING_MODE.ONLINE,
      trialLessonUrl: pkg.trialLessonUrl || '',
      tags: Array.isArray(pkg.tags) ? pkg.tags.join(', ') : pkg.tags || '',
      coverImageUrl: pkg.coverImageUrl || '',
      // Hydrate backend shapes (arrays) into the editors' local shapes.
      sessions: Array.isArray(pkg.curriculum)
        ? pkg.curriculum.map((c) => ({
          title: c.title || '',
          description: c.description || '',
          keyTopicsText: Array.isArray(c.keyTopics) ? c.keyTopics.join(', ') : '',
          durationMinutes: c.durationMinutes ?? '',
        }))
        : [],
      targetAudienceText: Array.isArray(pkg.targetAudience)
        ? pkg.targetAudience.join('\n')
        : '',
      prerequisitesText: Array.isArray(pkg.prerequisites)
        ? pkg.prerequisites.join('\n')
        : '',
      faqs: Array.isArray(pkg.faqs)
        ? pkg.faqs.map((f) => ({ question: f.question || '', answer: f.answer || '' }))
        : [],
    });
    setShowDrawer(true);
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateServiceForm(formData, editingService ? 'update' : 'create');
    if (validationError) {
      toast.error(validationError);
      return;
    }
    const { error: faqError } = collectFaqs(formData);
    if (faqError) {
      toast.error(faqError);
      return;
    }

    try {
      setSubmitting(true);

      if (editingService) {
        // PATCH update (commercial terms locked while Published)
        const payload = buildServicePayload(formData, {
          mode: 'update',
          lockCommercialTerms: editingService.status === 'Published',
        });

        await tutorService.updateService(editingService.id, payload);
        toast.success('Đã cập nhật gói dịch vụ thành công.');
      } else {
        // POST create
        const payload = buildServicePayload(formData, { mode: 'create' });

        await tutorService.createService(payload);
        toast.success('Đã tạo gói dịch vụ mới ở trạng thái Bản nháp (Draft).');
      }

      setShowDrawer(false);
      await loadData();
    } catch (err) {
      toast.error(err?.message || 'Không thể lưu gói dịch vụ.');
    } finally {
      setSubmitting(false);
    }
  };

  // Publish Action
  const handlePublish = async (pkg) => {
    const ok = await confirm({
      title: 'Xuất bản gói dịch vụ',
      content: (
        <div className="space-y-2 text-caption text-fg-secondary">
          <p>
            Bạn có chắc chắn muốn xuất bản gói học <strong>&ldquo;{pkg.title}&rdquo;</strong> lên sàn giao dịch?
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
            Sau khi xuất bản, gói học sẽ hiển thị công khai trên hồ sơ của bạn để học viên đặt mua.
          </p>
        </div>
      ),
      confirmText: 'Xuất bản ngay',
      cancelText: 'Hủy',
      danger: false,
    });

    if (!ok) return;

    try {
      setActionInProgressId(pkg.id);
      await tutorService.publishService(pkg.id);
      toast.success('Gói dịch vụ đã được xuất bản công khai.');
      await loadData();
    } catch (err) {
      toast.error(err?.message || 'Không thể xuất bản gói dịch vụ.');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Unpublish Action
  const handleUnpublish = async (pkg) => {
    const ok = await confirm({
      title: 'Tạm ẩn gói dịch vụ',
      content: (
        <div className="space-y-2 text-caption text-fg-secondary">
          <p>
            Tạm ẩn gói học <strong>&ldquo;{pkg.title}&rdquo;</strong> khỏi hồ sơ công khai của bạn?
          </p>
          <p className="text-xs text-fg-muted">
            Học viên sẽ không thể đặt chỗ gói này nữa. Các hợp đồng đã thanh toán trước đó vẫn tiếp tục học bình thường.
          </p>
        </div>
      ),
      confirmText: 'Tạm ẩn gói',
      cancelText: 'Hủy',
      danger: true,
    });

    if (!ok) return;

    try {
      setActionInProgressId(pkg.id);
      await tutorService.unpublishService(pkg.id);
      toast.success('Đã tạm ẩn gói dịch vụ.');
      await loadData();
    } catch (err) {
      toast.error(err?.message || 'Không thể tạm ẩn gói dịch vụ.');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Pause Action (Published -> Paused)
  const handlePause = async (pkg) => {
    const ok = await confirm({
      title: 'Tạm dừng tuyển sinh',
      content: (
        <div className="space-y-2 text-caption text-fg-secondary">
          <p>
            Tạm dừng tuyển sinh gói học <strong>&ldquo;{pkg.title}&rdquo;</strong>? Học viên sẽ
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
      toast.success('Đã tạm dừng tuyển sinh gói dịch vụ.');
      await loadData();
    } catch (err) {
      toast.error(err?.message || 'Không thể tạm dừng gói dịch vụ.');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Resume Action (Paused -> Published)
  const handleResume = async (pkg) => {
    try {
      setActionInProgressId(pkg.id);
      await tutorService.resumeService(pkg.id);
      toast.success('Đã tiếp tục tuyển sinh gói dịch vụ.');
      await loadData();
    } catch (err) {
      toast.error(err?.message || 'Không thể tiếp tục gói dịch vụ.');
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
    setSearch('');
    setSubjectFilter('All');
    setStatusFilter('All');
  }, []);

  // Clear everything including the status tab
  const handleClearAll = useCallback(() => {
    setSearch('');
    setSubjectFilter('All');
    setStatusFilter('All');
    setActiveTab('All');
  }, []);

  // Active filter chips (search keyword + dropdowns)
  const activeChips = useMemo(() => {
    const chips = [];
    const keyword = search.trim();
    if (keyword) {
      chips.push({ key: 'search', label: `Từ khóa: ${keyword}`, clear: () => setSearch('') });
    }
    if (subjectFilter !== 'All') {
      const name = subjects.find((s) => s.id === subjectFilter)?.name || 'Môn học';
      chips.push({ key: 'subject', label: name, clear: () => setSubjectFilter('All') });
    }
    if (statusFilter !== 'All') {
      chips.push({ key: 'status', label: STATUS_LABELS[statusFilter] || statusFilter, clear: () => setStatusFilter('All') });
    }
    return chips;
  }, [search, subjectFilter, statusFilter, subjects]);

  // Filtered services
  const filteredServices = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return services.filter((item) => {
      const matchTab = activeTab === 'All' || item.status === activeTab;
      const matchStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchSubject = subjectFilter === 'All' || item.subjectId === subjectFilter;
      const matchSearch =
        !keyword ||
        item.title?.toLowerCase().includes(keyword) ||
        item.subjectName?.toLowerCase().includes(keyword);
      return matchTab && matchStatus && matchSubject && matchSearch;
    });
  }, [services, activeTab, statusFilter, subjectFilter, search]);

  return (
    <div className="space-y-5">
      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-[30px] leading-[1.2] font-bold text-fg tracking-tight">Dịch vụ của tôi</h1>
          <p className="text-body-reg text-fg-secondary mt-1">
            Quản lý các gói học bạn đang cung cấp
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={handleOpenCreate}
          icon={<Icon name="add" size="sm" />}
          className="shrink-0"
        >
          Tạo dịch vụ mới
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" aria-label="Tổng quan dịch vụ">
        <div className="bg-surface border border-border rounded-brand-lg p-4">
          <p className="text-2xl font-bold tabular-nums tracking-tight text-fg">{stats.total}</p>
          <p className="text-caption font-medium text-fg-secondary mt-1">Tổng</p>
        </div>
        <div className="bg-surface border border-border rounded-brand-lg p-4">
          <p className="text-2xl font-bold tabular-nums tracking-tight text-brand-primary-600">{stats.published}</p>
          <p className="text-caption font-medium text-fg-secondary mt-1">Xuất bản</p>
        </div>
        <div className="bg-surface border border-border rounded-brand-lg p-4">
          <p className="text-2xl font-bold tabular-nums tracking-tight text-fg">{stats.draft}</p>
          <p className="text-caption font-medium text-fg-secondary mt-1">Bản nháp</p>
        </div>
        <div className="bg-surface border border-border rounded-brand-lg p-4">
          <p className="text-2xl font-bold tabular-nums tracking-tight text-fg">{stats.unpublished}</p>
          <p className="text-caption font-medium text-fg-secondary mt-1">Chưa xuất bản</p>
        </div>
      </div>

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
        status={statusFilter}
        onStatusChange={setStatusFilter}
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
              className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-brand-primary-50 border border-brand-primary-100 text-brand-primary-700 font-medium hover:bg-brand-primary-100 transition-colors cursor-pointer"
              aria-label={`Xóa bộ lọc ${chip.label}`}
            >
              {chip.label}
              <Icon name="close" size="xs" />
            </button>
          ))}
          <button
            type="button"
            onClick={handleClearAll}
            className="text-fg-secondary hover:text-fg font-medium underline underline-offset-2 cursor-pointer"
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
          title="Không thể tải danh sách gói dịch vụ"
          onRetry={loadData}
        />
      )}

      {!loading && !error && filteredServices.length === 0 && (
        <EmptyState
          icon={<Icon name="inventory_2" size="xl" />}
          title={
            search || subjectFilter !== 'All' || statusFilter !== 'All'
              ? 'Không tìm thấy gói dịch vụ phù hợp'
              : activeTab !== 'All'
                ? `Chưa có gói dịch vụ nào ở trạng thái ${
                    STATUS_TABS.find((t) => t.id === activeTab)?.label
                  }`
                : 'Chưa có gói dịch vụ nào'
          }
          description={
            search || subjectFilter !== 'All' || statusFilter !== 'All'
              ? 'Hãy thử thay đổi từ khóa hoặc bộ lọc.'
              : 'Hãy bắt đầu thiết kế gói học đầu tiên của bạn để thu hút học viên đăng ký trên TutorHub.'
          }
          action={
            !search && activeTab === 'All' && subjectFilter === 'All' && statusFilter === 'All' ? (
              <Button variant="primary" size="md" onClick={handleOpenCreate} icon={<Icon name="add" size="sm" />}>
                Tạo gói học ngay
              </Button>
            ) : null
          }
        />
      )}

      {!loading && !error && filteredServices.length > 0 && (
        <div className="space-y-4">
          {filteredServices.map((pkg) => (
            <ServiceRow
              key={pkg.id}
              pkg={pkg}
              isActing={actionInProgressId === pkg.id}
              onEdit={handleOpenEdit}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
              onPause={handlePause}
              onResume={handleResume}
            />
          ))}
        </div>
      )}

      {/* Edit Drawer (creation moved to /tutor/services/new) */}

      {/* Create / Edit Drawer */}
      <ServiceDrawer
        open={showDrawer}
        onClose={() => setShowDrawer(false)}
        editingService={editingService}
        subjects={subjects}
        formData={formData}
        onFieldChange={handleFieldChange}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  );
}
