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
