/**
 * Domain Constants and Roles for TutorHub Platform
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
  PLATFORM_FEE_RATE: 0.10,
  MIN_WITHDRAWAL_AMOUNT: 50000,
  ABSENT_STRIKE_LIMIT: 3,
};