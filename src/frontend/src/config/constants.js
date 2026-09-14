/**
 * Domain Constants, Roles and Real Test Accounts from seedData.sql
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5129/api/v1';

export const USER_ROLES = {
  ADMIN: 'Admin',
  TUTOR: 'Tutor',
  STUDENT: 'Student',
};

export const BOOKING_STATUS = {
  HOLDING: 'Holding',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

export const ENROLLMENT_STATUS = {
  PENDING: 'Pending',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const SESSION_STATUS = {
  UNSCHEDULED: 'Unscheduled',
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const ATTENDANCE_STATUS = {
  ATTENDED: 'Attended',
  ABSENT: 'Absent',
};

export const DISPUTE_REASON = {
  TUTOR_NO_SHOW: 'TutorNoShow',
  INCOMPLETE_SESSION: 'IncompleteSession',
  QUALITY_ISSUE: 'QualityIssue',
  TUTOR_LATE: 'TutorLate',
  OTHER: 'Other',
};

export const DISPUTE_STATUS = {
  OPEN: 'Open',
  UNDER_REVIEW: 'UnderReview',
  RESOLVED: 'Resolved',
  DISMISSED: 'Dismissed',
};

export const PLATFORM_CONFIG = {
  HOLDING_EXPIRY_MINUTES: 15,
  PLATFORM_FEE_RATE: 0.10, // 10%
  MIN_WITHDRAWAL_AMOUNT: 50000, // 50.000 ₫
  ABSENT_STRIKE_LIMIT: 3,
};

// Real Test Accounts from seedData.sql
export const TEST_ACCOUNTS = [
  {
    role: USER_ROLES.ADMIN,
    name: 'Quản Trị Viên Sàn',
    email: 'admin@tutorhub.com',
    label: 'Admin (Toàn quyền sàn)',
    badgeColor: 'purple',
    profileId: 'admin-001',
  },
  {
    role: USER_ROLES.TUTOR,
    name: 'ThS. Nguyễn Văn An',
    email: 'tutor.an@tutorhub.com',
    label: 'Gia Sư: ThS. Toán ĐHSP',
    badgeColor: 'indigo',
    profileId: 'tutor-an-001',
  },
  {
    role: USER_ROLES.STUDENT,
    name: 'Phạm Minh Tuấn',
    email: 'student.tuan@tutorhub.com',
    label: 'Học Viên: Ôn thi 9+',
    badgeColor: 'emerald',
    profileId: 'student-tuan-001',
  },
  {
    role: USER_ROLES.STUDENT,
    name: 'Trần Văn Bùng (2 Strikes)',
    email: 'student.bad@tutorhub.com',
    label: 'Học Viên Vi Phạm (Tạm khóa)',
    badgeColor: 'rose',
    profileId: 'student-bad-001',
  },
];
