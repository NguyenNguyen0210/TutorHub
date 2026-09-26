/**
 * Anchor-navigation helpers dùng chung cho hồ sơ gia sư công khai.
 *
 * Trang dài ~5 section nên cần một nơi duy nhất quyết định "scroll tới đâu và
 * cuộn chậm hay không", tránh mỗi component tự chế lại `scrollIntoView`.
 */

/** Khoảng nghỉ (px) để section không bị dính dưới sticky anchor nav. */
export const SECTION_SCROLL_OFFSET = 104; // ~topbar + anchor nav

export const SECTION_IDS = {
  about: 'gioi-thieu',
  subjects: 'mon-hoc',
  services: 'goi-hoc',
  reviews: 'danh-gia',
  certificates: 'bang-cap',
  schedule: 'lich-day',
  faq: 'faq',
};

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Cuộn tới section theo id. Trả về true nếu tìm thấy section.
 *
 * Lưu ý: không dùng class `scroll-mt` vì offset phụ thuộc CSS; ở đây gọi tường
 * minh để tôn trọng `prefers-reduced-motion`.
 *
 * Một số môi trường (headless automation, webview nhúng, tab chưa được render) nhận
 * `scrollTo` dạng object với `behavior: 'smooth'` nhưng bỏ qua nó im lặng — vì smooth
 * cần animation frame mà những nơi đó không cấp frame. Vì vậy sau khi yêu cầu smooth,
 * ta kiểm tra lại bằng `setTimeout` (timer luôn chạy, kể cả khi rAF không fire) và trượt
 * sang dạng số nếu trang không nhúc nhích — điều hướng không bao giờ chết lặng.
 */
export function scrollToSection(id) {
  if (typeof document === 'undefined') return false;
  const target = document.getElementById(id);
  if (!target) return false;

  const top = Math.max(target.getBoundingClientRect().top + window.scrollY - SECTION_SCROLL_OFFSET, 0);
  const startY = window.scrollY;

  if (prefersReducedMotion()) {
    window.scrollTo(0, top);
  } else {
    window.scrollTo({ top, behavior: 'smooth' });
    window.setTimeout(() => {
      const alreadyThere = Math.abs(window.scrollY - top) <= 2;
      const didNotMove = Math.abs(window.scrollY - startY) <= 1;
      if (didNotMove && !alreadyThere) window.scrollTo(0, top);
    }, 150);
  }

  // Đưa focus về section để người dùng bàn phím không bị "mất" sau khi bấm neo.
  target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  return true;
}

/**
 * Scroll-spy: trả về section id đang hiển thị nhiều nhất trong viewport.
 * `ids` rỗng → null. Threshold 0.2 nghĩa là section chiếm ≥20% khung nhìn.
 */
export function observeActiveSection(ids) {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return () => {};
  }
  const targets = ids.map((id) => document.getElementById(id)).filter(Boolean);
  if (targets.length === 0) return () => {};

  const ratios = new Map();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
      });
    },
    { rootMargin: '-120px 0px -55% 0px', threshold: [0, 0.2, 0.5, 1] }
  );
  targets.forEach((t) => observer.observe(t));

  return {
    read: () => {
      let best = null;
      let bestRatio = 0;
      ratios.forEach((ratio, id) => {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          best = id;
        }
      });
      return best;
    },
    disconnect: () => observer.disconnect(),
  };
}
