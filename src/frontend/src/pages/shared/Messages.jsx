import { userFacingError } from '@/utils/userFacingError';
import React, { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/cn';
import chatService, { createChatHubConnection } from '@/services/chat.service';
import enrollmentService from '@/services/enrollment.service';
import tutorService from '@/services/tutor.service';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime, formatRelativeTime } from '@/utils/formatters';
import { notifyWorkspaceActivityChanged } from '@/utils/workspaceActivity';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import Input, { Textarea } from '@/components/ui/Input';
import ChatAttachment, { ChatFilePreview } from '@/components/common/ChatAttachment';
import { CHAT_FILE_ACCEPT, validateChatFile, chatAttachmentPayload } from '@/utils/chatAttachment';

const TYPING_THROTTLE_MS = 2000;
const normalizeSearch = text => String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
const sortMessages = items => [...new Map(items.map(item => [item.id, item])).values()]
  .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')) || String(a.id).localeCompare(String(b.id)));

function ConversationSkeleton() {
  return <div role="status" aria-label="Đang tải hội thoại" className="space-y-5 p-4">
    {[0, 1, 2, 3].map(key => <div key={key} className="flex items-center gap-3" aria-hidden="true"><div className="h-10 w-10 shrink-0 rounded-full bg-neutral-200 motion-safe:animate-pulse" /><div className="flex-1 space-y-2"><div className="h-4 w-2/3 rounded bg-neutral-200 motion-safe:animate-pulse" /><div className="h-3 rounded bg-neutral-100 motion-safe:animate-pulse" /></div></div>)}
  </div>;
}

function MessageSkeleton() {
  return <div role="status" aria-label="Đang tải tin nhắn" className="space-y-5 p-5">
    {[0, 1, 2, 3].map(key => <div key={key} aria-hidden="true" className={cn('h-14 w-2/3 rounded-2xl bg-neutral-100 motion-safe:animate-pulse', key % 2 && 'ml-auto bg-brand-primary-50')} />)}
  </div>;
}

