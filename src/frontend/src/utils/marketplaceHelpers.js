const ratingFormatter = new Intl.NumberFormat('vi-VN', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const countFormatter = new Intl.NumberFormat('vi-VN');

/** Format a tutor rating as `4,8`; invalid values become `0,0`. */
export function formatRating(value) {
  const number = Number(value);
  return ratingFormatter.format(Number.isFinite(number) ? number : 0);
}

/** Human-readable count with Vietnamese grouping. */
export function formatCount(value) {
  const number = Number(value);
  return countFormatter.format(Number.isFinite(number) ? Math.max(0, number) : 0);
}

/**
 * Return the 1-based first/last item numbers shown on the current page.
 * Empty results return { start: 0, end: 0 } so the UI can hide the line.
 */
export function getPaginationRange(page, pageSize, total) {
  const safeTotal = Math.max(0, Number(total) || 0);
  const safePageSize = Math.max(1, Number(pageSize) || 1);
  const safePage = Math.max(1, Number(page) || 1);

  if (safeTotal === 0) return { start: 0, end: 0 };

  return {
    start: Math.min((safePage - 1) * safePageSize + 1, safeTotal),
    end: Math.min(safePage * safePageSize, safeTotal),
  };
}
