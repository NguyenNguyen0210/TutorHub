import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

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
 */
export function formatDateTime(date, format = 'DD/MM/YYYY HH:mm') {
  if (!date) return '';
  return dayjs(date).format(format);
}

/**
 * Format relative time (e.g. "15 phút trước", "Còn lại 16 giờ")
 */
export function formatRelativeTime(date) {
  if (!date) return '';
  return dayjs(date).fromNow();
}

/**
 * Alias for formatCurrency
 */
export const formatVND = formatCurrency;

/**
 * Null-safe number formatting.
 * Backend có field nullable (`decimal? MinPrice`, `RatingAvg`, ...) — gọi
 * `value.toFixed()` trực tiếp trên payload thật sẽ ném TypeError và trắng trang.
 */
export function formatNumber(value, digits = 0, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed.toFixed(digits);
}

/** Alias cho điểm đánh giá (mặc định 1 chữ số thập phân). */
export const formatRating = (value, digits = 1) => formatNumber(value, digits, '—');
