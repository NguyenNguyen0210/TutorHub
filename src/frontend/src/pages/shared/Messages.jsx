import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import chatService, { createChatHubConnection } from '@/services/chat.service';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime, formatRelativeTime } from '@/utils/formatters';
import { useToast } from '@/components/ui/Toast';
import EmptyState from '@/components/common/EmptyState';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import Input from '@/components/ui/Input';
import { Spinner } from '@/components/ui/StatCard';

/** B-14: `SendTyping` tối đa 1 lần / 2s. Trước đây mỗi phím gõ đều invoke hub. */
const TYPING_THROTTLE_MS = 2000;

export default function Messages() {
  const toast = useToast();
  const { user } = useAuthStore();
  const currentUserId = user?.id || user?.userId;

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messagesList, setMessagesList] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState(null);

  const hubConnectionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const lastTypingSentAtRef = useRef(0);

  useEffect(() => {
    let isMounted = true;
    async function loadConversations() {
      try {
        setLoading(true);
        const res = await chatService.getConversations();
        if (isMounted) {
          const items = res?.items || [];
          setConversations(items);
          if (items.length > 0) {
            setActiveConversationId(items[0].id);
          }
        }
      } catch (err) {
        if (isMounted) {
          toast.error(err?.message || 'Không thể tải danh sách cuộc trò chuyện.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadConversations();
    return () => {
      isMounted = false;
    };
  }, [toast]);

  useEffect(() => {
    if (!activeConversationId) return;

    let isMounted = true;

    async function loadMessages() {
      try {
        setLoadingMessages(true);
        const res = await chatService.getMessages(activeConversationId, { pageSize: 50 });
        if (isMounted) {
          setMessagesList(res?.items || []);
          chatService.markConversationAsRead(activeConversationId).catch(() => {});
        }
      } catch (err) {
        if (isMounted) {
          toast.error(err?.message || 'Không tải được tin nhắn.');
        }
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    }

    loadMessages();

    const connection = createChatHubConnection();
    hubConnectionRef.current = connection;

    connection
      .start()
      .then(() => {
        return connection.invoke('JoinConversation', activeConversationId);
      })
      .then(() => {
        connection.on('ReceiveMessage', (newMessage) => {
          if (isMounted && newMessage) {
            setMessagesList((prev) => [...prev, newMessage]);
          }
        });

        connection.on('UserTyping', (convId, typingUserId) => {
          if (isMounted && convId === activeConversationId && typingUserId !== currentUserId) {
            setTypingUser('Đối phương đang nhập...');
            setTimeout(() => {
              if (isMounted) setTypingUser(null);
            }, 3000);
          }
        });
      })
      .catch((err) => {
        console.warn('[SignalR] Không thể kết nối tới ChatHub:', err.message);
      });

    return () => {
      isMounted = false;
      if (connection) {
        connection
          .invoke('LeaveConversation', activeConversationId)
          .catch(() => {})
          .finally(() => {
            connection.stop().catch(() => {});
          });
      }
    };
  }, [activeConversationId, currentUserId, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesList]);

  // Đổi cuộc trò chuyện → nới throttle, nếu không phím gõ đầu tiên ở cuộc trò
  // chuyện mới sẽ bị nuốt vì lần gõ gần nhất cách đây chưa đủ 2 giây.
  useEffect(() => {
    lastTypingSentAtRef.current = 0;
  }, [activeConversationId]);

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversationId || sending) return;

    const content = inputText.trim();
    setInputText('');

    try {
      setSending(true);
      const sentMsg = await chatService.sendMessage(activeConversationId, content);
      setMessagesList((prev) => {
        if (prev.some((m) => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });
    } catch (err) {
      toast.error(err?.message || 'Không thể gửi tin nhắn.');
      setInputText(content);
    } finally {
      setSending(false);
    }
  };

  // B-14 — throttle theo ref: tối đa 1 invoke `SendTyping` mỗi TYPING_THROTTLE_MS.
  const handleTyping = () => {
    const connection = hubConnectionRef.current;
    if (!connection || !activeConversationId) return;

    const now = Date.now();
    if (now - lastTypingSentAtRef.current < TYPING_THROTTLE_MS) return;
    lastTypingSentAtRef.current = now;

    connection.invoke('SendTyping', activeConversationId).catch(() => {});
  };

  return (
    <Card padding="none" className="h-[calc(100vh-140px)] min-h-[600px] overflow-hidden flex flex-col md:flex-row">
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-border flex flex-col bg-neutral-50">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <span className="font-bold text-body-reg text-fg flex items-center gap-2">
            <Icon name="chat" size="sm" className="text-brand-primary-600" />
            Hộp thư trực tuyến
          </span>
          {conversations.length > 0 && (
            <Badge size="sm">{conversations.length} cuộc trò chuyện</Badge>
          )}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {loading ? (
            <div className="p-6 text-center text-fg-muted text-caption space-y-2">
              <Spinner size="md" className="mx-auto" />
              <p>Đang tải danh sách...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon="inbox"
                title="Chưa có cuộc trò chuyện"
                description="Hãy nhắn tin từ hồ sơ gia sư để bắt đầu cuộc trò chuyện đầu tiên."
                className="border-0 shadow-none"
              />
            </div>
          ) : (
            conversations.map((conv) => {
              const otherName = conv.tutorName || conv.studentName || 'Người dùng';
              // B-15: không gọi dịch vụ avatar ngoài. `Avatar` tự fallback về chữ cái đầu
              // khi `src` rỗng hoặc ảnh hỏng — không cần URL giả.
              const otherAvatar = conv.tutorAvatarUrl || conv.studentAvatarUrl || null;
              const isSelected = conv.id === activeConversationId;
              // `unreadCount` là field thật của ConversationDto. Cuộc trò chuyện đang mở
              // đã được `markConversationAsRead` nên không hiện chấm — snapshot danh sách
              // không tự refresh sau khi đọc.
              const unreadCount = Number(conv.unreadCount) || 0;
              const hasUnread = unreadCount > 0 && !isSelected;

              return (
                <button
                  type="button"
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  aria-current={isSelected ? 'true' : undefined}
                  className={cn(
                    'w-full text-left p-4 flex items-center gap-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary-600',
                    isSelected
                      ? 'bg-surface border-l-4 border-brand-primary-600'
                      : 'hover:bg-surface border-l-4 border-transparent'
                  )}
                >
                  <Avatar src={otherAvatar} name={otherName} size="lg" className="rounded-brand-md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 min-w-0 font-bold text-caption text-fg">
                        {hasUnread && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-brand-primary-600 shrink-0"
                            aria-hidden="true"
                          />
                        )}
                        <span className="truncate">{otherName}</span>
                        {hasUnread && (
                          <span className="sr-only">{unreadCount} tin nhắn chưa đọc</span>
                        )}
                      </span>
                      {conv.lastMessageAt && (
                        <time
                          dateTime={conv.lastMessageAt}
                          className="shrink-0 text-[10px] text-fg-muted"
                        >
                          {formatRelativeTime(conv.lastMessageAt)}
                        </time>
                      )}
                    </div>
                    <p className="text-[11px] text-fg-muted truncate mt-0.5 m-0">
                      {conv.lastMessagePreview || 'Bắt đầu cuộc trò chuyện'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-surface min-h-0">
        {activeConv ? (
          <>
            <div className="p-4 border-b border-border flex items-center gap-3">
              <Avatar
                src={activeConv.tutorAvatarUrl || activeConv.studentAvatarUrl || null}
                name={activeConv.tutorName || activeConv.studentName}
                size="md"
                className="rounded-brand-md"
              />
              <div className="min-w-0">
                <h2 className="text-body-reg font-bold text-fg m-0 leading-tight truncate">
                  {activeConv.tutorName || activeConv.studentName || 'Cuộc trò chuyện'}
                </h2>
                {/* SignalR qua HTTPS chỉ mã hoá KÊNH TRUYỀN, không phải mã hoá đầu-cuối —
                    nên không viết "mã hóa bảo mật" và không dùng nền xanh (đọc như huy hiệu
                    "đã xác minh"). */}
                <span className="text-[11px] text-fg-muted flex items-center gap-1.5">
                  <Icon name="shield" size="sm" className="w-3 h-3" />
                  Trao đổi qua kênh bảo mật của TutorHub
                </span>
              </div>
            </div>

            <div
              aria-live="polite"
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-neutral-50/50"
            >
              {loadingMessages ? (
                <div className="text-center py-8 text-caption text-fg-muted space-y-2">
                  <Spinner size="md" className="mx-auto" />
                  <p>Đang tải tin nhắn...</p>
                </div>
              ) : messagesList.length === 0 ? (
                <div className="text-center py-12 text-caption text-fg-muted">
                  Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên!
                </div>
              ) : (
                messagesList.map((msg) => {
                  const isMine = msg.senderUserId === currentUserId;

                  return (
                    <div
                      key={msg.id}
                      className={cn('flex flex-col space-y-1', isMine ? 'items-end' : 'items-start')}
                    >
                      <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[70%]">
                        <div
                          className={cn(
                            'p-3.5 rounded-brand-lg text-caption leading-relaxed shadow-brand-sm',
                            isMine
                              ? 'bg-brand-primary-600 text-white rounded-br-brand-sm'
                              : 'bg-surface border border-border text-fg rounded-bl-brand-sm'
                          )}
                        >
                          <p className="m-0 break-words">{msg.content}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-fg-muted px-1 font-mono">
                        {msg.createdAt ? formatDateTime(msg.createdAt, 'HH:mm') : ''}
                      </span>
                    </div>
                  );
                })
              )}

              {typingUser && (
                <div
                  role="status"
                  aria-live="polite"
                  className="text-[11px] text-fg-muted italic flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                  {typingUser}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-3 sm:p-4 border-t border-border flex items-center gap-2"
            >
              <Input
                type="text"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  handleTyping();
                }}
                placeholder="Nhập tin nhắn..."
                aria-label="Nhập tin nhắn"
                className="flex-1"
              />
              <Button
                type="submit"
                variant="primary"
                disabled={sending || !inputText.trim()}
                loading={sending}
                icon={!sending && <Icon name="send" size="sm" />}
              >
                Gửi
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <EmptyState
              icon="chat"
              title="Chưa chọn cuộc trò chuyện"
              description="Chọn một cuộc trò chuyện từ danh sách bên trái hoặc nhắn tin từ hồ sơ gia sư."
              actionLabel="Khám phá gia sư"
              actionPath="/"
            />
          </div>
        )}
      </div>
    </Card>
  );
}
