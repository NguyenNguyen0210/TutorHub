import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import ServiceDrawer, { parseTags } from '@/components/tutor/services/ServiceDrawer';

const SHORT_DESCRIPTION_MAX = 200;
const TAGS_MAX = 10;

const STATUS_TABS = [
  { id: 'All', label: 'Tất cả' },
  { id: 'Draft', label: 'Bản nháp' },
  { id: 'Published', label: 'Đã xuất bản' },
  { id: 'Paused', label: 'Tạm dừng' },
  { id: 'Unpublished', label: 'Đã ẩn' },
];

const INITIAL_FORM_STATE = {
  subjectId: '',
  title: '',
  shortDescription: '',
  description: '',
  learningScope: '',
  expectedOutcome: '',
  totalSessions: 10,
  sessionDurationMinutes: 60,
  price: 2000000,
  teachingMode: TEACHING_MODE.ONLINE,
  trialLessonUrl: '',
  tags: '',
  coverImageUrl: '',
};

export default function TutorServices() {
  const toast = useToast();
  const confirm = useConfirm();

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

  // Open Create Drawer
  const handleOpenCreate = () => {
    setEditingService(null);
    setFormData({
      ...INITIAL_FORM_STATE,
      subjectId: subjects[0]?.id || '',
    });
    setShowDrawer(true);
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
    });
    setShowDrawer(true);
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || formData.title.trim().length < 5) {
      toast.error('Tiêu đề gói học cần tối thiểu 5 ký tự.');
      return;
    }

    if (!formData.description.trim() || formData.description.trim().length < 20) {
      toast.error('Mô tả gói học cần tối thiểu 20 ký tự để học viên nắm rõ lộ trình.');
      return;
    }

    const shortDescription = (formData.shortDescription || '').trim();
    if (shortDescription.length > SHORT_DESCRIPTION_MAX) {
      toast.error(`Mô tả ngắn tối đa ${SHORT_DESCRIPTION_MAX} ký tự.`);
      return;
    }

    const tags = parseTags(formData.tags);
    if (tags.length > TAGS_MAX) {
      toast.error(`Tối đa ${TAGS_MAX} thẻ liên quan cho mỗi gói học.`);
      return;
    }

    const coverImageUrl = (formData.coverImageUrl || '').trim();

    if (Number(formData.totalSessions) < 1) {
      toast.error('Số buổi học phải từ 1 buổi trở lên.');
      return;
    }

    if (Number(formData.price) <= 0) {
      toast.error('Học phí gói học phải lớn hơn 0 ₫.');
      return;
    }

    try {
      setSubmitting(true);

      if (editingService) {
        // PATCH update
        const payload = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          learningScope: formData.learningScope.trim() || null,
          expectedOutcome: formData.expectedOutcome.trim() || null,
          trialLessonUrl: formData.trialLessonUrl.trim() || null,
          // New optional keys are omitted when unused so the current backend
          // (which doesn't know them yet) simply ignores nothing breaking.
          ...(shortDescription ? { shortDescription } : {}),
          ...(tags.length ? { tags } : {}),
          ...(coverImageUrl ? { coverImageUrl } : {}),
        };

        // If not published, allow changing commercial terms
        if (editingService.status !== 'Published') {
          payload.totalSessions = Number(formData.totalSessions);
          payload.sessionDurationMinutes = Number(formData.sessionDurationMinutes);
          payload.price = Number(formData.price);
          payload.teachingMode = formData.teachingMode;
        }

        await tutorService.updateService(editingService.id, payload);
        toast.success('Đã cập nhật gói dịch vụ thành công.');
      } else {
        // POST create
        if (!formData.subjectId) {
          toast.error('Vui lòng chọn môn học cho gói dịch vụ.');
          return;
        }

        const payload = {
          subjectId: formData.subjectId,
          title: formData.title.trim(),
          description: formData.description.trim(),
          learningScope: formData.learningScope.trim() || null,
          expectedOutcome: formData.expectedOutcome.trim() || null,
          totalSessions: Number(formData.totalSessions),
          sessionDurationMinutes: Number(formData.sessionDurationMinutes),
          price: Number(formData.price),
          teachingMode: formData.teachingMode,
          trialLessonUrl: formData.trialLessonUrl.trim() || null,
          ...(shortDescription ? { shortDescription } : {}),
          ...(tags.length ? { tags } : {}),
          ...(coverImageUrl ? { coverImageUrl } : {}),
        };

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
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-headline-1 text-fg">Dịch vụ của tôi</h1>
          <p className="text-body-reg text-fg-secondary mt-1">
            Quản lý các gói học, khóa học và dịch vụ gia sư của bạn.
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
            />
          ))}
        </div>
      )}

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
