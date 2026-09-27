import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/cn';
import adminService from '@/services/admin.service';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/Dialog';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import LedgerStrip from '@/components/ledger/LedgerStrip';
import ApplicationTable from '@/components/admin/ApplicationTable';
import ApplicationReviewDrawer from '@/components/admin/ApplicationReviewDrawer';
import ApplicationGuidelinesModal from '@/components/admin/ApplicationGuidelinesModal';
import ApplicationDocumentModal from '@/components/admin/ApplicationDocumentModal';
import ApplicationRejectModal from '@/components/admin/ApplicationRejectModal';

const PAGE_SIZE = 7;
const SUBJECT_OPTIONS = [
  { value: 'Toán', label: 'Toán học' },
  { value: 'Tiếng Anh', label: 'Tiếng Anh' },
  { value: 'Vật lý', label: 'Vật lý' },
  { value: 'Hóa', label: 'Hóa học' },
  { value: 'Lập trình', label: 'Lập trình' },
  { value: 'Ngữ văn', label: 'Ngữ văn' },
  { value: 'Kinh tế', label: 'Kinh tế' },
];
const EDUCATION_OPTIONS = [
  { value: 'Bách Khoa', label: 'ĐH Bách Khoa' },
  { value: 'Sư phạm', label: 'ĐH Sư phạm' },
  { value: 'Ngoại thương', label: 'ĐH Ngoại thương' },
  { value: 'FPT', label: 'ĐH FPT' },
  { value: 'Khoa học Tự nhiên', label: 'ĐH KHTN' },
];
const DATE_OPTIONS = [
  { value: 'all', label: 'Tất cả ngày' },
  { value: 'today', label: 'Hôm nay' },
  { value: '7days', label: '7 ngày qua' },
  { value: '30days', label: '30 ngày qua' },
];
const STATUS_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ xét duyệt' },
  { key: 'approved', label: 'Đã phê duyệt' },
  { key: 'rejected', label: 'Đã từ chối' },
];
const FILTER_LABEL = 'flex items-center gap-1.5 text-xs text-fg-secondary';
const FILTER_SELECT =
  'h-10 px-3 pr-8 rounded-xl border border-border text-[13px] text-fg bg-surface focus:outline-none focus:ring-2 focus:ring-brand-primary-600 cursor-pointer';

/**
 * Bàn kiểm duyệt hồ sơ gia sư — Operational Ledger (SPEC §4.2).
 *
 * Trước đây file này là nguồn màu thô lớn nhất toàn repo (268 chỗ). Nay mọi
 * màu đi qua token, KPI dùng `LedgerStrip`, bảng dùng `StateBadge` domain
 * `application` và các khối lớn đã tách ra `components/admin/`.
 */
