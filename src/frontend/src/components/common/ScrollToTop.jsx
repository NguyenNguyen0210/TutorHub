import { useLayoutEffect, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop — Đưa viewport về đầu trang (0, 0) ngay lập tức khi chuyển route.
 *
 * Giải quyết triệt để lỗi:
 * 1. Khi người dùng cuộn ở trang trước rồi bấm link sang trang mới, trang mới bị giữ
 *    nguyên vị trí cuộn cũ hoặc bị trượt (smooth-scroll) xuống một đoạn.
 * 2. Vô hiệu hóa tạm thời `scroll-behavior: smooth` trên <html> khi chuyển route để
 *    tránh hiệu ứng trượt màn hình giật cục.
 * 3. Đặt `history.scrollRestoration = 'manual'` để ngăn browser tự ý khôi phục vị trí cuộn cũ.
 * 4. Nếu URL có hash (#id), tự động cuộn mượt tới đúng phần tử mục tiêu.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useLayoutEffect(() => {
    // Nếu có hash (ví dụ: #quy-trinh), chờ một nhịp để DOM mount rồi cuộn tới
    if (hash) {
      const id = decodeURIComponent(hash.replace('#', ''));
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // Khi chuyển trang (pathname thay đổi):
    // Tạm tắt scroll-behavior trên root để cuộn tức thì về (0,0) trước khi browser paint
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      const prevBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';

      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant',
      });

      // Khôi phục thuộc tính scroll-behavior ban đầu
      root.style.scrollBehavior = prevBehavior;
    }
  }, [pathname, hash]);

  return null;
}
