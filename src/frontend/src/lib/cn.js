import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * `cn` — hợp nhất class có điều kiện (clsx) rồi gỡ xung đột Tailwind (tailwind-merge).
 * Dùng cho mọi UI primitive để class truyền vào luôn ghi đè được class mặc định.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default cn;
