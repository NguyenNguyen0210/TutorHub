import { api } from './api';
import enrollmentService from './enrollment.service';

export const sessionService = {
  /**
   * Lấy danh sách lịch học của học viên
   */
  async getMySessions(params = {}) {
    try {
      const res = await api.get('/sessions', { params });
      if (res && Array.isArray(res)) return res;
      return getMockSessionsList();
    } catch (err) {
      console.warn('[sessionService] Backend /sessions offline, using mock sessions.', err.message);
      return getMockSessionsList();
    }
  },

  /**
   * Lấy chi tiết một buổi học
   */
  async getSessionById(id) {
    try {
      const res = await api.get(`/sessions/${id}`);
      if (res && res.id) return res;
      return getMockSessionDetail(id);
    } catch (err) {
      console.warn(`[sessionService] Backend /sessions/${id} offline, using mock session detail.`, err.message);
      return getMockSessionDetail(id);
    }
  },

  /**
   * Điểm danh 2 chiều (Học viên / Gia sư nộp điểm danh)
   */
  async submitAttendance(id, outcome) {
    try {
      const res = await api.post(`/sessions/${id}/attendance`, { outcome });
      return res;
    } catch (err) {
      console.warn(`[sessionService] Backend /sessions/${id}/attendance offline, simulating attendance response.`, err.message);
      return {
        id,
        outcome,
        isSuccess: true,
        message: outcome === 'Attended'
          ? 'Đã xác nhận có mặt! Hệ thống sẽ tự động giải ngân sau khi gia sư đối soát.'
          : 'Đã báo vắng mặt. Bạn có thể mở khiếu nại tranh chấp nếu gia sư bỏ lớp.',
      };
    }
  },

  /**
   * Xếp lịch học cho buổi học chưa có giờ
   */
  async scheduleSession(id, startAt, endAt) {
    try {
      const res = await api.post(`/sessions/${id}/schedule`, { startAt, endAt });
      return res;
    } catch (err) {
      console.warn(`[sessionService] Backend /sessions/${id}/schedule offline, simulating scheduled session.`, err.message);
      return { id, startAt, endAt, status: 'Scheduled' };
    }
  },
};

function getMockSessionsList() {
  return [
    {
      id: 's3s3s3s3-0001-0000-0000-000000000003',
      enrollmentId: 'e1e1e1e1-0001-0000-0000-000000000001',
      sessionNumber: 3,
      title: 'Buổi 3: Giá trị lớn nhất & nhỏ nhất trên đoạn (Thực chiến Casio)',
      subjectName: 'Toán THPT',
      tutorName: 'ThS. Nguyễn Văn An',
      startAt: '2026-09-14T18:00:00Z',
      endAt: '2026-09-14T19:00:00Z',
      status: 'Scheduled',
      meetUrl: 'https://meet.google.com/tutorhub-s3-math',
      needsAttendance: true,
    },
    {
      id: 's4s4s4s4-0001-0000-0000-000000000004',
      enrollmentId: 'e1e1e1e1-0001-0000-0000-000000000001',
      sessionNumber: 4,
      title: 'Buổi 4: Hình học không gian Oxyz - Tọa độ điểm & Vectơ',
      subjectName: 'Toán THPT',
      tutorName: 'ThS. Nguyễn Văn An',
      startAt: '2026-09-16T18:00:00Z',
      endAt: '2026-09-16T19:00:00Z',
      status: 'Scheduled',
      meetUrl: 'https://meet.google.com/tutorhub-s4-math',
      needsAttendance: false,
    },
  ];
}

function getMockSessionDetail(id) {
  return {
    id: id || 's3s3s3s3-0001-0000-0000-000000000003',
    enrollmentId: 'e1e1e1e1-0001-0000-0000-000000000001',
    contractCode: 'CTR-2026-THB-001',
    sessionNumber: 3,
    title: 'Buổi 3: Giá trị lớn nhất & nhỏ nhất trên đoạn (Thực chiến Casio)',
    tutorName: 'ThS. Nguyễn Văn An',
    tutorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=an',
    studentName: 'Phạm Minh Tuấn',
    startAt: '2026-09-14T18:00:00Z',
    endAt: '2026-09-14T19:00:00Z',
    status: 'Scheduled',
    meetUrl: 'https://meet.google.com/tutorhub-s3-math',
    payoutAmount: 200000,
    studentAttended: null,
    tutorAttended: null,
    attendanceVerificationDueAt: '2026-09-15T19:00:00Z',
  };
}

export default sessionService;
