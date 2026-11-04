export function catalogAppearance(name) {
  const value = String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
  if (/cong nghe|lap trinh|computer|technology/.test(value)) return { icon: 'code', tone: 'bg-brand-primary-50 text-brand-primary-700' };
  if (/ngoai ngu|tieng |language/.test(value)) return { icon: 'translate', tone: 'bg-insight-subtle text-insight-strong' };
  if (/toan|khtn|khoa hoc|science/.test(value)) return { icon: 'school', tone: 'bg-holding-subtle text-holding-strong' };
  if (/ky nang|skill/.test(value)) return { icon: 'lightbulb', tone: 'bg-success-subtle text-success-strong' };
  return { icon: 'category', tone: 'bg-neutral-100 text-fg-secondary' };
}
