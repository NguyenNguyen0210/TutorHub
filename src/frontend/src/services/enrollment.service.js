/**
 * Enrollment Service — /api/v1/enrollments
 *
 * Contract (EnrollmentsController):
 * - GET  /enrollments        → PagedResult<EnrollmentSummaryDto> (đọc `items`)
 * - GET  /enrollments/{id}   → EnrollmentDto (kèm `sessions`)
 * - POST /enrollments/{id}/cancel body { reason } → EnrollmentDto
 *
 * Mock: chỉ khi VITE_USE_MOCK === 'true'; lỗi khác được ném lại (ApiError).
 */
import { api } from './api';
import { USE_MOCK } from '@/config/constants';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizePaged(raw) {
  const items = Array.isArray(raw?.items) ? raw.items : [];
  return {
    items,
    totalCount: toNumber(raw?.totalCount, items.length),
    pageNumber: toNumber(raw?.pageNumber, 1),
    pageSize: toNumber(raw?.pageSize, items.length),
    totalPages: toNumber(raw?.totalPages, items.length > 0 ? 1 : 0),
    hasPreviousPage: Boolean(raw?.hasPreviousPage),
    hasNextPage: Boolean(raw?.hasNextPage),
  };
}

export const enrollmentService = {
  /**
   * GET /enrollments → PagedResult<EnrollmentSummaryDto>
   * @returns {Promise<{items: object[], totalCount: number, pageNumber: number, pageSize: number, totalPages: number, hasPreviousPage: boolean, hasNextPage: boolean}>}
   */
  async getMyEnrollments({ status = null, pageNumber = 1, pageSize = 10 } = {}) {
    try {
      const params = { pageNumber, pageSize };
      if (status) params.status = status;
      const res = await api.get('/enrollments', { params });
      return normalizePaged(res);
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn('[enrollmentService] /enrollments lỗi, dùng mock (VITE_USE_MOCK=true).', err.message);
      const items = getMockEnrollments();
      return normalizePaged({ items, totalCount: items.length, pageNumber, pageSize });
    }
  },

  /** GET /enrollments/{id} → EnrollmentDto (kèm danh sách `sessions`) */
  async getEnrollmentById(id) {
    try {
      const res = await api.get(`/enrollments/${id}`);
      return res;
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn(`[enrollmentService] /enrollments/${id} lỗi, dùng mock (VITE_USE_MOCK=true).`, err.message);
      return getMockEnrollmentDetail(id);
    }
  },

  /** POST /enrollments/{id}/cancel body { reason } → EnrollmentDto */
  async cancelEnrollment(id, reason = 'Học viên yêu cầu dừng khóa học') {
    try {
      const res = await api.post(`/enrollments/${id}/cancel`, { reason });
      return res;
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn(`[enrollmentService] cancel /enrollments/${id} lỗi, dùng mock (VITE_USE_MOCK=true).`, err.message);
      return getMockEnrollmentDetail(id);
    }
  },
};

// MOCK DATA GENERATOR
function getMockEnrollments() {
  return [
    {
      id: 'e1e1e1e1-0001-0000-0000-000000000001',
      contractCode: 'CTR-2026-THB-001',
      serviceTitle: 'Luyện thi THPT Toán 10 buổi Thực Chiến',
      tutorName: 'ThS. Nguyễn Văn An',
      tutorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=an',
      tutorEducation: 'Thủ khoa Sư phạm Toán - ĐH Sư phạm Hà Nội',
      totalSessions: 10,
      completedSessions: 2,
      price: 2000000,
      escrowHoldingAmount: 1600000,
      status: 'Active',
      startDate: '2026-09-08',
      teachingMode: 'Both',
    },
  ];
}

