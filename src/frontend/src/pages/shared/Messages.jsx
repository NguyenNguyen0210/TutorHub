import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import chatService, { createChatHubConnection } from '@/services/chat.service';
import agreementService from '@/services/agreement.service';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime, formatCurrency } from '@/utils/formatters';
import { message } from 'antd';
import EmptyState from '@/components/common/EmptyState';

export default function Messages() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const currentUserId = user?.id || user?.userId;

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [agreements, setAgreements] = useState([]);
  const [messagesList, setMessagesList] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState(null);

  const hubConnectionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Load conversations list & user agreements
  useEffect(() => {
    let isMounted = true;
    async function loadConversations() {
      try {
        setLoading(true);
        const [res, agrList] = await Promise.allSettled([
          chatService.getConversations(),
          agreementService.getMyAgreements(),
        ]);
        if (isMounted) {
          const items = res.status === 'fulfilled' ? res.value?.items || [] : [];
          setConversations(items);
          if (agrList.status === 'fulfilled') {
            setAgreements(Array.isArray(agrList.value) ? agrList.value : []);
          }
          if (items.length > 0) {
            setActiveConversationId(items[0].id);
          }
        }
      } catch (err) {
        if (isMounted) {
          message.error(err?.message || 'Không thể tải danh sách cuộc trò chuyện.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadConversations();
    return () => {
      isMounted = false;
    };
  }, []);

  // Active conversation change: load messages & wire SignalR
  useEffect(() => {
    if (!activeConversationId) return;

    let isMounted = true;

    async function loadMessages() {
      try {
        setLoadingMessages(true);
        const res = await chatService.getMessages(activeConversationId, { pageSize: 50 });
        if (isMounted) {
          setMessagesList(res?.items || []);
          // Mark as read in background
          chatService.markConversationAsRead(activeConversationId).catch(() => {});
        }
      } catch (err) {
        if (isMounted) {
          message.error(err?.message || 'Không tải được tin nhắn.');
        }
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    }

    loadMessages();

    // Setup SignalR connection
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
  }, [activeConversationId, currentUserId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesList]);

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
        // Prevent duplicate if SignalR echo already arrived
        if (prev.some((m) => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });
    } catch (err) {
      message.error(err?.message || 'Không thể gửi tin nhắn.');
      setInputText(content);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (hubConnectionRef.current && activeConversationId) {
      hubConnectionRef.current.invoke('SendTyping', activeConversationId).catch(() => {});
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] min-h-[600px] rounded-3xl bg-white border border-border-light shadow-xs overflow-hidden flex flex-col md:flex-row">
      {/* Conversations List Sidebar */}
      <div className="w-full md:w-80 border-r border-border-light flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-border-light flex items-center justify-between">
          <span className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-indigo-600 text-lg">chat</span>
            Hộp Thư Trực Tuyến
          </span>
          {conversations.length > 0 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {conversations.length} cuộc trò chuyện
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border-light">
          {loading ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              <span className="material-symbols-outlined animate-spin text-xl block mb-1">sync</span>
              Đang tải danh sách...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">Chưa có cuộc trò chuyện nào.</div>
          ) : (
            conversations.map((conv) => {
              const otherName = conv.tutorName || conv.studentName || 'Người dùng';
              const otherAvatar =
                conv.tutorAvatarUrl ||
                conv.studentAvatarUrl ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherName}`;
              const isSelected = conv.id === activeConversationId;

              return (
                <button
                  type="button"
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`w-full text-left p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-white border-l-4 border-brand-indigo-600 shadow-xs' : 'hover:bg-white'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img src={otherAvatar} alt={otherName} className="w-11 h-11 rounded-2xl object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 truncate">{otherName}</span>
                      {conv.lastMessageAt && (
                        <span className="text-[10px] text-text-muted">
                          {formatDateTime(conv.lastMessageAt, 'HH:mm')}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-muted truncate mt-0.5 m-0">
                      {conv.lastMessagePreview || 'Bắt đầu cuộc trò chuyện'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Stream */}
      <div className="flex-1 flex flex-col bg-white">
        {activeConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border-light flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={
                    activeConv.tutorAvatarUrl ||
                    activeConv.studentAvatarUrl ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeConv.id}`
                  }
                  alt="avatar"
                  className="w-10 h-10 rounded-2xl object-cover"
                />
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 m-0 leading-tight">
                    {activeConv.tutorName || activeConv.studentName || 'Cuộc trò chuyện'}
                  </h3>
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Kênh nhắn tin mã hóa bảo mật
                  </span>
                </div>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/30">
              {loadingMessages ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  <span className="material-symbols-outlined animate-spin text-xl block mb-1">sync</span>
                  Đang tải tin nhắn...
                </div>
              ) : messagesList.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400">
                  Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên!
                </div>
              ) : (
                messagesList.map((msg) => {
                  const isMine = msg.senderUserId === currentUserId;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[70%]">
                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                            isMine
                              ? 'bg-brand-indigo-600 text-white rounded-br-xs'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                          }`}
                        >
                          <p className="m-0 break-words">{msg.content}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 px-1 font-mono">
                        {msg.createdAt ? formatDateTime(msg.createdAt, 'HH:mm') : ''}
                      </span>
                    </div>
                  );
                })
              )}

              {/* Custom Agreement Card: only shown if there is an actual agreement for this conversation */}
              {(() => {
                const activeAgreement = agreements.find(
                  (a) => a.conversationId === activeConv?.id,
                );
                if (!activeAgreement) return null;

                return (
                  <div className="my-3 p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-indigo-50/30 border-2 border-brand-indigo-200 shadow-sm space-y-3 max-w-lg mx-auto">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-brand-indigo-900 font-extrabold text-xs uppercase tracking-wide">
                        <span className="material-symbols-outlined text-brand-indigo-600 text-base">description</span>
                        {activeAgreement.title || 'Hợp Đồng Học Tập Tùy Chỉnh'}
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-indigo-100 text-brand-indigo-800">
                        {activeAgreement.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed m-0">
                      {activeAgreement.description || 'Thỏa thuận đào tạo riêng giữa Gia sư và Học viên.'}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-brand-indigo-100 text-xs">
                      <div>
                        <span className="font-extrabold text-financial-available font-monospace-num text-sm block">
                          {formatCurrency(activeAgreement.totalPrice || 0)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {activeAgreement.totalSessions} buổi ({activeAgreement.sessionDurationMinutes || 60}p/buổi)
                        </span>
                      </div>
                      {activeAgreement.bookingId ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/student/bookings/${activeAgreement.bookingId}/checkout`)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                        >
                          Thanh Toán Giữ Chỗ
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate('/student/dashboard')}
                          className="px-4 py-2 rounded-xl bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
                        >
                          Xem Khóa Học
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {typingUser && (
                <div className="text-[11px] text-slate-400 italic flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                  {typingUser}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-border-light flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  handleTyping();
                }}
                placeholder="Nhập tin nhắn..."
                className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-brand-indigo-500 outline-none"
              />
              <button
                type="submit"
                disabled={sending || !inputText.trim()}
                className="px-5 py-2.5 rounded-2xl bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">send</span>
                Gửi
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <EmptyState
              icon="chat"
              title="Chưa chọn cuộc trò chuyện"
              description="Chọn một cuộc trò chuyện từ danh sách bên trái hoặc nhắn tin từ hồ sơ gia sư."
              actionLabel="Khám phá gia sư"
              actionPath="/tutors"
            />
          </div>
        )}
      </div>
    </div>
  );
}
