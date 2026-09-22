import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/cn';
import adminService from '@/services/admin.service';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/Dialog';
import { formatDateTime } from '@/utils/formatters';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';

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
  const pageSize = 7;

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
      userAvatarUrl: a.userAvatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${a.userEmail || idx}`,
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
  }, [filteredList, currentPage]);

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

  // Render Status Badge Pill
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Đã phê duyệt
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-blue-50 text-[#2563EB] border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            Chờ xét duyệt
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Đã từ chối
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & BREADCRUMB */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12.5px] text-slate-400 mb-1.5">
            <span>Admin</span>
            <span>›</span>
            <span className="text-slate-600 font-medium">Hồ sơ gia sư</span>
          </nav>
          <h1 className="text-[24px] sm:text-[28px] font-extrabold text-slate-900 tracking-tight">
            Bàn kiểm duyệt hồ sơ gia sư
          </h1>
          <p className="text-[13.5px] text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
            Xem xét, xác minh thông tin và bằng cấp của ứng viên trước khi phê duyệt trở thành gia sư trên TutorHub.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowGuidelines(true)}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-xl border border-blue-200 bg-white hover:bg-blue-50/60 text-[#2563EB] text-[13.5px] font-semibold shadow-2xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Icon name="info" size="sm" />
          Hướng dẫn xét duyệt
        </button>
      </div>

      {/* 2. 4 STAT METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Tổng hồ sơ */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-500">Tổng hồ sơ</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <Icon name="mail" size="sm" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[26px] font-extrabold text-slate-900 leading-none">{counts.all}</span>
          </div>
          <span className="text-[11px] text-slate-400 block">Tất cả đơn đăng ký gia sư</span>
        </div>

        {/* Card 2: Chờ xét duyệt */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-500">Chờ xét duyệt</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Icon name="schedule" size="sm" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[26px] font-extrabold text-slate-900 leading-none">{counts.pending}</span>
            {counts.pending > 0 && (
              <span className="inline-flex items-center text-[10.5px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
                Cần xử lý
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 block">Hạn thẩm định 1-3 ngày</span>
        </div>

        {/* Card 3: Đã phê duyệt */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-500">Đã phê duyệt</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Icon name="check_circle" size="sm" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[26px] font-extrabold text-slate-900 leading-none">{counts.approved}</span>
          </div>
          <span className="text-[11px] text-slate-400 block">Đã cấp Verified Badge</span>
        </div>

        {/* Card 4: Đã từ chối */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-500">Đã từ chối</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Icon name="close" size="sm" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[26px] font-extrabold text-slate-900 leading-none">{counts.rejected}</span>
          </div>
          <span className="text-[11px] text-slate-400 block">Có lý do gửi kèm cho ứng viên</span>
        </div>
      </div>

      {/* 3. STATUS TABS */}
      <div className="border-b border-slate-200">
        <nav className="flex items-center gap-6 overflow-x-auto" aria-label="Lọc trạng thái hồ sơ">
          {[
            { key: 'all', label: `Tất cả (${counts.all})` },
            { key: 'pending', label: `Chờ xét duyệt (${counts.pending})` },
            { key: 'approved', label: `Đã phê duyệt (${counts.approved})` },
            { key: 'rejected', label: `Đã từ chối (${counts.rejected})` },
          ].map((tab) => {
            const isActive = statusTab === tab.key;
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
                  isActive
                    ? 'text-[#2563EB]'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#2563EB] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>


      {/* 4. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
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
            className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Chuyên môn */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="hidden xl:inline">Chuyên môn:</span>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="h-10 px-3 pr-8 rounded-xl border border-slate-200 text-[13px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer"
            >
              <option value="all">Tất cả chuyên môn</option>
              <option value="Toán">Toán học</option>
              <option value="Tiếng Anh">Tiếng Anh</option>
              <option value="Vật lý">Vật lý</option>
              <option value="Hóa">Hóa học</option>
              <option value="Lập trình">Lập trình</option>
              <option value="Ngữ văn">Ngữ văn</option>
              <option value="Kinh tế">Kinh tế</option>
            </select>
          </div>

          {/* Trình độ học vấn */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="hidden xl:inline">Trình độ:</span>
            <select
              value={educationFilter}
              onChange={(e) => setEducationFilter(e.target.value)}
              className="h-10 px-3 pr-8 rounded-xl border border-slate-200 text-[13px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer"
            >
              <option value="all">Tất cả trình độ</option>
              <option value="Bách Khoa">ĐH Bách Khoa</option>
              <option value="Sư phạm">ĐH Sư phạm</option>
              <option value="Ngoại thương">ĐH Ngoại thương</option>
              <option value="FPT">ĐH FPT</option>
              <option value="Khoa học Tự nhiên">ĐH KHTN</option>
            </select>
          </div>

          {/* Ngày nộp hồ sơ */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="hidden xl:inline">Ngày nộp:</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-10 px-3 pr-8 rounded-xl border border-slate-200 text-[13px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer"
            >
              <option value="all">Tất cả ngày</option>
              <option value="today">Hôm nay</option>
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
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
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[13px] font-medium transition-colors cursor-pointer"
          >
            <Icon name="tune" size="sm" />
            Bộ lọc
          </button>
        </div>
      </div>

      {/* 5. MASTER-DETAIL SPLIT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =========================================================================
            LEFT COLUMN: Master Table (Takes 7 or 12 cols depending on drawer state)
           ========================================================================= */}
        <div className={cn('transition-all', drawerOpen ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12')}>
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold text-[12px]">
                    <th className="py-3 px-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          paginatedList.length > 0 &&
                          selectedCheckboxIds.length === paginatedList.length
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 text-[#2563EB] accent-[#2563EB] cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-3.5">Ứng viên</th>
                    <th className="py-3 px-3.5">Chuyên môn</th>
                    <th className="py-3 px-3.5">Trình độ học vấn</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Ngày nộp</th>
                    <th className="py-3 px-3.5 text-center">Trạng thái</th>
                    <th className="py-3 px-3.5 text-center w-24">Thao tác</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-14 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2.5">
                          <span className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs font-medium text-slate-500">Đang tải danh sách hồ sơ gia sư từ hệ thống...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Icon name="search" size="lg" className="mx-auto mb-2 text-slate-300" />
                        Không tìm thấy hồ sơ gia sư nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    paginatedList.map((app) => {
                      const isSelected = activeApplicant?.id === app.id;
                      const isChecked = selectedCheckboxIds.includes(app.id);

                      return (
                        <tr
                          key={app.id}
                          onClick={() => handleSelectRow(app)}
                          className={cn(
                            'transition-colors cursor-pointer group',
                            isSelected
                              ? 'bg-blue-50/60 hover:bg-blue-50/80'
                              : 'hover:bg-slate-50/80'
                          )}
                        >
                          {/* Checkbox */}
                          <td className="py-3.5 px-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => toggleCheckbox(app.id, e)}
                              className="w-4 h-4 rounded border-slate-300 text-[#2563EB] accent-[#2563EB] cursor-pointer"
                            />
                          </td>

                          {/* Candidate info */}
                          <td className="py-3.5 px-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={app.userAvatarUrl}
                                name={app.userFullName}
                                size="md"
                                className="w-10 h-10 shrink-0 border border-slate-200"
                              />
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block truncate leading-snug">
                                  {app.userFullName}
                                </span>
                                <span className="text-[12px] text-slate-400 block truncate">
                                  {app.userEmail}
                                </span>
                                <span className="text-[11.5px] text-slate-400 block truncate">
                                  {app.userPhone}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Subject & Sub-specialization */}
                          <td className="py-3.5 px-3.5">
                            <span className="font-semibold text-slate-800 block leading-tight">
                              {app.subject}
                            </span>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                              {app.subjectSub}
                            </span>
                          </td>

                          {/* Education */}
                          <td className="py-3.5 px-3.5 text-slate-700">
                            <span className="font-medium block leading-snug">{app.education}</span>
                          </td>

                          {/* Submitted date */}
                          <td className="py-3.5 px-3.5 text-slate-500 whitespace-nowrap font-mono text-[12px]">
                            {app.submittedAt ? formatDateTime(app.submittedAt, 'DD/MM/YYYY HH:mm') : '—'}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                            {renderStatusBadge(app.status)}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-3.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSelectRow(app)}
                                className="px-2.5 py-1 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 text-[#2563EB] font-semibold text-[12px] transition-colors cursor-pointer"
                              >
                                Xem
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSelectRow(app)}
                                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                                title="Thao tác nhanh"
                              >
                                <Icon name="more_vert" size="sm" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination bar */}
            <div className="p-3.5 sm:p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-slate-500">
              <span>
                Hiển thị 1 - {paginatedList.length} trong {filteredList.length} hồ sơ
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                >
                  <Icon name="chevron_left" size="xs" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setCurrentPage(pg)}
                    className={cn(
                      'w-8 h-8 rounded-lg font-semibold text-xs transition-colors cursor-pointer',
                      currentPage === pg
                        ? 'bg-[#2563EB] text-white shadow-2xs'
                        : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                    )}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                >
                  <Icon name="chevron_right" size="xs" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: Review Panel / Drawer (Takes 5 or 4 cols)
           ========================================================================= */}
        {drawerOpen && activeApplicant && (
          <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-5 sticky top-20">
            {/* Drawer Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <Avatar
                  src={activeApplicant.userAvatarUrl}
                  name={activeApplicant.userFullName}
                  size="lg"
                  className="w-14 h-14 rounded-full object-cover border-2 border-slate-100 shadow-sm shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-[16px] text-slate-900 truncate">
                      {activeApplicant.userFullName}
                    </h3>
                  </div>
                  <div className="mt-0.5">{renderStatusBadge(activeApplicant.status)}</div>
                  <div className="text-[12px] text-slate-500 space-y-0.5 mt-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <Icon name="mail" size="xs" className="text-slate-400 shrink-0" />
                      <span className="truncate">{activeApplicant.userEmail}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Icon name="call" size="xs" className="text-slate-400 shrink-0" />
                      <span>{activeApplicant.userPhone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Drawer Button */}
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Đóng bảng chi tiết"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>

            {/* Drawer Tabs: Thông tin · Bằng cấp (3) · Kinh nghiệm (2) · Ghi chú (0) */}
            <div className="border-b border-slate-100">
              <nav className="flex items-center justify-between text-[13px] font-semibold text-slate-500">
                {[
                  { key: 'info', label: 'Thông tin' },
                  {
                    key: 'degrees',
                    label: `Bằng cấp (${activeApplicant.documents?.length || 1})`,
                  },
                  {
                    key: 'experience',
                    label: `Kinh nghiệm (${activeApplicant.experienceYears}n)`,
                  },
                  {
                    key: 'notes',
                    label: `Ghi chú (${(adminNotesMap[activeApplicant.id] || []).length})`,
                  },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActiveDrawerTab(t.key)}
                    className={cn(
                      'pb-2.5 transition-all relative cursor-pointer',
                      activeDrawerTab === t.key
                        ? 'text-[#2563EB] font-bold'
                        : 'hover:text-slate-800'
                    )}
                  >
                    {t.label}
                    {activeDrawerTab === t.key && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2563EB] rounded-full" />
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* TAB CONTENT: BẰNG CẤP & CHỨNG CHỈ */}
            {activeDrawerTab === 'degrees' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[13.5px] text-slate-900">Bằng cấp & chứng chỉ</h4>
                  <span className="text-[11px] text-slate-400">
                    {activeApplicant.documents?.length || 1} tài liệu đính kèm
                  </span>
                </div>

                {/* Documents List */}
                <div className="space-y-2.5">
                  {(activeApplicant.documents || []).map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-200 transition-colors flex items-center justify-between gap-3 shadow-2xs group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Certificate Thumbnail */}
                        <img
                          src={doc.previewUrl}
                          alt={doc.title}
                          className="w-12 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-[13px] text-slate-800 block truncate">
                            {doc.title}
                          </span>
                          <span className="text-[11.5px] text-slate-500 block truncate">
                            {doc.institution}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-400 font-mono">{doc.format}</span>
                            {doc.verified ? (
                              <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-600">
                                <Icon name="check" size="xs" /> Hợp lệ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-600">
                                ⊙ Chờ xác minh
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="w-8 h-8 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-[#2563EB] flex items-center justify-center transition-colors cursor-pointer"
                          title="Xem trước văn bằng"
                        >
                          <Icon name="visibility" size="sm" />
                        </button>
                        <a
                          href={doc.previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                          title="Tải tệp"
                        >
                          <Icon name="download" size="sm" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Kết quả xác minh (Checklist) */}
                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <h4 className="font-bold text-[13.5px] text-slate-900">Kết quả xác minh</h4>
                  <div className="space-y-2">
                    {[
                      { key: 'personal', label: 'Thông tin cá nhân & liên hệ hợp lệ' },
                      { key: 'degrees', label: 'Văn bằng & chứng chỉ chuyên môn phù hợp' },
                      { key: 'experience', label: 'Kinh nghiệm giảng dạy đạt chuẩn' },
                      { key: 'methodology', label: 'Phương pháp & lộ trình giảng dạy rõ ràng' },
                    ].map((c) => {
                      const checked = currentChecks[c.key];
                      return (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => toggleVerification(c.key)}
                          className="w-full flex items-center gap-2.5 text-left text-[12.5px] text-slate-700 font-medium cursor-pointer group"
                        >
                          <span
                            className={cn(
                              'w-4 h-4 rounded-full border flex items-center justify-center transition-all',
                              checked
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-300 bg-white group-hover:border-slate-400'
                            )}
                          >
                            {checked && <Icon name="check" size="xs" />}
                          </span>
                          <span className={cn(checked ? 'text-slate-800' : 'text-slate-500')}>
                            {c.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: THÔNG TIN */}
            {activeDrawerTab === 'info' && (
              <div className="space-y-4 text-[13px]">
                <div className="space-y-1">
                  <span className="font-bold text-slate-700 block">Giới thiệu bản thân</span>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-line text-[12.5px]">
                    {activeApplicant.bio}
                  </p>
                </div>

                {/* Trình độ học vấn & Trường đại học */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11.5px] text-slate-400 block">Trường đào tạo</span>
                    <span className="font-bold text-slate-800 block mt-0.5 truncate" title={activeApplicant.university || activeApplicant.education}>
                      {activeApplicant.university || activeApplicant.education}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11.5px] text-slate-400 block">Học vị</span>
                    <span className="font-bold text-slate-800 block mt-0.5">
                      {activeApplicant.degreeLevel || 'Cử nhân'}
                    </span>
                  </div>
                </div>

                {activeApplicant.major && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11.5px] text-slate-400 block">Chuyên ngành</span>
                    <span className="font-bold text-slate-800 block mt-0.5">
                      {activeApplicant.major}
                    </span>
                  </div>
                )}

                {activeApplicant.certifications && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11.5px] text-slate-400 block">Chứng chỉ</span>
                    <span className="font-bold text-[#2563EB] block mt-0.5">
                      {activeApplicant.certifications}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11.5px] text-slate-400 block">Hình thức dạy</span>
                    <span className="font-bold text-slate-800 block mt-0.5">
                      {activeApplicant.teachingMode === 'Both'
                        ? 'Online & Offline'
                        : activeApplicant.teachingMode}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11.5px] text-slate-400 block">Kinh nghiệm</span>
                    <span className="font-bold text-slate-800 block mt-0.5">
                      {activeApplicant.experienceYears} năm
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-slate-700 block">Địa chỉ nhận dạy</span>
                  <p className="text-slate-600 text-[12.5px]">{activeApplicant.address}</p>
                </div>
              </div>
            )}

            {/* TAB CONTENT: KINH NGHIỆM */}
            {activeDrawerTab === 'experience' && (
              <div className="space-y-4 text-[13px]">
                <div className="space-y-1">
                  <span className="font-bold text-slate-700 block">Phương pháp giảng dạy</span>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed text-[12.5px]">
                    {activeApplicant.methodology}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-slate-700 block">Thành tích nổi bật</span>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed text-[12.5px]">
                    {activeApplicant.achievements}
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT: GHI CHÚ */}
            {activeDrawerTab === 'notes' && (
              <div className="space-y-3 text-[13px]">
                <div className="space-y-2">
                  <span className="font-bold text-slate-700 block">Ghi chú nội bộ Admin</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={adminNoteInput}
                      onChange={(e) => setAdminNoteInput(e.target.value)}
                      placeholder="Thêm ghi chú đánh giá..."
                      className="flex-1 h-9 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddNote}
                      className="px-3 h-9 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-blue-700 cursor-pointer"
                    >
                      Lưu
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {(adminNotesMap[activeApplicant.id] || []).length === 0 ? (
                    <span className="text-xs text-slate-400 italic block py-4 text-center">
                      Chưa có ghi chú nào cho ứng viên này.
                    </span>
                  ) : (
                    (adminNotesMap[activeApplicant.id] || []).map((n) => (
                      <div key={n.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex justify-between">
                        <span className="text-slate-700">{n.text}</span>
                        <span className="text-slate-400 font-mono">{n.time}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* DECISION ACTION BUTTONS (BOTTOM) */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={openRejectModal}
                disabled={processing}
                className="inline-flex items-center justify-center gap-1.5 h-11 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 font-semibold text-[13.5px] transition-colors cursor-pointer"
              >
                <Icon name="close" size="sm" />
                Từ chối
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={processing}
                className="inline-flex items-center justify-center gap-1.5 h-11 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[13.5px] shadow-sm transition-all cursor-pointer"
              >
                {processing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang duyệt...
                  </>
                ) : (
                  <>
                    <Icon name="check" size="sm" />
                    Phê duyệt
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL 1: DOCUMENT PREVIEW MODAL
         ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-brand-xl max-w-2xl w-full overflow-hidden animate-fadeIn space-y-4 p-5 sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-[16px] text-slate-900">{previewDoc.title}</h3>
                <span className="text-xs text-slate-500 font-medium">{previewDoc.institution}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center max-h-[460px]">
              <img src={previewDoc.previewUrl} alt={previewDoc.title} className="w-full h-auto object-contain max-h-[460px]" />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-mono text-slate-400">{previewDoc.format}</span>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  <Icon name="download" size="xs" />
                  Tải về
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 h-9 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: GUIDELINES MODAL (Hướng dẫn xét duyệt)
         ========================================================================= */}
      {showGuidelines && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-brand-xl max-w-xl w-full p-6 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
                  <Icon name="info" size="md" />
                </div>
                <h3 className="font-extrabold text-[16px] text-slate-900">Quy chuẩn xét duyệt hồ sơ gia sư</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuidelines(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-[#2563EB] font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                <p><strong>Xác minh văn bằng & học vị:</strong> Đối chiếu bằng tốt nghiệp, bảng điểm và chứng chỉ sư phạm, bảo đảm có dấu mộc của trường đại học hoặc cơ quan cấp phép uy tín.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-[#2563EB] font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                <p><strong>Kiểm tra danh tính KYC & liên lạc:</strong> Xác minh số điện thoại, email và khu vực nhận dạy trực tiếp có trùng khớp với hồ sơ đăng ký.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-[#2563EB] font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                <p><strong>Thẩm định phương pháp sư phạm:</strong> Đảm bảo gia sư có phong cách giảng dạy rõ ràng, giáo trình minh bạch và cam kết chất lượng đầu ra cho học viên.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-[#2563EB] font-bold text-[11px] flex items-center justify-center shrink-0">4</span>
                <p><strong>Thời hạn SLA cam kết:</strong> Phê duyệt hoặc từ chối có lý do trong vòng tối đa 1–3 ngày làm việc kể từ thời điểm nhận hồ sơ.</p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowGuidelines(false)}
                className="px-5 h-10 rounded-xl bg-[#2563EB] text-white font-semibold text-xs hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Đã hiểu quy chuẩn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: REJECT MODAL (Từ chối hồ sơ kèm lý do)
         ========================================================================= */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-brand-xl max-w-lg w-full p-6 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-[16px]">
                <Icon name="error" size="md" />
                Từ chối hồ sơ gia sư
              </div>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Nhập lý do từ chối để hệ thống gửi thông báo chi tiết đến email của ứng viên{' '}
              <strong>{activeApplicant?.userFullName}</strong>:
            </p>

            <textarea
              rows={4}
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              placeholder="Nhập lý do từ chối chi tiết..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all resize-none"
            />

            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                Gợi ý lý do nhanh:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Thiếu bằng cấp minh chứng',
                  'Ảnh chụp bằng cấp mờ, không rõ dấu mộc',
                  'Chưa có chứng chỉ nghiệp vụ sư phạm',
                  'Thông tin kinh nghiệm giảng dạy chưa đầy đủ',
                ].map((txt) => (
                  <button
                    key={txt}
                    type="button"
                    onClick={() => setRejectReasonInput(txt)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11.5px] text-slate-600 cursor-pointer"
                  >
                    {txt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 h-10 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={processing}
                className="px-5 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
