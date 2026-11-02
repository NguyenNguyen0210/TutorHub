export const WORKSPACE_ACTIVITY_CHANGED = 'tutorhub:workspace-activity-changed';

export function notifyWorkspaceActivityChanged() {
  window.dispatchEvent(new Event(WORKSPACE_ACTIVITY_CHANGED));
}

export function notificationDestination(link, role) {
  if (!link || !link.startsWith('/') || /^\/[\\/]/.test(link) || /[\r\n\\]/.test(link)) return null;
  if (link.startsWith('/enrollments/')) return `/${role === 'Tutor' ? 'tutor' : 'student'}${link}`;
  if (link.startsWith('/sessions/')) return `/${role === 'Tutor' ? 'tutor' : 'student'}${link}`;
  if (link.startsWith('/bookings/')) return `/student${link}/checkout`;
  if (link.startsWith('/wallet/transactions/')) return null; // Old event detail is resolved by the owned notification endpoint.
  if (link === '/wallet/withdrawals') return `/${role === 'Tutor' ? 'tutor' : 'student'}/wallet?tab=withdrawals`;
  if (link.startsWith('/conversations/')) return `/app/messages?conversationId=${encodeURIComponent(link.split('/')[2])}`;
  if (/^\/admin\/disputes\/[^/]+$/.test(link) && role !== 'Admin') return link.replace('/admin/disputes/', '/app/disputes/');
  if (link.startsWith('/admin/') && role !== 'Admin') return null;
  if (/^\/admin\/tutor-applications\/[^/]+$/.test(link)) return `/admin/tutor-applications?applicationId=${encodeURIComponent(link.split('/')[3])}`;
  if (/^\/admin\/withdrawals\/[^/]+$/.test(link)) return `/admin/withdrawals?withdrawalId=${encodeURIComponent(link.split('/')[3])}`;
  if (link.startsWith('/admin/reports/') || link === '/tutor/reviews') return null;
  if (link === '/chat' || link.startsWith('/chat/')) {
    const id = link.split('/')[2];
    return id ? `/app/messages?conversationId=${encodeURIComponent(id)}` : '/app/messages';
  }
  const path = link.split(/[?#]/)[0];
  const supported = /^\/(student|tutor)\/(enrollments|sessions)\/[^/]+$/.test(path)
    || /^\/(student|tutor)\/(wallet|profile|settings|dashboard)$/.test(path)
    || /^\/admin\/disputes\/[^/]+$/.test(path) || /^\/app\/disputes\/[^/]+$/.test(path)
    || /^\/tutors\/[^/]+$/.test(path)
    || ['/', '/tutors', '/services', '/student/wishlist', '/tutor/application', '/admin/tutor-applications', '/admin/withdrawals', '/admin/student-wallets', '/app/messages'].includes(path);
  return supported ? link : null;
}
