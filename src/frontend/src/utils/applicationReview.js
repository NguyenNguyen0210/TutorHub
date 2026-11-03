const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
const timestamp = value => Date.parse(value && !/(Z|[+-]\d{2}:\d{2})$/i.test(value) ? `${value}Z` : value);

export function filterApplications(items, { status = '', search = '', subject = '', education = '', date = '' }, now = Date.now()) {
  const query = normalize(search);
  const vietnamDay = value => Math.floor((value + 7 * 3600000) / 86400000);
  return items.filter(item => {
    if (status && item.status !== status) return false;
    if (query && !normalize([item.userFullName, item.userEmail, item.userPhone, item.subject, item.subjectSub, item.major].join(' ')).includes(query)) return false;
    if (subject && item.subject !== subject) return false;
    if (education && item.degreeLevel !== education) return false;
    if (date) {
      const submitted = timestamp(item.submittedAt);
      const dayDifference = vietnamDay(now) - vietnamDay(submitted);
      const days = date === 'today' ? 1 : date === '7days' ? 7 : 30;
      if (!Number.isFinite(submitted) || dayDifference < 0 || dayDifference >= days) return false;
    }
    return true;
  });
}
