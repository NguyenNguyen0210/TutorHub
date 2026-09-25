import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import tutorService from '@/services/tutor.service';
import Money from '@/components/ui/Money';
import { getTeachingModeMeta, TEACHING_MODE } from '@/config/enums';
import { CardSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Tabs from '@/components/ui/Tabs';
import Input, { Textarea, Select, Field } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/Dialog';
import StatCard, { PageHeader } from '@/components/ui/StatCard';

const STATUS_TABS = [
  { id: 'All', label: 'Tất cả' },
  { id: 'Published', label: 'Đang tuyển sinh' },
  { id: 'Draft', label: 'Bản nháp' },
  { id: 'Unpublished', label: 'Tạm ẩn' },
];

const TEACHING_MODE_OPTIONS = [
  { value: TEACHING_MODE.ONLINE, label: 'Trực tuyến (Online)' },
  { value: TEACHING_MODE.OFFLINE, label: 'Tại nhà (Offline)' },
  { value: TEACHING_MODE.BOTH, label: 'Cả Online & Tại nhà' },
];

const INITIAL_FORM_STATE = {
  subjectId: '',
  title: '',
  description: '',
  learningScope: '',
  expectedOutcome: '',
  totalSessions: 10,
  sessionDurationMinutes: 60,
  price: 2000000,
  teachingMode: TEACHING_MODE.ONLINE,
  trialLessonUrl: '',
};

export default function TutorServices() {
  const toast = useToast();
  const confirm = useConfirm();

  const [services, setServices] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tabs & Search
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');

  // Modal State (Create / Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState(null);

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

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingService(null);
    setFormData({
      ...INITIAL_FORM_STATE,
      subjectId: subjects[0]?.id || '',
    });
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (pkg) => {
    setEditingService(pkg);
    setFormData({
      subjectId: pkg.subjectId || '',
      title: pkg.title || '',
      description: pkg.description || '',
      learningScope: pkg.learningScope || '',
      expectedOutcome: pkg.expectedOutcome || '',
      totalSessions: pkg.totalSessions || 10,
      sessionDurationMinutes: pkg.sessionDurationMinutes || 60,
      price: pkg.price || 0,
      teachingMode: pkg.teachingMode || TEACHING_MODE.ONLINE,
      trialLessonUrl: pkg.trialLessonUrl || '',
    });
    setShowModal(true);
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
        };

        await tutorService.createService(payload);
        toast.success('Đã tạo gói dịch vụ mới ở trạng thái Bản nháp (Draft).');
      }

      setShowModal(false);
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
    const unpublished = services.filter((s) => s.status === 'Unpublished').length;
    return {
      total: services.length,
      published,
      draft,
      unpublished,
    };
  }, [services]);

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter((item) => {
      const matchTab = activeTab === 'All' || item.status === activeTab;
      const matchSearch =
        !search.trim() ||
        item.title?.toLowerCase().includes(search.trim().toLowerCase()) ||
        item.subjectName?.toLowerCase().includes(search.trim().toLowerCase());
      return matchTab && matchSearch;
    });
  }, [services, activeTab, search]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Published':
        return <Badge variant="success" size="sm">Đang tuyển sinh</Badge>;
      case 'Draft':
        return <Badge variant="holding" size="sm">Bản nháp</Badge>;
      case 'Unpublished':
        return <Badge variant="neutral" size="sm">Tạm ẩn</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý danh mục gói dịch vụ giảng dạy"
        subtitle="Các gói học theo số buổi, thời lượng và cam kết đầu ra bảo chứng Escrow"
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreate}
            icon={<Icon name="add" size="sm" />}
          >
            Tạo gói dịch vụ mới
          </Button>
        }
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Đang mở tuyển sinh"
          value={`${stats.published} gói`}
          hint="Hiển thị công khai trên Marketplace"
          icon={<Icon name="check_circle" size="md" />}
          tone="success"
        />
        <StatCard
          label="Bản nháp chờ hoàn thiện"
          value={`${stats.draft} gói`}
          hint="Chỉ bạn nhìn thấy, chưa mở bán"
          icon={<Icon name="edit_note" size="md" />}
          tone="holding"
        />
        <StatCard
          label="Tổng danh mục gói học"
          value={`${stats.total} gói`}
          hint="Bao gồm cả các gói đang tạm ẩn"
          icon={<Icon name="inventory_2" size="md" />}
          tone="primary"
        />
      </div>

      {/* Filter & Search Bar */}
      <Card padding="none" className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <Tabs
          items={STATUS_TABS}
          value={activeTab}
          onChange={setActiveTab}
        />
        <div className="w-full sm:w-72">
          <Input
            type="search"
            placeholder="Tìm theo tiêu đề, môn học..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            iconLeft={<Icon name="search" size="sm" />}
          />
        </div>
      </Card>

      {/* Content Rendering */}
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
            search
              ? 'Không tìm thấy gói dịch vụ phù hợp'
              : activeTab !== 'All'
                ? `Chưa có gói dịch vụ nào ở trạng thái ${
                    STATUS_TABS.find((t) => t.id === activeTab)?.label
                  }`
                : 'Chưa có gói dịch vụ nào'
          }
          description={
            search
              ? `Không có kết quả nào cho từ khóa "${search}".`
              : 'Hãy bắt đầu thiết kế gói học đầu tiên của bạn để thu hút học viên đăng ký trên TutorHub.'
          }
          action={
            !search && activeTab === 'All' ? (
              <Button variant="primary" size="md" onClick={handleOpenCreate} icon={<Icon name="add" size="sm" />}>
                Tạo gói học ngay
              </Button>
            ) : null
          }
        />
      )}

      {!loading && !error && filteredServices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((pkg) => {
            const modeMeta = getTeachingModeMeta(pkg.teachingMode);
            const isActing = actionInProgressId === pkg.id;
            const pricePerSession =
              pkg.totalSessions > 0 ? Math.round(pkg.price / pkg.totalSessions) : pkg.price;

            return (
              <Card
                key={pkg.id}
                hoverable
                className="flex flex-col justify-between space-y-4 border border-border shadow-brand-xs hover:shadow-brand-md transition-shadow"
              >
                <div className="space-y-3">
                  {/* Status & Sessions count */}
                  <div className="flex items-center justify-between">
                    {getStatusBadge(pkg.status)}
                    <span className="text-caption font-bold text-brand-primary-700 font-mono bg-brand-primary-50 px-2 py-0.5 rounded border border-brand-primary-100">
                      {pkg.totalSessions} buổi ({pkg.sessionDurationMinutes}p)
                    </span>
                  </div>

                  {/* Title & Subject */}
                  <div>
                    <span className="text-[11px] font-bold text-brand-primary-700 uppercase tracking-wide">
                      {pkg.subjectName || 'Môn học chung'}
                    </span>
                    <Link
                      to={`/services/${pkg.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-brand-primary-600 transition-colors block"
                    >
                      <h3 className="text-headline-3 text-fg line-clamp-2 mt-0.5 hover:text-brand-primary-600" title={pkg.title}>
                        {pkg.title}
                      </h3>
                    </Link>
                  </div>

                  {/* Description preview */}
                  <p className="text-caption text-fg-muted line-clamp-2 m-0 leading-relaxed">
                    {pkg.description}
                  </p>

                  {/* Pricing Breakdown */}
                  <div className="p-3 bg-neutral-50 rounded-brand-md border border-border space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-caption text-fg-secondary">Học phí trọn gói:</span>
                      <span className="text-body font-bold text-success-strong font-mono">
                        <Money value={pkg.price} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-fg-muted">
                      <span>Đơn giá mỗi buổi:</span>
                      <span className="font-mono">{pricePerSession.toLocaleString('vi-VN')} ₫/buổi</span>
                    </div>
                  </div>

                  {/* Metadata Specs */}
                  <dl className="space-y-1.5 text-caption text-fg-secondary pt-1 border-t border-border">
                    <div className="flex justify-between">
                      <dt>Hình thức dạy:</dt>
                      <dd className="font-semibold text-fg">{modeMeta.label}</dd>
                    </div>
                    {pkg.learningScope && (
                      <div className="flex justify-between">
                        <dt>Giáo trình:</dt>
                        <dd className="font-medium text-fg truncate max-w-[170px]" title={pkg.learningScope}>
                          {pkg.learningScope}
                        </dd>
                      </div>
                    )}
                    {pkg.trialLessonUrl && (
                      <div className="flex justify-between items-center text-xs text-brand-primary-700">
                        <dt className="flex items-center gap-1">
                          <Icon name="play_circle" size="xs" />
                          Học thử:
                        </dt>
                        <dd>Có video giới thiệu</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(pkg)}
                      icon={<Icon name="edit" size="xs" />}
                    >
                      Chỉnh sửa
                    </Button>
                    <Button
                      as={Link}
                      to={`/services/${pkg.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="ghost"
                      size="sm"
                      icon={<Icon name="visibility" size="xs" />}
                      title="Xem trang chi tiết công khai"
                    >
                      Xem trang
                    </Button>
                  </div>

                  {pkg.status === 'Published' ? (
                    <Button
                      variant="danger-ghost"
                      size="sm"
                      loading={isActing}
                      onClick={() => handleUnpublish(pkg)}
                      icon={<Icon name="visibility_off" size="xs" />}
                    >
                      Tạm ẩn
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      loading={isActing}
                      onClick={() => handlePublish(pkg)}
                      icon={<Icon name="rocket_launch" size="xs" />}
                    >
                      Xuất bản
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Service Modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
        >
          <button
            type="button"
            aria-label="Đóng cửa sổ"
            className="fixed inset-0 w-full h-full bg-black/60 backdrop-blur-xs cursor-default"
            onClick={() => setShowModal(false)}
            tabIndex={-1}
          />
          <div className="relative bg-surface rounded-brand-xl shadow-brand-xl border border-border w-full max-w-2xl max-h-[90vh] flex flex-col z-10">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-2">
                <Icon name="school" size="md" className="text-brand-primary-600" />
                <h3 id="service-modal-title" className="text-headline-3 text-fg font-bold m-0">
                  {editingService ? 'Chỉnh sửa gói dịch vụ' : 'Tạo mới gói dịch vụ giảng dạy'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Đóng"
                className="text-fg-muted hover:text-fg p-1 rounded-brand-md transition-colors"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-caption">
              {/* Subject Selection (only when creating) */}
              {!editingService ? (
                <Field label="Môn học giảng dạy" htmlFor="service-subject" required>
                  <Select
                    id="service-subject"
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    required
                  >
                    <option value="" disabled>
                      -- Chọn môn học giảng dạy --
                    </option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.categoryName || 'Chung'})
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : (
                <div className="p-3 bg-neutral-50 rounded-brand-md border border-border flex justify-between items-center text-xs">
                  <span className="text-fg-muted">Môn học đã đăng ký:</span>
                  <strong className="text-fg">{editingService.subjectName}</strong>
                </div>
              )}

              {/* Title */}
              <Field label="Tiêu đề gói học" htmlFor="service-title" required>
                <Input
                  id="service-title"
                  placeholder="Ví dụ: Ôn thi Đại học môn Toán 9+ cấp tốc (10 buổi)"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </Field>

              {/* Description */}
              <Field label="Mô tả chi tiết nội dung khóa học" htmlFor="service-desc" required>
                <Textarea
                  id="service-desc"
                  rows={4}
                  placeholder="Giới thiệu lộ trình học, phương pháp giảng dạy, bài tập rèn luyện và cam kết học tập..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </Field>

              {/* Commercial Terms Warning if Published */}
              {editingService?.status === 'Published' && (
                <div className="p-3 bg-holding-subtle text-holding-strong rounded-brand-md text-xs">
                  <strong>Khóa điều khoản thương mại:</strong> Gói học đang tuyển sinh không thể sửa trực tiếp số buổi, thời lượng hay giá tiền (để bảo vệ các đơn hàng đang checkout). Vui lòng <strong>Tạm ẩn</strong> gói nếu muốn đổi giá hoặc số buổi.
                </div>
              )}

              {/* Grid: Sessions, Duration, Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Số buổi học" htmlFor="service-sessions" required>
                  <Input
                    id="service-sessions"
                    type="number"
                    min="1"
                    max="100"
                    disabled={editingService?.status === 'Published'}
                    value={formData.totalSessions}
                    onChange={(e) => setFormData({ ...formData, totalSessions: e.target.value })}
                    required
                  />
                </Field>

                <Field label="Thời lượng/buổi (phút)" htmlFor="service-duration" required>
                  <Input
                    id="service-duration"
                    type="number"
                    min="30"
                    step="15"
                    max="240"
                    disabled={editingService?.status === 'Published'}
                    value={formData.sessionDurationMinutes}
                    onChange={(e) => setFormData({ ...formData, sessionDurationMinutes: e.target.value })}
                    required
                  />
                </Field>

                <Field label="Học phí trọn gói (VND)" htmlFor="service-price" required>
                  <Input
                    id="service-price"
                    type="number"
                    min="50000"
                    step="50000"
                    disabled={editingService?.status === 'Published'}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </Field>
              </div>

              {/* Teaching Mode */}
              <Field label="Hình thức giảng dạy" htmlFor="service-mode" required>
                <Select
                  id="service-mode"
                  value={formData.teachingMode}
                  disabled={editingService?.status === 'Published'}
                  onChange={(e) => setFormData({ ...formData, teachingMode: e.target.value })}
                >
                  {TEACHING_MODE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </Field>

              {/* Scope and Outcome */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Giáo trình / Phạm vi kiến thức" htmlFor="service-scope">
                  <Input
                    id="service-scope"
                    placeholder="Ví dụ: Giáo trình Cambridge, SGK mới..."
                    value={formData.learningScope}
                    onChange={(e) => setFormData({ ...formData, learningScope: e.target.value })}
                  />
                </Field>

                <Field label="Cam kết chuẩn đầu ra" htmlFor="service-outcome">
                  <Input
                    id="service-outcome"
                    placeholder="Ví dụ: Đạt từ 8.0 điểm thi học kỳ..."
                    value={formData.expectedOutcome}
                    onChange={(e) => setFormData({ ...formData, expectedOutcome: e.target.value })}
                  />
                </Field>
              </div>

              {/* Trial Lesson URL */}
              <Field label="Link video giới thiệu / bài học thử (tùy chọn)" htmlFor="service-trial">
                <Input
                  id="service-trial"
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={formData.trialLessonUrl}
                  onChange={(e) => setFormData({ ...formData, trialLessonUrl: e.target.value })}
                />
              </Field>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setShowModal(false)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={submitting}
                  icon={<Icon name="save" size="sm" />}
                >
                  {editingService ? 'Lưu thay đổi' : 'Tạo gói dịch vụ'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
