/** Only recognized video sources are embedded. Legacy meeting links stay external. */
export function trialLessonMedia(value) {
  if (!value?.trim()) return null;
  let url;
  try { url = new URL(value.trim()); } catch { return null; }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  let id;
  if (host === 'youtu.be') id = url.pathname.split('/')[1];
  if (['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)) id = url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
  if (id && /^[\w-]{11}$/.test(id)) return { kind: 'video', href: url.href, embed: `https://www.youtube-nocookie.com/embed/${id}` };
  if (['vimeo.com', 'player.vimeo.com'].includes(host)) {
    const vimeoId = url.pathname.match(/^\/(?:video\/)?(\d+)\/?$/)?.[1];
    if (vimeoId) return { kind: 'video', href: url.href, embed: `https://player.vimeo.com/video/${vimeoId}` };
  }
  if (/\.(?:mp4|webm|ogg)$/i.test(url.pathname)) return { kind: 'video', href: url.href, direct: true };
  const meeting = host === 'meet.google.com' || host === 'zoom.us' || host.endsWith('.zoom.us') || host === 'teams.microsoft.com';
  return { kind: meeting ? 'meeting' : 'link', href: url.href };
}

export function validImageLink(value) {
  if (!value?.trim()) return true;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password; } catch { return false; }
}
