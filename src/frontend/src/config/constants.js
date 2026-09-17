/**
 * Domain Constants for TutorHub Platform
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5129/api/v1';

export const PLATFORM_CONFIG = {
  HOLDING_EXPIRY_MINUTES: 15,
  PLATFORM_FEE_RATE: 0.10,
  MIN_WITHDRAWAL_AMOUNT: 50000,
  ABSENT_STRIKE_LIMIT: 3,
};
