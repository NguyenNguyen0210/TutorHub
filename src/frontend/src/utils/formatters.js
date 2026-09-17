import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.locale('vi');

const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Format currency to Vietnam Dong (e.g. 2.000.000 ₫)
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

/**
 * Format date & time in Vietnam timezone (UTC+7)
 * CLAUDE.md Trap #3: Input date is strict UTC, converted to Asia/Ho_Chi_Minh for display.
 */
export function formatDateTime(date, format = 'DD/MM/YYYY HH:mm') {
  if (!date) return '';
  return dayjs.utc(date).tz(VIETNAM_TIMEZONE).format(format);
}

/**
 * Format relative time in Vietnam timezone (e.g. "15 phút trước", "Còn lại 16 giờ")
 */
export function formatRelativeTime(date) {
  if (!date) return '';
  return dayjs.utc(date).tz(VIETNAM_TIMEZONE).fromNow();
}

/**
 * Alias for formatCurrency
 */
export const formatVND = formatCurrency;

/**
 * Null-safe number formatting.
 */
export function formatNumber(value, digits = 0, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed.toFixed(digits);
}

/** Alias cho điểm đánh giá (mặc định 1 chữ số thập phân). */
export const formatRating = (value, digits = 1) => formatNumber(value, digits, '—');
