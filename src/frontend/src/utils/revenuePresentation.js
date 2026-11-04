export function revenueNumber(value) {
  if (value == null || (typeof value === 'string' && !value.trim()) || (typeof value !== 'number' && typeof value !== 'string')) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function compactRevenue(value) {
  const number = revenueNumber(value);
  if (number == null) return '—';
  const magnitude = Math.abs(number);
  const [divisor, suffix] = magnitude >= 1e9 ? [1e9, 'tỷ'] : magnitude >= 1e6 ? [1e6, 'triệu'] : magnitude >= 1e3 ? [1e3, 'nghìn'] : [1, ''];
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: divisor === 1 ? 0 : 2 }).format(number / divisor)}${suffix ? ` ${suffix}` : ''} ₫`;
}

export function revenueMonthLabel(month) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month || '') ? `${month.slice(5)}/${month.slice(0, 4)}` : '—';
}

export function revenueMonthLink(month) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || '')) return null;
  const [year, index] = month.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, index, 0)).getUTCDate();
  return `/admin/transactions?fromDate=${month}-01&toDate=${month}-${String(lastDay).padStart(2, '0')}&sort=Oldest`;
}

export function revenuePeriodTotal(points) {
  const numbers = points.map(point => revenueNumber(point.platformRevenue));
  return !numbers.length || numbers.some(value => value == null) ? null : numbers.reduce((sum, value) => sum + value, 0);
}

export function revenueScale(points) {
  const values = points.map(point => revenueNumber(point.platformRevenue)).filter(value => value != null);
  const high = Math.max(0, ...values);
  const low = Math.min(0, ...values);
  const magnitude = Math.max(high, -low);
  if (!magnitude) return { min: 0, max: 1, ticks: [0] };
  const step = 10 ** (Math.floor(Math.log10(magnitude)) - 1) * 5;
  const max = high > 0 ? Math.ceil(high / step) * step : 0;
  const min = low < 0 ? -Math.ceil(-low / step) * step : 0;
  const ticks = [...(max > 0 ? [max, max * 2 / 3, max / 3] : []), 0, ...(min < 0 ? [min / 2, min] : [])];
  return { min, max, ticks };
}
