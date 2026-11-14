import { useEffect, useState } from 'react';
import notificationService from '@/services/notification.service';
import chatService from '@/services/chat.service';
import { WORKSPACE_ACTIVITY_CHANGED } from '@/utils/workspaceActivity';

// A single snapshot feeds both navigation surfaces. No inferred or sample counts.
export function useWorkspaceActivity(userId, pathname) {
  const [snapshot, setSnapshot] = useState({ userId: null, notifications: 0, conversations: 0 });

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    let running = false;
    let queued = false;
    let notificationVersion = 0;
    async function refresh() {
      if (document.hidden || cancelled) return;
      if (running) { queued = true; return; }
      running = true;
      const version = notificationVersion;
      const results = await Promise.allSettled([
        notificationService.getUnreadCount(),
        (async () => {
          const unreadIds = new Set();
          const seenCursors = new Set();
          let cursor;
          do {
            const page = await chatService.getConversations({ cursor, pageSize: 50 });
            page.items.forEach(item => { if (item.unreadCount > 0) unreadIds.add(item.id); });
            if (!page.hasMore || !page.nextCursor || seenCursors.has(page.nextCursor) || cancelled) break;
            cursor = page.nextCursor;
            seenCursors.add(cursor);
          } while (!cancelled);
          return unreadIds.size;
        })(),
      ]);
      if (!cancelled) {
        setSnapshot(previous => ({
          userId,
          notifications: version === notificationVersion && results[0].status === 'fulfilled' ? results[0].value : previous.userId === userId ? previous.notifications : 0,
          conversations: results[1].status === 'fulfilled' ? results[1].value : previous.userId === userId ? previous.conversations : 0,
        }));
      }
      running = false;
      if (queued && !cancelled) { queued = false; refresh(); }
    }
    refresh();
    const activityChanged = event => {
      const count = event.detail?.unreadNotifications;
      if (event.detail?.userId === userId && Number.isInteger(count) && count >= 0) {
        notificationVersion++;
        setSnapshot(previous => ({
          userId, notifications: count,
          conversations: previous.userId === userId ? previous.conversations : 0,
        }));
      }
      refresh();
    };
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    window.addEventListener(WORKSPACE_ACTIVITY_CHANGED, activityChanged);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      window.removeEventListener(WORKSPACE_ACTIVITY_CHANGED, activityChanged);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [userId, pathname]);

  return snapshot.userId === userId ? snapshot : { notifications: 0, conversations: 0 };
}
