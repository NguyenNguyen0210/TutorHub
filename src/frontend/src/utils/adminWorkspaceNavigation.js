// Preserve deep-link identifiers and filters while moving legacy admin entry points.
export function adminWorkspaceDestination(path, search = '') {
  const params = new URLSearchParams(search);
  if (path === '/admin/tutor-applications') {
    params.set('tab', 'applications');
    return `/admin/users?${params}`;
  }
  if (path === '/admin/student-withdrawals' || (path === '/admin/student-wallets' && params.get('tab') === 'withdrawals')) {
    params.delete('tab'); params.set('audience', 'student');
    if (params.has('withdrawalId') && !params.has('recordId')) params.set('recordId', params.get('withdrawalId'));
    params.delete('withdrawalId');
    return `/admin/withdrawals?${params}`;
  }
  return null;
}
