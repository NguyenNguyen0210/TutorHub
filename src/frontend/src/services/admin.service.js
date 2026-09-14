// Admin Governance & Escrow Audit Service
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
    email: 'nguyenvanan.math@hcmue.edu.vn',
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
  },
  {
    id: 'app_003',
    applicantName: 'Lê Hoàng Long',
    email: 'long.le@khtn.edu.vn',
    phone: '0988 777 666',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    university: 'Đại Học Khoa Học Tự Nhiên',
    degree: 'Kỹ Sư Khoa Học Máy Tính - Huy Chương Bạc Olympic Tin Học QG',
    experienceYears: 3,
    subjects: ['C++ Nâng Cao', 'Cấu Trúc Dữ Liệu & Giải Thuật', 'Python Data Science'],
    hourlyRate: 180000,
    appliedDate: '12/09/2026',
    status: 'PENDING',
    degreeScanUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800',
    trialVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    bankAccount: {
      bankName: 'MBBank',
      accountNumber: '8888999900001',
      accountHolder: 'LE HOANG LONG',
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
    email: 'tuan.le@student.edu.vn',
    phone: '0933 111 222',
    strikes: 0,
    joinTime: '17:58:12',
    durationMinutes: 35,
    claim: 'Em vào phòng Google Meet từ 17:58 đợi suốt 35 phút nhưng thầy An không vào phòng và không phản hồi tin nhắn. Đề nghị hoàn lại 100% tiền buổi học.',
  },
  tutor: {
    id: 'tu_001',
    name: 'ThS. Nguyễn Văn An',
    email: 'an.math@tutorhub.vn',
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
    email: 'tuan.le@student.edu.vn',
    role: 'Student',
    phone: '0933 111 222',
    strikes: 0,
    status: 'ACTIVE',
    contractsCount: 2,
    rating: 5.0,
    joinedAt: '01/08/2026',
  },
  {
    id: 'u_002',
    name: 'Trần Văn Bùng',
    email: 'bung.tran@student.edu.vn',
    role: 'Student',
    phone: '0944 222 333',
    strikes: 2,
    status: 'SUSPENDED_7D',
    strikeHistory: [
      { date: '02/09/2026', reason: 'Vắng mặt buổi học #1 không báo trước' },
      { date: '10/09/2026', reason: 'Vắng mặt buổi học #4 gia sư chờ 30 phút' }
    ],
    contractsCount: 1,
    rating: 2.1,
    joinedAt: '15/07/2026',
  },
  {
    id: 'u_003',
    name: 'ThS. Nguyễn Văn An',
    email: 'an.math@tutorhub.vn',
    role: 'Tutor',
    phone: '0903 123 456',
    strikes: 0,
    status: 'ACTIVE',
    contractsCount: 18,
    rating: 4.95,
    joinedAt: '10/05/2026',
  },
  {
    id: 'u_004',
    name: 'Trần Thị Bích Ngọc',
    email: 'bichngoc.ielts@gmail.com',
    role: 'Tutor',
    phone: '0912 888 999',
    strikes: 0,
    status: 'ACTIVE',
    contractsCount: 12,
    rating: 5.0,
    joinedAt: '20/06/2026',
  }
];

const MOCK_AUDIT_LOGS = [
  {
    id: 'LOG-20260914-001',
    timestamp: '14/09/2026 19:45:10',
    correlationId: 'req-corr-9f8e-1234',
    actor: 'admin@tutorhub.vn (Arbitrator)',
    action: 'DISPUTE_ARBITRATION_VERDICT',
    entityType: 'DisputeCase',
    entityId: 'ba07ba07-0001',
    summary: 'Phán quyết Tranh chấp DEC-S8-025: Hoàn 100% (200.000 ₫) cho Học viên Tuấn. Áp dụng 1 Strike gia sư.',
    sha256Hash: 'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
    payloadBefore: {
      escrowState: 'HELD',
      studentBalanceRefund: 0,
      tutorPending: 3600000,
      tutorStrikes: 0
    },
    payloadAfter: {
      escrowState: 'REFUNDED_100',
      studentBalanceRefund: 200000,
      tutorPending: 3420000,
      tutorStrikes: 1,
      platformFeeReversed: 20000
    }
  },
  {
    id: 'LOG-20260914-002',
    timestamp: '14/09/2026 18:35:20',
    correlationId: 'req-corr-7b6a-9876',
    actor: 'student_001 (Lê Hoàng Tuấn)',
    action: 'DISPUTE_FILED',
    entityType: 'DisputeCase',
    entityId: 'ba07ba07-0001',
    summary: 'Học viên nộp khiếu nại vắng mặt TutorNoShow buổi học #3. Escrow tự động phong tỏa 200.000 ₫.',
    sha256Hash: 'e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
    payloadBefore: { escrowState: 'IN_TRANSIT', sessionState: 'SCHEDULED' },
    payloadAfter: { escrowState: 'HELD', sessionState: 'DISPUTED' }
  },
  {
    id: 'LOG-20260913-003',
    timestamp: '13/09/2026 21:00:00',
    correlationId: 'req-corr-3d2e-5432',
    actor: 'SYSTEM_AUTOPILOT_24H',
    action: 'ESCROW_RELEASE_AUTOMATIC',
    entityType: 'EscrowTransaction',
    entityId: 'tx_escrow_8871',
    summary: 'Học viên không phản hồi sau 24h điểm danh buổi #2. Escrow tự động giải ngân 180.000 ₫ cho gia sư An.',
    sha256Hash: 'f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
    payloadBefore: { tutorAvailable: 720000, platformRevenue: 120000 },
    payloadAfter: { tutorAvailable: 900000, platformRevenue: 140000 }
  },
  {
    id: 'LOG-20260912-004',
    timestamp: '12/09/2026 14:15:33',
    correlationId: 'req-corr-1a2b-3c4d',
    actor: 'vnpay_gateway_webhook',
    action: 'ESCROW_DEPOSIT_CAPTURED',
    entityType: 'BookingPayment',
    entityId: 'b_custom_001',
    summary: 'VNPay thanh toán thành công 2.000.000 ₫. Khóa vào tài khoản ký quỹ trung gian Escrow.',
    sha256Hash: '0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b',
    payloadBefore: { bookingState: 'PENDING_PAYMENT' },
    payloadAfter: { bookingState: 'PAID_ESCROW_LOCKED', escrowAmount: 2000000 }
  }
];

export const adminService = {
  getStats: async () => MOCK_ADMIN_STATS,
  getTutorApplications: async () => MOCK_TUTOR_APPLICATIONS,
  getDisputeDetail: async (id) => MOCK_DISPUTE_DETAIL,
  getUsers: async () => MOCK_USERS,
  getAuditLogs: async () => MOCK_AUDIT_LOGS,

  approveTutorApplication: async (id) => {
    const app = MOCK_TUTOR_APPLICATIONS.find(a => a.id === id);
    if (app) app.status = 'APPROVED';
    return true;
  },

  rejectTutorApplication: async (id, reason) => {
    const app = MOCK_TUTOR_APPLICATIONS.find(a => a.id === id);
    if (app) app.status = 'REJECTED';
    return true;
  },

  applyDisputeVerdict: async (caseId, verdictType, notes) => {
    MOCK_DISPUTE_DETAIL.status = 'RESOLVED';
    MOCK_DISPUTE_DETAIL.verdict = {
      type: verdictType,
      notes,
      appliedAt: new Date().toISOString(),
      correlationId: 'req-corr-' + Date.now().toString(16),
    };
    return MOCK_DISPUTE_DETAIL.verdict;
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