function getMockEnrollmentDetail(id) {
  return {
    id: id || 'e1e1e1e1-0001-0000-0000-000000000001',
    contractCode: 'CTR-2026-THB-001',
    serviceTitle: 'Luyện thi THPT Toán 10 buổi Thực Chiến',
    tutorName: 'ThS. Nguyễn Văn An',
    tutorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=an',
    tutorEducation: 'Thủ khoa Sư phạm Toán - ĐH Sư phạm Hà Nội',
    tutorPhone: '0912345678',
    totalSessions: 10,
    completedSessions: 2,
    price: 2000000,
    perSessionPrice: 200000,
    escrowHoldingAmount: 1600000,
    disbursedAmount: 400000,
    platformFeeRate: 0.10,
    feePolicyVersion: 1,
    status: 'Active',
    createdAt: '2026-09-08T09:00:00Z',
    teachingMode: 'Both',
    sessions: [
      {
        id: 's1s1s1s1-0001-0000-0000-000000000001',
        sessionNumber: 1,
        title: 'Buổi 1: Khảo sát sự biến thiên và cực trị hàm số',
        startAt: '2026-09-10T18:00:00Z',
        endAt: '2026-09-10T19:00:00Z',
        status: 'Completed',
        escrowPayoutStatus: 'Disbursed',
        payoutAmount: 200000,
        meetUrl: 'https://meet.google.com/tutorhub-s1-math',
        studentAttended: true,
        tutorAttended: true,
        learningRecord: 'Học sinh nắm vững cách lập bảng biến thiên và tìm tiệm cận đứng/tiệm cận ngang.',
      },
      {
        id: 's2s2s2s2-0001-0000-0000-000000000002',
        sessionNumber: 2,
        title: 'Buổi 2: Phương trình tiếp tuyến và đồ thị hàm phân thức',
        startAt: '2026-09-12T18:00:00Z',
        endAt: '2026-09-12T19:00:00Z',
        status: 'Completed',
        escrowPayoutStatus: 'Disbursed',
        payoutAmount: 200000,
        meetUrl: 'https://meet.google.com/tutorhub-s2-math',
        studentAttended: true,
        tutorAttended: true,
        learningRecord: 'Giải quyết tốt các bài toán tiếp tuyến đi qua điểm cho trước. Đã làm bài tập kiểm tra 15p.',
      },
      {
        id: 's3s3s3s3-0001-0000-0000-000000000003',
        sessionNumber: 3,
        title: 'Buổi 3: Giá trị lớn nhất & nhỏ nhất trên đoạn (Thực chiến Casio)',
        startAt: '2026-09-14T18:00:00Z',
        endAt: '2026-09-14T19:00:00Z',
        status: 'Scheduled',
        escrowPayoutStatus: 'Holding',
        payoutAmount: 200000,
        meetUrl: 'https://meet.google.com/tutorhub-s3-math',
        studentAttended: null,
        tutorAttended: null,
        attendanceVerificationDueAt: '2026-09-15T19:00:00Z',
        learningRecord: null,
      },
      {
        id: 's4s4s4s4-0001-0000-0000-000000000004',
        sessionNumber: 4,
        title: 'Buổi 4: Hình học không gian Oxyz - Tọa độ điểm & Vectơ',
        startAt: null,
        endAt: null,
        status: 'Unscheduled',
        escrowPayoutStatus: 'Holding',
        payoutAmount: 200000,
        meetUrl: null,
        studentAttended: null,
        tutorAttended: null,
      },
      {
        id: 's5s5s5s5-0001-0000-0000-000000000005',
        sessionNumber: 5,
        title: 'Buổi 5: Phương trình mặt phẳng và mặt cầu Oxyz',
        startAt: null,
        endAt: null,
        status: 'Unscheduled',
        escrowPayoutStatus: 'Holding',
        payoutAmount: 200000,
        meetUrl: null,
        studentAttended: null,
        tutorAttended: null,
      },
      {
        id: 's6s6s6s6-0001-0000-0000-000000000006',
        sessionNumber: 6,
        title: 'Buổi 6: Phương trình đường thẳng trong không gian',
        startAt: null,
        endAt: null,
        status: 'Unscheduled',
        escrowPayoutStatus: 'Holding',
        payoutAmount: 200000,
        meetUrl: null,
        studentAttended: null,
        tutorAttended: null,
      },
      {
        id: 's7s7s7s7-0001-0000-0000-000000000007',
        sessionNumber: 7,
        title: 'Buổi 7: Nguyên hàm và tích phân cơ bản',
        startAt: null,
        endAt: null,
        status: 'Unscheduled',
        escrowPayoutStatus: 'Holding',
        payoutAmount: 200000,
        meetUrl: null,
        studentAttended: null,
        tutorAttended: null,
      },
      {
        id: 's8s8s8s8-0001-0000-0000-000000000008',
        sessionNumber: 8,
        title: 'Buổi 8: Các phương pháp tính tích phân (Đổi biến & Từng phần)',
        startAt: null,
        endAt: null,
        status: 'Unscheduled',
        escrowPayoutStatus: 'Holding',
        payoutAmount: 200000,
        meetUrl: null,
        studentAttended: null,
        tutorAttended: null,
      },
      {
        id: 's9s9s9s9-0001-0000-0000-000000000009',
        sessionNumber: 9,
        title: 'Buổi 9: Ứng dụng tích phân tính diện tích & thể tích',
        startAt: null,
        endAt: null,
        status: 'Unscheduled',
        escrowPayoutStatus: 'Holding',
        payoutAmount: 200000,
        meetUrl: null,
        studentAttended: null,
        tutorAttended: null,
      },
      {
        id: 's10s10s10-0001-0000-0000-000000000010',
        sessionNumber: 10,
        title: 'Buổi 10: Tổng ôn luyện đề thi chuẩn cấu trúc THPT Quốc Gia',
        startAt: null,
        endAt: null,
        status: 'Unscheduled',
        escrowPayoutStatus: 'Holding',
        payoutAmount: 200000,
        meetUrl: null,
        studentAttended: null,
        tutorAttended: null,
      },
    ],
  };
}

export default enrollmentService;
