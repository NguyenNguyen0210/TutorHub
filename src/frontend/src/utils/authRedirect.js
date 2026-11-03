// Only allow local destinations; reject auth pages to avoid redirect loops.
export function safeReturnUrl(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return null;
  if (/[\\\s]/.test(value) || [...value].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) return null;
  try {
    const url = new URL(value, 'https://tutorhub.local');
    if (url.origin !== 'https://tutorhub.local') return null;
    if (/^\/(?:auth(?:\/|$)|login\/?$|register\/?$)/i.test(decodeURIComponent(url.pathname))) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function getAuthReturnUrl(location) {
  const from = location.state?.from;
  const params = new URLSearchParams(location.search);
  return safeReturnUrl(location.state?.returnUrl)
    || safeReturnUrl(typeof from === 'string' ? from : from?.pathname && `${from.pathname}${from.search || ''}${from.hash || ''}`)
    || safeReturnUrl(params.get('returnUrl'))
    || safeReturnUrl(params.get('redirect'));
}

export async function resolveAuthRedirect(role, returnUrl, { getEnrollments, getTutorApplication }) {
  const destination = safeReturnUrl(returnUrl);
  if (destination) return destination;
  if (role === 'Admin') return '/admin/dashboard';
  if (role === 'Tutor') {
    try {
      if (!await getTutorApplication()) return '/tutor/application';
    } catch {
      // Preserve access to the workspace when the application lookup fails.
    }
    return '/tutor/dashboard';
  }
  try {
    const enrollments = await getEnrollments({ pageNumber: 1, pageSize: 1 });
    return enrollments.totalCount > 0 ? '/student/dashboard' : '/tutors';
  } catch {
    // An unavailable API does not establish that the student has no contracts.
    return '/student/dashboard';
  }
}
