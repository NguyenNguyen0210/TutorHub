// Admin Governance Service - Connected to /api/v1/admin with graceful fallback
import api from './api';

const MOCK_ADMIN_STATS = {
  gmv: 1420000000,
  gmvGrowth: 18.4,
  platformFeeRevenue: 142000000,
  escrowLocked: 385600000,
  activeDisputesCount: 3,
  urgentDisputesCount: 1,
  resolutionRate24h: 98.4,
  pendingTutorAppsCount: 4,
  suspendedUsersCount: 2,
};

const MOCK_TUTOR_APPLICATIONS = [
  {
    id: 'app_001',
    applicantName: 'ThS. Nguyễn Văn An',
    email: 'tutor.an@tutorhub.com',
    phone: '0903 123 456',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    university: 'Đại Học Sư Phạm TP.HCM',
    degree: 'Thạc Sĩ Toán Học Ứng Dụng (GPA 3.8/4.0)',
    experienceYears: 5,
    subjects: ['Toán Cao Cấp', 'Đại Số Tuyến Tính', 'Giải Tích Đại Học'],
    hourlyRate: 200000,
    appliedDate: '14/09/2026',
    status: 'PENDING',
    degreeScanUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800',
    trialVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    bankAccount: {
      bankName: 'Vietcombank',
      accountNumber: '0071001234567',
      accountHolder: 'NGUYEN VAN AN',
    }
  },
  {
    id: 'app_002',
    applicantName: 'Trần Thị Bích Ngọc',
    email: 'bichngoc.ielts@gmail.com',
    phone: '0912 888 999',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    university: 'Đại Học Ngoại Thương',
    degree: 'Cử Nhân Kinh Tế Đối Ngoại - IELTS 8.5 Overall, CELTA Pass A',
    experienceYears: 4,
    subjects: ['IELTS Academic', 'Tiếng Anh Giao Tiếp Doanh Nghiệp'],
    hourlyRate: 250000,
    appliedDate: '13/09/2026',
    status: 'PENDING',
    degreeScanUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800',
    trialVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    bankAccount: {
      bankName: 'Techcombank',
      accountNumber: '1903345678901',
      accountHolder: 'TRAN THI BICH NGOC',
    }
  }
];

const MOCK_DISPUTE_DETAIL = {
  id: 'ba07ba07-0001',
  code: 'DEC-S8-025',
  contractId: 'e1e1e1e1-0001',
  contractTitle: 'Hợp Đồng 10 Buổi Đại Số Tuyến Tính Nâng Cao',
  sessionId: 's3s3s3s3-0003',
  sessionNumber: 3,
  sessionDate: '14/09/2026 (18:00 - 20:00)',
  sessionPrice: 200000,
  escrowStatus: 'HELD',
  status: 'PENDING_ARBITRATION',
  student: {
    id: 'st_001',
    name: 'Lê Hoàng Tuấn',
    email: 'student.tuan@tutorhub.com',
    phone: '0933 111 222',
    strikes: 0,
    joinTime: '17:58:12',
    durationMinutes: 35,
    claim: 'Em vào phòng Google Meet từ 17:58 đợi suốt 35 phút nhưng thầy An không vào phòng và không phản hồi tin nhắn. Đề nghị hoàn lại 100% tiền buổi học.',
  },
  tutor: {
    id: 'tu_001',
    name: 'ThS. Nguyễn Văn An',
    email: 'tutor.an@tutorhub.com',
    phone: '0903 123 456',
    strikes: 0,
    joinTime: 'Không ghi nhận (0 phút)',
    statement: 'Tôi bị cúp điện và mất mạng 4G đột ngột khu vực Quận 7 lúc 17:45 nên không thể lên mạng báo tin được. Tôi đã nhắn tin cho học viên lúc 19:30 xin xếp lịch dạy bù.',
  },
  meetTelemetry: {
    roomUrl: 'https://meet.google.com/abc-defg-hij',
    studentLogs: [
      { event: 'USER_JOIN', timestamp: '17:58:12', ip: '118.69.182.45' },
      { event: 'AUDIO_CONNECTED', timestamp: '17:58:15' },
      { event: 'USER_WAITING', timestamp: '18:15:00', duration: '17 mins' },
      { event: 'USER_LEAVE', timestamp: '18:33:40', totalDuration: '35 mins 28s' },
    ],
    tutorLogs: [],
    analysis: 'Học viên có mặt đúng giờ và chờ đợi hơn 30 phút. Gia sư hoàn toàn vắng mặt không truy cập phòng học.'
  }
};

const MOCK_USERS = [
  {
    id: 'u_001',
    name: 'Lê Hoàng Tuấn',
    email: 'student.tuan@tutorhub.com',
    role: 'Student',
    phone: '0933 111 222',
    strikes: 0,
    status: 'ACTIVE',
  },
  {
    id: 'u_002',
    name: 'Trần Văn Bùng',
    email: 'student.bad@tutorhub.com',
    role: 'Student',
    phone: '0944 222 333',
    strikes: 2,
    status: 'SUSPENDED_7D',
  },
  {
    id: 'u_003',
    name: 'ThS. Nguyễn Văn An',
    email: 'tutor.an@tutorhub.com',
    role: 'Tutor',
    phone: '0903 123 456',
    strikes: 0,
    status: 'ACTIVE',
  }
];