export default function AdminTutorApplications() {
  const toast = useToast();
  const confirm = useConfirm();

  // Data states
  const [dbApplicants, setDbApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);
  const [processing, setProcessing] = useState(false);

  // Selection & UI states
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [selectedCheckboxIds, setSelectedCheckboxIds] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [activeDrawerTab, setActiveDrawerTab] = useState('degrees'); // 'info' | 'degrees' | 'experience' | 'notes'

  // Filter states
  const [statusTab, setStatusTab] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [educationFilter, setEducationFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = PAGE_SIZE;

  // Interactive Verification Checklist (local state per applicant)
  const [verificationMap, setVerificationMap] = useState({});

  // Modals state
  const [previewDoc, setPreviewDoc] = useState(null);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [adminNotesMap, setAdminNotesMap] = useState({});

  // Load from backend
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const res = await adminService.getTutorApplications({ pageSize: 50 });
        const items = res?.items || [];
        if (isMounted) {
          setDbApplicants(items);
        }
      } catch (err) {
        console.warn('Could not load backend applications:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [reloadToken]);

  // Format DB applications loaded from API
  const allApplications = useMemo(() => {
    return dbApplicants.map((a, idx) => ({
      ...a,
      userFullName: a.userFullName || `Gia sư ${idx + 1}`,
      userEmail: a.userEmail || `tutor${idx}@tutorhub.vn`,
      userPhone: a.userPhone || '—',
      // Không sinh ảnh từ dịch vụ bên thứ ba: bản cũ đưa `a.userEmail` — tức email
      // thật của người đang xét duyệt — vào seed rồi gửi ra máy chủ bên ngoài.
      // `null` thì <Avatar> hiện chữ cái đầu.
      userAvatarUrl: a.userAvatarUrl || null,
      subject: a.subject || 'Toán học',
      subjectSub: a.subjectSub || (a.teachingMode === 'Both' ? 'Online & Trực tiếp' : a.teachingMode || 'Online'),
      education: a.education || a.university || 'Đại học Sư phạm',
      university: a.university || a.education || '',
      major: a.major || '',
      degreeLevel: a.degreeLevel || 'Cử nhân',
      certifications: a.certifications || '',
      experienceYears: a.experienceYears ?? 1,
      teachingMode: a.teachingMode || 'Online',
      address: a.address || 'Hà Nội',
      bio: a.bio || 'Chưa cập nhật phần giới thiệu.',
      methodology: a.methodology || 'Cá nhân hóa theo năng lực từng học sinh, rèn luyện bài tập thực hành theo chuyên đề.',
      achievements: a.achievements || 'Học sinh đạt kết quả tốt trong các kỳ thi kiểm tra định kỳ.',
      submittedAt: a.submittedAt || new Date().toISOString(),
      status: a.status || 'Pending',
      rejectionReason: a.rejectionReason,
      documents: Array.isArray(a.documents) && a.documents.length > 0 ? a.documents : [
        {
          id: `doc-${a.id}-1`,
          title: 'Văn bằng chứng chỉ chuyên môn',
          institution: a.university || a.education || 'Đại học Sư phạm',
          format: 'PDF • 2.1 MB',
          verified: a.status === 'Approved',
          previewUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
        },
      ],
    }));
  }, [dbApplicants]);

  // Keep first application selected when list loads
  useEffect(() => {
    if (!selectedAppId && allApplications.length > 0) {
      setSelectedAppId(allApplications[0].id);
    }
  }, [allApplications, selectedAppId]);

  // Status Counts (Only 3 real statuses: Pending, Approved, Rejected)
  const counts = useMemo(() => {
    return {
      all: allApplications.length,
      pending: allApplications.filter((a) => a.status === 'Pending').length,
      approved: allApplications.filter((a) => a.status === 'Approved').length,
      rejected: allApplications.filter((a) => a.status === 'Rejected').length,
    };
  }, [allApplications]);

  // Filtered List
  const filteredList = useMemo(() => {
    return allApplications.filter((app) => {
      // 1. Status Tab
      if (statusTab === 'pending' && app.status !== 'Pending') return false;
      if (statusTab === 'approved' && app.status !== 'Approved') return false;
      if (statusTab === 'rejected' && app.status !== 'Rejected') return false;

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (app.userFullName || '').toLowerCase().includes(q);
        const matchesEmail = (app.userEmail || '').toLowerCase().includes(q);
        const matchesPhone = (app.userPhone || '').includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone) return false;
      }

      // 3. Subject Filter
      if (subjectFilter !== 'all' && !app.subject.includes(subjectFilter)) {
        return false;
      }

      // 4. Education Filter
      if (educationFilter !== 'all' && !app.education.includes(educationFilter)) {
        return false;
      }

      return true;
    });
  }, [allApplications, statusTab, searchQuery, subjectFilter, educationFilter]);

  // Paginated List
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;

  // Selected Active Applicant
  const activeApplicant = useMemo(() => {
    return (
      allApplications.find((a) => a.id === selectedAppId) ||
      filteredList[0] ||
      allApplications[0] ||
      null
    );
  }, [allApplications, selectedAppId, filteredList]);

  const activeNotes = activeApplicant ? adminNotesMap[activeApplicant.id] || [] : [];

  // Handle row selection
  const handleSelectRow = (app) => {
    setSelectedAppId(app.id);
    setDrawerOpen(true);
    if (!selectedCheckboxIds.includes(app.id)) {
      setSelectedCheckboxIds([app.id]);
    }
  };

  const toggleCheckbox = (id, e) => {
    e.stopPropagation();
    setSelectedCheckboxIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCheckboxIds.length === paginatedList.length) {
      setSelectedCheckboxIds([]);
    } else {
      setSelectedCheckboxIds(paginatedList.map((x) => x.id));
    }
  };

  // Toggle Verification Checkboxes
  const toggleVerification = (field) => {
    if (!activeApplicant) return;
    setVerificationMap((prev) => {
      const current = prev[activeApplicant.id] || {
        personal: true,
        degrees: true,
        experience: true,
        methodology: true,
      };
      return {
        ...prev,
        [activeApplicant.id]: {
          ...current,
          [field]: !current[field],
        },
      };
    });
  };

  const currentChecks = verificationMap[activeApplicant?.id] || {
    personal: true,
    degrees: true,
    experience: true,
    methodology: true,
  };

  // Approve action
  const handleApprove = async () => {
    if (!activeApplicant) return;
    const ok = await confirm({
      title: `Phê duyệt hồ sơ: ${activeApplicant.userFullName}`,
      content: `Gia sư sẽ được cấp huy hiệu Verified Tutor và mở quyền niêm yết các khóa học trên sàn TutorHub.`,
      confirmText: 'Xác nhận phê duyệt',
      cancelText: 'Hủy',
    });
    if (!ok) return;

    try {
      setProcessing(true);
      await adminService.approveTutorApplication(activeApplicant.id);
      toast.success(`Đã phê duyệt thành công hồ sơ của ${activeApplicant.userFullName}!`);
      setReloadToken((t) => t + 1);
    } catch (err) {
      toast.error(err?.message || 'Không thể phê duyệt hồ sơ.');
    } finally {
      setProcessing(false);
    }
  };

  // Reject action
  const openRejectModal = () => {
    setRejectReasonInput(
      activeApplicant?.rejectionReason ||
        'Hồ sơ chưa đạt yêu cầu minh chứng văn bằng hoặc KYC. Vui lòng bổ sung đầy đủ ảnh chụp bằng đại học rõ nét.'
    );
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!activeApplicant) return;
    if (!rejectReasonInput.trim()) {
      toast.error('Vui lòng nhập lý do từ chối hồ sơ.');
      return;
    }

    try {
      setProcessing(true);
      const reason = rejectReasonInput.trim();
      await adminService.rejectTutorApplication(activeApplicant.id, reason);
      toast.info(`Đã từ chối hồ sơ của ${activeApplicant.userFullName}.`);
      setShowRejectModal(false);
      setReloadToken((t) => t + 1);
    } catch (err) {
      toast.error(err?.message || 'Không thể từ chối hồ sơ.');
    } finally {
      setProcessing(false);
    }
  };

  // Add Admin Note
  const handleAddNote = () => {
    if (!adminNoteInput.trim() || !activeApplicant) return;
    const notes = adminNotesMap[activeApplicant.id] || [];
    setAdminNotesMap((prev) => ({
      ...prev,
      [activeApplicant.id]: [
        ...notes,
        {
          id: Date.now(),
          text: adminNoteInput.trim(),
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    }));
    setAdminNoteInput('');
    toast.success('Đã lưu ghi chú nội bộ!');
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & BREADCRUMB */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-[12.5px] text-fg-muted mb-1.5"
          >
            <span>Admin</span>
            <span>›</span>
            <span className="text-fg-secondary font-medium">Hồ sơ gia sư</span>
          </nav>
          <h1 className="text-[24px] sm:text-[28px] font-extrabold text-fg tracking-tight">
            Bàn kiểm duyệt hồ sơ gia sư
          </h1>
          <p className="text-[13.5px] text-fg-secondary mt-0.5 max-w-2xl leading-relaxed">
            Xem xét, xác minh thông tin và bằng cấp của ứng viên trước khi phê duyệt trở thành gia sư trên TutorHub.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => setShowGuidelines(true)}
          icon={<Icon name="info" size="sm" />}
          className="self-start sm:self-auto shrink-0"
        >
          Hướng dẫn xét duyệt
        </Button>
      </div>

      {/* 2. 4 STAT METRIC CARDS — hàng số liệu phẳng của Operational Ledger */}
      <LedgerStrip
        columns={4}
        figures={[
          {
            key: 'all',
            label: 'Tổng hồ sơ',
            value: counts.all,
            hint: 'Tất cả đơn đăng ký gia sư',
          },
          {
            key: 'pending',
            label: 'Chờ xét duyệt',
            value: counts.pending,
            hint:
              counts.pending > 0
                ? 'Cần xử lý · Hạn thẩm định 1-3 ngày'
                : 'Hạn thẩm định 1-3 ngày',
            tone: counts.pending > 0 ? 'holding' : 'default',
          },
          {
            key: 'approved',
            label: 'Đã phê duyệt',
            value: counts.approved,
            hint: 'Đã cấp Verified Badge',
          },
          {
            key: 'rejected',
            label: 'Đã từ chối',
            value: counts.rejected,
            hint: 'Có lý do gửi kèm cho ứng viên',
          },
        ]}
      />

      {/* 3. STATUS TABS */}
      <div className="border-b border-border">
        <nav className="flex items-center gap-6 overflow-x-auto" aria-label="Lọc trạng thái hồ sơ">
          {STATUS_TABS.map((tab) => {
            const isActive = statusTab === tab.key;
            const badgeLabel = `${tab.label} (${counts[tab.key]})`;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatusTab(tab.key);
                  setCurrentPage(1);
                }}
                className={cn(
                  'pb-3 text-[14px] font-bold transition-all relative whitespace-nowrap cursor-pointer',
                  isActive ? 'text-brand-primary-600' : 'text-fg-secondary hover:text-fg'
                )}
              >
                {badgeLabel}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-brand-primary-600 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 4. SEARCH & FILTER TOOLBAR */}
      <div className="bg-surface p-3.5 sm:p-4 rounded-2xl border border-border shadow-brand-sm flex flex-wrap items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none">
            <Icon name="search" size="sm" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
            aria-label="Tìm kiếm hồ sơ gia sư"
            className="w-full h-10 pl-10 pr-3 rounded-xl border border-border text-[13.5px] text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-brand-primary-600 transition-all"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Chuyên môn */}
          <div className={FILTER_LABEL}>
            <span className="hidden xl:inline">Chuyên môn:</span>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              aria-label="Lọc theo chuyên môn"
              className={FILTER_SELECT}
            >
              <option value="all">Tất cả chuyên môn</option>
              {SUBJECT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Trình độ học vấn */}
          <div className={FILTER_LABEL}>
            <span className="hidden xl:inline">Trình độ:</span>
            <select
              value={educationFilter}
              onChange={(e) => setEducationFilter(e.target.value)}
              aria-label="Lọc theo trình độ học vấn"
              className={FILTER_SELECT}
            >
              <option value="all">Tất cả trình độ</option>
              {EDUCATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Ngày nộp hồ sơ */}
          <div className={FILTER_LABEL}>
            <span className="hidden xl:inline">Ngày nộp:</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Lọc theo ngày nộp hồ sơ"
              className={FILTER_SELECT}
            >
              {DATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSubjectFilter('all');
              setEducationFilter('all');
              setDateFilter('all');
            }}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-border bg-neutral-50 hover:bg-neutral-100 text-fg-secondary text-[13px] font-medium transition-colors cursor-pointer"
          >
            <Icon name="tune" size="sm" />
            Bộ lọc
          </button>
        </div>
      </div>

      {/* 5. MASTER-DETAIL SPLIT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Master Table */}
        <div className={cn('transition-all', drawerOpen ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12')}>
          <ApplicationTable
            rows={paginatedList}
            loading={loading}
            selectedId={activeApplicant?.id}
            checkedIds={selectedCheckboxIds}
            totalFiltered={filteredList.length}
            currentPage={currentPage}
            totalPages={totalPages}
            onToggleRow={handleSelectRow}
            onToggleCheckbox={toggleCheckbox}
            onToggleSelectAll={toggleSelectAll}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* RIGHT COLUMN: Review Panel / Drawer */}
        {drawerOpen && activeApplicant && (
          <ApplicationReviewDrawer
            applicant={activeApplicant}
            activeTab={activeDrawerTab}
            onTabChange={setActiveDrawerTab}
            notes={activeNotes}
            noteInput={adminNoteInput}
            onNoteInputChange={setAdminNoteInput}
            onAddNote={handleAddNote}
            checks={currentChecks}
            onToggleCheck={toggleVerification}
            onPreviewDoc={setPreviewDoc}
            onClose={() => setDrawerOpen(false)}
            processing={processing}
            onApprove={handleApprove}
            onReject={openRejectModal}
          />
        )}
      </div>

      {/* MODAL 1: DOCUMENT PREVIEW MODAL */}
      <ApplicationDocumentModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />

      {/* MODAL 2: GUIDELINES MODAL (Hướng dẫn xét duyệt) */}
      <ApplicationGuidelinesModal open={showGuidelines} onClose={() => setShowGuidelines(false)} />

      {/* MODAL 3: REJECT MODAL (Từ chối hồ sơ kèm lý do) */}
      <ApplicationRejectModal
        open={showRejectModal}
        applicantName={activeApplicant?.userFullName}
        reason={rejectReasonInput}
        onReasonChange={setRejectReasonInput}
        processing={processing}
        onSubmit={handleConfirmReject}
        onClose={() => setShowRejectModal(false)}
      />
    </div>
  );
}
