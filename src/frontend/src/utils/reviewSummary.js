export function reviewSummary(average, count) {
  const rating = Number(average), total = Number(count);
  const hasRating = Number.isInteger(total) && total > 0 && Number.isFinite(rating) && rating >= 1 && rating <= 5;
  return { rating: hasRating ? rating : null, total: Number.isInteger(total) && total > 0 ? total : 0, hasRating };
}