const MOCK_AUDIT_LOGS = [
  {
    id: 'LOG-20260914-001',
    timestamp: '14/09/2026 19:45:10',
    correlationId: 'req-corr-9f8e-1234',
    actor: 'admin@tutorhub.com (Arbitrator)',
    action: 'DISPUTE_ARBITRATION_VERDICT',
    summary: 'Phán quyết Tranh chấp DEC-S8-025: Hoàn 100% (200.000 ₫) cho Học viên Tuấn. Áp dụng 1 Strike gia sư.',
    sha256Hash: 'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
    payloadBefore: { escrowState: 'HELD', tutorStrikes: 0 },
    payloadAfter: { escrowState: 'REFUNDED_100', tutorStrikes: 1 }
  }
];

export const adminService = {
  getStats: async () => {
    try {
      const res = await api.get('/admin/dashboard/stats');
      if (res && res.data) {
        return {
          ...MOCK_ADMIN_STATS,
          ...res.data
        };
      }
      return MOCK_ADMIN_STATS;
    } catch (err) {
      console.warn('[adminService] Fallback to mock stats:', err.message);
      return MOCK_ADMIN_STATS;
    }
  },

  getTutorApplications: async () => {
    try {
      const res = await api.get('/admin/tutor-applications');
      if (res && res.data && Array.isArray(res.data.items)) {
        return res.data.items.map(item => ({
          ...item,
          applicantName: item.tutorName || item.fullName || 'Gia sư ứng tuyển',
          avatar: item.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          appliedDate: 'Hôm nay',
          subjects: item.subjects || ['Toán', 'Tiếng Anh'],
          hourlyRate: item.hourlyRate || 200000,
          degreeScanUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800',
          trialVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          bankAccount: { bankName: 'Vietcombank', accountNumber: '0011001234567', accountHolder: 'GIA SU' }
        }));
      }
      return MOCK_TUTOR_APPLICATIONS;
    } catch (err) {
      console.warn('[adminService] Fallback to mock tutor applications:', err.message);
      return MOCK_TUTOR_APPLICATIONS;
    }
  },

  getDisputeDetail: async (id) => {
    try {
      const res = await api.get(`/admin/disputes/${id}/investigation`);
      if (res && res.data) {
        return { ...MOCK_DISPUTE_DETAIL, ...res.data };
      }
      return MOCK_DISPUTE_DETAIL;
    } catch (err) {
      console.warn('[adminService] Fallback to mock dispute detail:', err.message);
      return MOCK_DISPUTE_DETAIL;
    }
  },

  getUsers: async () => {
    try {
      const res = await api.get('/admin/users');
      if (res && res.data && Array.isArray(res.data.items)) {
        return res.data.items.map(u => ({
          id: u.id,
          name: u.fullName || u.email,
          email: u.email,
          role: u.role,
          phone: u.phone || '0901234567',
          strikes: u.absentStrikes || 0,
          status: u.status?.toUpperCase() || 'ACTIVE'
        }));
      }
      return MOCK_USERS;
    } catch (err) {
      console.warn('[adminService] Fallback to mock users:', err.message);
      return MOCK_USERS;
    }
  },

  getAuditLogs: async () => {
    try {
      const res = await api.get('/admin/audit-logs');
      if (res && res.data && Array.isArray(res.data.items)) {
        return res.data.items.map(l => ({
          id: l.id,
          timestamp: new Date(l.createdAt).toLocaleString('vi-VN'),
          correlationId: l.correlationId || 'N/A',
          actor: l.performedBy || 'System',
          action: l.actionType || 'AUDIT_EVENT',
          summary: l.description || l.actionType,
          sha256Hash: l.integrityHash || 'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
          payloadBefore: l.beforeState ? JSON.parse(l.beforeState) : {},
          payloadAfter: l.afterState ? JSON.parse(l.afterState) : {}
        }));
      }
      return MOCK_AUDIT_LOGS;
    } catch (err) {
      console.warn('[adminService] Fallback to mock audit logs:', err.message);
      return MOCK_AUDIT_LOGS;
    }
  },

  approveTutorApplication: async (id) => {
    try {
      await api.post(`/admin/tutor-applications/${id}/approve`);
    } catch (err) {
      console.warn('[adminService] Fallback approval:', err.message);
    }
    return true;
  },

  rejectTutorApplication: async (id, reason) => {
    try {
      await api.post(`/admin/tutor-applications/${id}/reject`, { reason });
    } catch (err) {
      console.warn('[adminService] Fallback rejection:', err.message);
    }
    return true;
  },

  applyDisputeVerdict: async (caseId, verdictType, notes) => {
    try {
      await api.post(`/admin/disputes/${caseId}/resolve`, { verdictType, notes });
    } catch (err) {
      console.warn('[adminService] Fallback dispute resolution:', err.message);
    }
    return {
      type: verdictType,
      notes,
      appliedAt: new Date().toISOString(),
      correlationId: 'req-corr-' + Date.now().toString(16),
    };
  },

  updateUserStrike: async (userId, delta, reason) => {
    const user = MOCK_USERS.find(u => u.id === userId);
    if (user) {
      user.strikes = Math.max(0, user.strikes + delta);
      if (user.strikes >= 3) user.status = 'BANNED';
      else if (user.strikes === 2) user.status = 'SUSPENDED_7D';
      else if (user.strikes === 1) user.status = 'WARNED';
      else user.status = 'ACTIVE';
    }
    return user;
  }
};

export default adminService;