export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeConversationId = searchParams.get('conversationId');
  const { user } = useAuthStore();
  const currentUserId = user?.id || user?.userId;
  const isStudent = user?.role === 'Student';
  const dashboardPath = user?.role === 'Tutor' ? '/tutor/dashboard' : user?.role === 'Admin' ? '/admin/dashboard' : '/student/dashboard';
  const queryClient = useQueryClient();
  const conversationKey = useMemo(() => ['chat', 'conversations', currentUserId], [currentUserId]);
  const messageKey = useMemo(() => ['chat', 'messages', currentUserId, activeConversationId], [currentUserId, activeConversationId]);
  const [search, setSearch] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [files, setFiles] = useState({});
  const uploadedFiles = useRef(new WeakMap());
  const fileInput = useRef(null);
  const [sendErrors, setSendErrors] = useState({});
  const [typing, setTyping] = useState(false);
  const [contactError, setContactError] = useState(null);
  const scrollRef = useRef(null);
  const scrollRestore = useRef(null);
  const scrollToBottom = useRef(true);
  const hubRef = useRef(null);
  const typingTimer = useRef(null);
  const lastTypingAt = useRef(0);
  const currentConversationRef = useRef(activeConversationId);
  const targetUserId = searchParams.get('userId');
  const targetTutorId = searchParams.get('tutorId');
  const contactQuery = useQuery({
    queryKey: ['chat', 'contact', currentUserId, targetUserId, targetTutorId],
    enabled: Boolean(currentUserId && !activeConversationId && (targetUserId || targetTutorId)),
    retry: false,
    staleTime: Infinity,
    queryFn: async () => {
      const target = targetUserId || (await tutorService.getTutorById(targetTutorId))?.userId;
      if (!target || target === currentUserId) throw new Error('Invalid contact');
      return chatService.getOrCreateConversation(target);
    },
  });
  useEffect(() => {
    if (activeConversationId || !contactQuery.data?.id || (!targetUserId && !targetTutorId)) return;
    const conv = contactQuery.data;
    queryClient.setQueryData(['chat', 'conversation', currentUserId, conv.id], conv);
    setSearchParams({ conversationId: conv.id }, { replace: true });
  }, [activeConversationId, contactQuery.data, currentUserId, queryClient, setSearchParams, targetUserId, targetTutorId]);

  const conversationQuery = useQuery({
    queryKey: conversationKey,
    enabled: Boolean(currentUserId),
    queryFn: async () => {
      const items = [];
      const seen = new Set();
      let cursor;
      do {
        const page = await chatService.getConversations({ cursor, pageSize: 50 });
        items.push(...page.items);
        if (!page.hasMore || !page.nextCursor || seen.has(page.nextCursor)) break;
        cursor = page.nextCursor;
        seen.add(cursor);
      } while (cursor);
      return [...new Map(items.map(item => [item.id, item])).values()];
    },
    refetchInterval: 30000,
  });
  const conversations = (conversationQuery.data || []).filter(item => item.lastMessageId);
  const listedConversation = conversations.find(item => item.id === activeConversationId);
  // An empty composer is opened independently from the inbox, so opening a
  // contact never adds a blank conversation to either participant's list.
  const requestedConversationQuery = useQuery({
    queryKey: ['chat', 'conversation', currentUserId, activeConversationId],
    enabled: Boolean(currentUserId && activeConversationId && !listedConversation),
    queryFn: () => chatService.getConversation(activeConversationId),
    retry: false,
  });
  const activeConv = listedConversation || requestedConversationQuery.data;
  const hasActiveConversation = Boolean(activeConv);
  const waitingForRequested = activeConversationId && !activeConv && requestedConversationQuery.isLoading;
  const hasConversations = conversations.length > 0;
  const otherPerson = conv => {
    const otherIsStudent = conv.tutorUserId === currentUserId || user?.role === 'Tutor';
    return {
      name: (otherIsStudent ? conv.studentName : conv.tutorName) || 'Người dùng',
      avatar: otherIsStudent ? conv.studentAvatarUrl : conv.tutorAvatarUrl,
      role: otherIsStudent ? 'Học viên' : 'Gia sư',
    };
  };
  const activePerson = activeConv ? otherPerson(activeConv) : null;

  const messageQuery = useInfiniteQuery({
    queryKey: messageKey,
    enabled: Boolean(activeConv),
    initialPageParam: null,
    queryFn: ({ pageParam }) => chatService.getMessages(activeConversationId, { cursor: pageParam, pageSize: 50 }),
    getNextPageParam: page => page.hasMore ? page.nextCursor : undefined,
    refetchInterval: 30000,
  });
  const messages = useMemo(() => sortMessages(messageQuery.data?.pages.flatMap(page => page.items) || []), [messageQuery.data]);

  useEffect(() => {
    if (!activeConversationId || !hasActiveConversation || !messageQuery.isSuccess) return undefined;
    let cancelled = false;
    const markRead = () => {
      if (document.hidden) return;
      chatService.markConversationAsRead(activeConversationId).then(() => {
        if (!cancelled) queryClient.setQueryData(conversationKey, previous => previous?.map(conv => conv.id === activeConversationId ? { ...conv, unreadCount: 0 } : conv));
      }).catch(() => {});
    };
    markRead();
    window.addEventListener('focus', markRead);
    document.addEventListener('visibilitychange', markRead);
    return () => { cancelled = true; window.removeEventListener('focus', markRead); document.removeEventListener('visibilitychange', markRead); };
  }, [activeConversationId, hasActiveConversation, messageQuery.isSuccess, messageQuery.dataUpdatedAt, queryClient, conversationKey]);

  const updateConversation = (message) => {
    queryClient.setQueryData(conversationKey, previous => {
      const items = previous || [];
      const source = items.some(conv => conv.id === message.conversationId) || activeConv?.id !== message.conversationId
        ? items : [...items, activeConv];
      return source.map(conv =>
      conv.id === message.conversationId && (!conv.lastMessageAt || String(message.createdAt) >= String(conv.lastMessageAt))
        ? { ...conv, lastMessageId: message.id, lastMessageAt: message.createdAt, lastMessagePreview: message.content || message.attachmentName || '', unreadCount: document.hidden ? conv.unreadCount : 0 }
        : conv);
    });
  };

  useEffect(() => {
    setTyping(false);
    lastTypingAt.current = 0;
    if (!hasActiveConversation) return undefined;
    let cancelled = false;
    const connection = createChatHubConnection();
    hubRef.current = connection;
    const receive = message => {
      if (cancelled || message?.conversationId !== activeConversationId) return;
      queryClient.setQueryData(messageKey, previous => previous ? {
        ...previous, pages: previous.pages.map((page, index) => index === 0
          ? { ...page, items: sortMessages([...page.items, message]) } : page),
      } : previous);
      queryClient.setQueryData(conversationKey, previous => previous?.map(conv => {
        if (conv.id !== activeConversationId || (conv.lastMessageAt && String(message.createdAt) < String(conv.lastMessageAt))) return conv;
        const unread = conv.unreadCount + (conv.lastMessageId !== message.id && message.senderUserId !== currentUserId ? 1 : 0);
        return {
          ...conv, lastMessageId: message.id, lastMessageAt: message.createdAt,
          lastMessagePreview: message.content || message.attachmentName || '',
          unreadCount: document.hidden ? unread : 0,
        };
      }));
      queryClient.invalidateQueries({ queryKey: conversationKey });
      if (document.hidden) notifyWorkspaceActivityChanged();
    };
    connection.on('ReceiveMessage', receive);
    connection.on('UserTyping', (convId, senderId) => {
      if (cancelled || convId !== activeConversationId || senderId === currentUserId) return;
      setTyping(true);
      window.clearTimeout(typingTimer.current);
      typingTimer.current = window.setTimeout(() => { if (!cancelled) setTyping(false); }, 3000);
    });
    connection.onreconnected(() => {
      connection.invoke('JoinConversation', activeConversationId).then(() => {
        if (!cancelled) queryClient.invalidateQueries({ queryKey: messageKey });
      }).catch(() => {});
    });
    connection.start().then(() => {
      if (cancelled) return connection.stop();
      return connection.invoke('JoinConversation', activeConversationId);
    }).catch(() => {});
    return () => {
      cancelled = true;
      window.clearTimeout(typingTimer.current);
      if (hubRef.current === connection) hubRef.current = null;
      connection.stop().catch(() => {});
    };
  }, [activeConversationId, hasActiveConversation, currentUserId, queryClient, conversationKey, messageKey]);

  useLayoutEffect(() => { currentConversationRef.current = activeConversationId; scrollToBottom.current = true; scrollRestore.current = null; }, [activeConversationId]);
  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    if (scrollRestore.current) {
      const previous = scrollRestore.current;
      element.scrollTop = element.scrollHeight - previous.height + previous.top;
      scrollRestore.current = null;
    } else if (scrollToBottom.current) element.scrollTop = element.scrollHeight;
  }, [messages, activeConversationId, typing]);

  const sendMutation = useMutation({
    mutationFn: async ({ conversationId, content, file }) => {
      let attachment = null;
      if (file) {
        const cached = uploadedFiles.current.get(file);
        attachment = cached?.conversationId === conversationId ? cached.attachment : chatAttachmentPayload(await chatService.uploadAttachment(conversationId, file));
        uploadedFiles.current.set(file, { conversationId, attachment });
      }
      return chatService.sendMessage(conversationId, content, attachment);
    },
    onSuccess: (message, { conversationId, draft, file }) => {
      queryClient.setQueryData(['chat', 'messages', currentUserId, conversationId], previous => previous ? {
        ...previous, pages: previous.pages.map((page, index) => index === 0 ? { ...page, items: sortMessages([...page.items, message]) } : page),
      } : previous);
      updateConversation(message);
      queryClient.invalidateQueries({ queryKey: conversationKey });
      setDrafts(previous => previous[conversationId] === draft ? { ...previous, [conversationId]: '' } : previous);
      setFiles(previous => previous[conversationId] === file ? { ...previous, [conversationId]: null } : previous);
      setSendErrors(previous => ({ ...previous, [conversationId]: null }));
      notifyWorkspaceActivityChanged();
    },
    onError: (_err, { conversationId }) => setSendErrors(previous => ({
      ...previous, [conversationId]: 'Chưa gửi được tin nhắn. Vui lòng thử lại.',
    })),
  });
  const draft = drafts[activeConversationId] || '';
  const file = files[activeConversationId];
  const sendingHere = sendMutation.isPending && sendMutation.variables?.conversationId === activeConversationId;
  const sendError = sendErrors[activeConversationId];
  const send = event => {
    event?.preventDefault();
    if ((!draft.trim() && !file) || !activeConv || sendMutation.isPending || messageQuery.isPending || (messageQuery.isError && !messageQuery.data)) return;
    scrollToBottom.current = true;
    sendMutation.mutate({ conversationId: activeConversationId, content: draft.trim(), draft, file });
  };
  const select = id => {
    setSearchParams(previous => { const next = new URLSearchParams(previous); if (id) next.set('conversationId', id); else next.delete('conversationId'); return next; });
  };

  const enrollmentQuery = useQuery({
    queryKey: ['chat', 'contact-enrollments', currentUserId],
    enabled: isStudent && conversationQuery.isSuccess && !hasConversations,
    queryFn: () => enrollmentService.getAllMyEnrollments(),
  });
  const activeEnrollments = enrollmentQuery.data?.items.filter(item => item.status === 'Active') || [];
  const tutorUserIds = [...new Set(activeEnrollments.map(item => item.tutorUserId).filter(Boolean))];
  const contactMutation = useMutation({
    mutationFn: () => chatService.getOrCreateConversation(tutorUserIds[0]),
    onSuccess: conv => {
      queryClient.setQueryData(['chat', 'conversation', currentUserId, conv.id], conv);
      setContactError(null);
      select(conv.id);
    },
    onError: err => setContactError(userFacingError(err, 'Chưa mở được cuộc trò chuyện. Vui lòng thử lại.')),
  });

  const welcome = (noConversations) => (
    <div className="mx-auto flex max-w-md flex-col items-center px-5 py-10 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary-50 text-primary"><Icon name="chat" size="xl" /></span>
      <h2 className="text-headline-3 font-semibold text-fg">{noConversations ? isStudent ? 'Bắt đầu kết nối với gia sư' : 'Kết nối với học viên của bạn' : 'Chọn một cuộc trò chuyện'}</h2>
      <p className="mt-3 text-body-reg leading-relaxed text-fg-secondary">{noConversations ? isStudent ? 'Trao đổi về khóa học, thống nhất lịch học và giải đáp những câu hỏi của bạn.' : 'Các cuộc trò chuyện với học viên sẽ xuất hiện tại đây khi hai bên bắt đầu liên hệ.' : 'Chọn hội thoại từ danh sách để xem và gửi tin nhắn.'}</p>
      {noConversations && isStudent && (
        <div className="mt-6">
          {tutorUserIds.length === 1 ? <Button onClick={() => contactMutation.mutate()} loading={contactMutation.isPending} icon={<Icon name="chat" size="sm" />}>Liên hệ gia sư của tôi</Button>
            : <Button as={Link} to={activeEnrollments.length ? '/student/dashboard' : '/tutors'}>{activeEnrollments.length ? 'Xem lớp học của tôi' : 'Khám phá gia sư'}</Button>}
          {contactError && <p role="alert" className="mt-3 text-caption text-danger-strong">{contactError}</p>}
        </div>
      )}
    </div>
  );
  const unreadCount = conversations.filter(conv => conv.unreadCount > 0).length;
  const filteredConversations = conversations.filter(conv => (!unreadOnly || conv.unreadCount > 0) && normalizeSearch(otherPerson(conv).name).includes(normalizeSearch(search.trim())))
    .sort((a, b) => String(b.lastMessageAt || b.createdAt).localeCompare(String(a.lastMessageAt || a.createdAt)));

  if (!activeConversationId && (targetUserId || targetTutorId)) {
    return <Card padding="lg" variant="outlined" className="mx-auto max-w-lg rounded-2xl">
      {contactQuery.isError ? <><h1 className="text-headline-3 text-fg">Chưa mở được cuộc trò chuyện</h1><p className="mt-3 text-body-reg text-fg-secondary">Không thể liên hệ tài khoản này lúc này. Bạn có thể thử lại hoặc quay về danh sách tin nhắn.</p><div className="mt-5 flex flex-wrap gap-3"><Button onClick={() => contactQuery.refetch()} loading={contactQuery.isFetching}>Thử lại</Button><Button variant="outline" onClick={() => setSearchParams({})}>Về tin nhắn</Button></div></>
        : <div role="status" className="text-body-reg text-fg-secondary">Đang mở cuộc trò chuyện…</div>}
    </Card>;
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-4">
      <nav aria-label="Đường dẫn tin nhắn" className="text-caption text-fg-secondary"><ol className="flex items-center gap-2"><li><Link to={dashboardPath} className="hover:text-primary focus-visible:underline">{isStudent ? 'Bàn học' : 'Bảng điều hành'}</Link></li><li aria-hidden="true">/</li><li aria-current="page" className="font-medium text-fg">Tin nhắn</li></ol></nav>
      <h1 className="text-headline-page text-fg">Tin nhắn</h1>
      <Card padding="none" variant="outlined" className="flex h-[calc(100dvh-300px)] min-h-[280px] max-h-[900px] overflow-hidden rounded-2xl lg:h-[calc(100dvh-176px)]">
        <aside aria-label="Danh sách hội thoại" className={cn('w-full min-h-0 shrink-0 flex-col border-border bg-surface md:flex md:w-80 md:border-r', activeConversationId ? 'hidden' : 'flex')}>
          <div className="space-y-4 border-b border-border p-4">
            <div className="flex items-center justify-between gap-2"><h2 className="font-semibold text-fg">Hội thoại</h2>{hasConversations && <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-caption tabular-nums text-fg-secondary">{conversations.length}</span>}</div>
            <div className="relative"><Icon name="search" size="sm" className="pointer-events-none absolute left-3 top-3.5 text-fg-secondary" /><Input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm hội thoại…" aria-label="Tìm hội thoại theo tên" className="pl-9" /></div>
            <div className="flex gap-2" role="group" aria-label="Lọc hội thoại">
              {[false, true].map(value => <button type="button" key={String(value)} aria-pressed={unreadOnly === value} onClick={() => setUnreadOnly(value)} className={cn('inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-caption font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', unreadOnly === value ? 'bg-brand-primary-50 text-brand-primary-700' : 'text-fg-secondary hover:bg-neutral-100')}>{value ? 'Chưa đọc' : 'Tất cả'}{value && unreadCount > 0 && <span className="tabular-nums">{unreadCount}</span>}</button>)}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {conversationQuery.isLoading ? <ConversationSkeleton /> : conversationQuery.isError && !hasConversations ? <div className="p-5"><p className="text-body-reg text-fg-secondary">Chưa tải được danh sách hội thoại.</p><Button variant="outline" className="mt-4" onClick={() => conversationQuery.refetch()} loading={conversationQuery.isFetching}>Thử lại</Button></div>
              : !hasConversations ? <><p className="hidden px-4 py-6 text-caption text-fg-secondary md:block">Chưa có hội thoại.</p><div className="md:hidden">{welcome(true)}</div></>
              : filteredConversations.length === 0 ? <div className="p-5 text-body-reg text-fg-secondary"><p>{search.trim() ? 'Không tìm thấy hội thoại phù hợp.' : 'Không có hội thoại chưa đọc.'}</p><button type="button" onClick={() => { setSearch(''); setUnreadOnly(false); }} className="mt-3 min-h-11 rounded font-medium text-primary focus-visible:ring-2 focus-visible:ring-ring">Hiện tất cả hội thoại</button></div>
              : <ul>{filteredConversations.map(conv => {
                const person = otherPerson(conv);
                const selected = conv.id === activeConversationId;
                const unread = Number(conv.unreadCount) || 0;
                return <li key={conv.id}><button type="button" onClick={() => select(conv.id)} aria-current={selected ? 'true' : undefined} className={cn('flex w-full items-center gap-3 border-l-2 px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring', selected ? 'border-primary bg-brand-primary-50' : 'border-transparent hover:bg-neutral-50')}>
                  <Avatar key={person.avatar || person.name} src={person.avatar} name={person.name} />
                  <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-body-reg font-semibold text-fg">{person.name}</span>{conv.lastMessageAt && <time dateTime={conv.lastMessageAt} title={formatDateTime(conv.lastMessageAt)} className="shrink-0 text-[11px] text-fg-secondary">{formatRelativeTime(conv.lastMessageAt)}</time>}</span><span className="mt-1 flex items-center gap-2"><span className={cn('flex-1 truncate text-caption', unread > 0 ? 'font-semibold text-fg' : 'text-fg-secondary')}>{conv.lastMessagePreview || 'Chưa có tin nhắn'}</span>{unread > 0 && <span aria-label={`${unread} tin nhắn chưa đọc`} className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-white">{unread > 99 ? '99+' : unread}</span>}</span></span>
                </button></li>;
              })}</ul>}
          </div>
          {conversationQuery.isError && hasConversations && <button type="button" onClick={() => conversationQuery.refetch()} className="border-t border-border p-3 text-caption text-primary">Chưa cập nhật được hội thoại · Thử lại</button>}
        </aside>

        <section aria-label="Nội dung trò chuyện" className={cn('min-h-0 min-w-0 flex-1 flex-col bg-surface md:flex', activeConversationId ? 'flex' : 'hidden')}>
          {activeConv ? <>
            <header className="flex shrink-0 items-center gap-3 border-b border-border p-4">
              <button type="button" onClick={() => select(null)} aria-label="Quay lại danh sách hội thoại" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-fg-secondary hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-ring md:hidden"><Icon name="arrow_back" size="md" /></button>
              <Avatar key={activePerson.avatar || activePerson.name} src={activePerson.avatar} name={activePerson.name} />
              <div className="min-w-0 flex-1"><h2 className="truncate text-body-reg font-semibold text-fg">{activePerson.name}</h2><p className="mt-1 text-caption text-fg-secondary">{activePerson.role}</p></div>
              {isStudent && activeConv.tutorProfileId && <Link to={`/tutors/${activeConv.tutorProfileId}`} className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-2 text-caption font-medium text-primary hover:bg-brand-primary-50 focus-visible:ring-2 focus-visible:ring-ring">Xem hồ sơ</Link>}
            </header>
            <div ref={scrollRef} onScroll={() => { const el = scrollRef.current; scrollToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120; }} className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-neutral-50/60">
              {messageQuery.isPending ? <MessageSkeleton /> : messageQuery.isError && !messageQuery.data ? <div className="p-6 text-center"><p className="text-body-reg text-fg-secondary">Chưa tải được tin nhắn.</p><Button variant="outline" className="mt-4" onClick={() => messageQuery.refetch()} loading={messageQuery.isFetching}>Thử lại</Button></div>
                : <div className="space-y-4 p-4 sm:p-6">
                  {messageQuery.hasNextPage && <div className="text-center"><Button size="sm" variant="outline" loading={messageQuery.isFetchingNextPage} disabled={messageQuery.isFetching && !messageQuery.isFetchingNextPage} onClick={async () => {
                    const el = scrollRef.current;
                    const previous = { height: el.scrollHeight, top: el.scrollTop };
                    const result = await messageQuery.fetchNextPage();
                    if (result.isError || currentConversationRef.current !== activeConversationId) return;
                    scrollRestore.current = previous;
                    // React may commit the query update before this promise resolves.
                    requestAnimationFrame(() => { if (scrollRef.current && scrollRestore.current === previous && currentConversationRef.current === activeConversationId) { scrollRef.current.scrollTop = scrollRef.current.scrollHeight - previous.height + previous.top; scrollRestore.current = null; } });
                  }}>Xem tin nhắn trước</Button></div>}
                  {messageQuery.isError && <p className="text-center text-caption text-danger-strong">Chưa cập nhật được tin nhắn. <button type="button" onClick={() => messageQuery.refetch()} className="min-h-11 rounded px-2 font-semibold underline focus-visible:ring-2 focus-visible:ring-ring">Thử lại</button></p>}
                  {messages.length === 0 && <p className="py-12 text-center text-body-reg leading-relaxed text-fg-secondary">Chưa có tin nhắn. Gửi lời chào để bắt đầu trao đổi.</p>}
                  {messages.map((message, index) => {
                    const mine = message.senderUserId === currentUserId;
                    const date = formatDateTime(message.createdAt, 'DD/MM/YYYY');
                    const showDate = date && (index === 0 || date !== formatDateTime(messages[index - 1].createdAt, 'DD/MM/YYYY'));
                    return <React.Fragment key={message.id}>
                      {showDate && <p className="py-2 text-center text-[11px] text-fg-secondary">{date}</p>}
                      <div className={cn('flex flex-col gap-1', mine ? 'items-end' : 'items-start')}>
                        <div className={cn('max-w-[90%] rounded-2xl px-4 py-3 text-body-reg leading-relaxed sm:max-w-[80%]', mine ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md border border-border bg-surface text-fg')}>
                          {message.content && <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.content}</p>}
                          {message.attachmentName && message.attachmentKey && <ChatAttachment message={message} />}
                        </div>
                        {message.createdAt && <time dateTime={message.createdAt} title={formatDateTime(message.createdAt)} className="px-1 text-[11px] text-fg-secondary">{formatDateTime(message.createdAt, 'HH:mm')}</time>}
                      </div>
                    </React.Fragment>;
                  })}
                  {typing && <p role="status" className="text-caption text-fg-secondary">{activePerson.name} đang nhập…</p>}
                </div>}
            </div>
            <form onSubmit={send} className="shrink-0 space-y-3 border-t border-border p-3 sm:p-4">
              {file && <ChatFilePreview file={file} disabled={sendingHere} onRemove={() => setFiles(previous => ({ ...previous, [activeConversationId]: null }))} />}
              <input ref={fileInput} type="file" accept={CHAT_FILE_ACCEPT} disabled={sendMutation.isPending} className="sr-only" aria-label="Chọn tệp đính kèm" onChange={event => {
                const selected = event.target.files?.[0]; event.target.value = '';
                if (!selected) return;
                const error = validateChatFile(selected);
                setSendErrors(previous => ({ ...previous, [activeConversationId]: error }));
                if (!error) setFiles(previous => ({ ...previous, [activeConversationId]: selected }));
              }} />
              {sendError && <div role="alert" className="rounded-lg bg-danger-subtle p-3 text-caption text-danger-strong"><p>{sendError}</p><p className="mt-1">Nội dung tin nhắn vẫn được giữ lại bên dưới.</p></div>}
              <div className="flex items-end gap-2">
                <button type="button" disabled={sendMutation.isPending} onClick={() => fileInput.current?.click()} aria-label="Đính kèm tệp" title="JPG, PNG, WEBP, GIF, PDF hoặc TXT; tối đa 10 MB" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-fg-secondary hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-ring"><Icon name="attach_file" size="sm" /></button>
                <Textarea value={draft} rows={2} maxLength={4000} disabled={sendingHere || messageQuery.isPending || (messageQuery.isError && !messageQuery.data)}
                  onChange={event => {
                    const value = event.target.value;
                    setDrafts(previous => ({ ...previous, [activeConversationId]: value }));
                    setSendErrors(previous => ({ ...previous, [activeConversationId]: null }));
                    const connection = hubRef.current;
                    if (connection?.state === 'Connected' && Date.now() - lastTypingAt.current >= TYPING_THROTTLE_MS) {
                      lastTypingAt.current = Date.now();
                      connection.invoke('SendTyping', activeConversationId).catch(() => {});
                    }
                  }}
                  onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); } }}
                  placeholder="Nhập tin nhắn…" aria-label={`Nhập tin nhắn cho ${activePerson.name}`} className="min-h-11 flex-1 resize-none" />
                <Button type="submit" disabled={sendMutation.isPending || (!draft.trim() && !file) || messageQuery.isPending || (messageQuery.isError && !messageQuery.data)} loading={sendingHere} icon={<Icon name="send" size="sm" />}>{sendingHere ? 'Đang gửi…' : sendError ? 'Thử gửi lại' : 'Gửi'}</Button>
              </div>
              <p className="hidden text-[11px] text-fg-secondary sm:block">Enter để gửi · Shift + Enter để xuống dòng</p>
            </form>
          </> : conversationQuery.isLoading || waitingForRequested ? <div className="p-6"><MessageSkeleton /></div>
            : activeConversationId && requestedConversationQuery.isError && requestedConversationQuery.error?.status !== 404 ? <div className="flex flex-1 items-center justify-center p-8 text-center"><div><h2 className="text-headline-3 text-fg">Chưa mở được cuộc trò chuyện</h2><p className="mt-3 text-body-reg text-fg-secondary">Vui lòng thử lại để tiếp tục nhắn tin.</p><Button variant="outline" className="mt-5" onClick={() => requestedConversationQuery.refetch()} loading={requestedConversationQuery.isFetching}>Thử lại</Button></div></div>
            : conversationQuery.isError && !hasConversations ? <div className="flex flex-1 items-center justify-center p-8 text-center"><div><h2 className="text-headline-3 text-fg">Chưa tải được hội thoại</h2><p className="mt-3 text-body-reg text-fg-secondary">Thử tải lại danh sách để tiếp tục nhắn tin.</p><Button variant="outline" className="mt-5" onClick={() => conversationQuery.refetch()} loading={conversationQuery.isFetching}>Thử lại</Button></div></div>
            : activeConversationId && !activeConv ? <div className="flex flex-1 items-center justify-center p-8 text-center"><div><h2 className="text-headline-3 text-fg">Không tìm thấy hội thoại</h2><p className="mt-3 text-body-reg text-fg-secondary">Cuộc trò chuyện không còn khả dụng hoặc bạn chưa có quyền truy cập.</p><Button variant="outline" className="mt-5" onClick={() => select(null)}>Về danh sách hội thoại</Button></div></div>
            : <div className="flex flex-1 items-center justify-center">{welcome(!hasConversations)}</div>}
        </section>
      </Card>
    </div>
  );
}
