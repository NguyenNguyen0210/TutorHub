import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Button, Badge, Avatar, Tag, Tooltip, message } from 'antd';
import { 
  SendOutlined, 
  VideoCameraOutlined, 
  PaperClipOutlined, 
  SmileOutlined, 
  CheckCircleFilled, 
  ClockCircleOutlined,
  SafetyCertificateFilled,
  ArrowRightOutlined,
  PhoneOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import chatService from '../../services/chat.service';
import { formatVND } from '../../utils/formatters';

export default function Messages() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState('conv_001');
  const [messagesList, setMessagesList] = useState([]);
  const [inputText, setInputText] = useState('');
  const [telemetryActive, setTelemetryActive] = useState(false);

  useEffect(() => {
    chatService.getConversations().then(data => {
      setConversations(data);
    });
  }, []);

  useEffect(() => {
    if (activeConvId) {
      chatService.getMessages(activeConvId).then(msgs => {
        setMessagesList(msgs);
      });
    }
  }, [activeConvId]);

  const activeConv = conversations.find(c => c.id === activeConvId) || conversations[0];

  const handleSend = () => {
    if (!inputText.trim()) return;
    chatService.sendMessage(activeConvId, inputText).then(newMsg => {
      setMessagesList(prev => [...prev, newMsg]);
      setInputText('');
    });
  };

  const handleStartMeet = () => {
    setTelemetryActive(true);
    message.success('Đã kết nối phòng học Google Meet với hệ thống Telemetry điểm danh tự động của sàn!');
    window.open(activeConv?.meetUrl || 'https://meet.google.com/abc-defg-hij', '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Telemetry Alert Banner */}
      {telemetryActive && (
        <div className="mb-4 bg-emerald-950/80 border border-emerald-500/40 rounded-xl p-3 px-4 flex items-center justify-between text-xs text-emerald-300 backdrop-blur-md animate-fade-in">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold text-emerald-200">Google Meet Telemetry Đang Hoạt Động:</span>
            <span>Hệ thống tự động ghi nhận nhật ký tham gia của 2 bên để bảo vệ quyền lợi Escrow.</span>
          </div>
          <Button size="small" className="text-xs bg-emerald-800/60 text-emerald-100 border-emerald-500/40" onClick={() => setTelemetryActive(false)}>
            Ẩn Thông Báo
          </Button>
        </div>
      )}

      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl grid grid-cols-1 md:grid-cols-12 h-[calc(100vh-140px)] min-h-[620px]">
        
        {/* Left Sidebar: Conversations List */}
        <div className="md:col-span-4 border-r border-slate-800 flex flex-col bg-slate-950/50">
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Hộp Thư Chat
                <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-0.5 rounded-full border border-indigo-500/30">
                  SignalR Live
                </span>
              </h2>
              <p className="text-xs text-slate-400">Kết nối trực tiếp Gia sư & Học viên</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 p-2 space-y-1">
            {conversations.map(conv => {
              const isActive = conv.id === activeConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`p-3 rounded-xl cursor-pointer transition-all flex items-start space-x-3 ${
                    isActive 
                      ? 'bg-indigo-600/20 border border-indigo-500/30 text-white' 
                      : 'hover:bg-slate-800/50 text-slate-300'
                  }`}
                >
                  <div className="relative">
                    <Avatar src={conv.user.avatar} size={44} className="border border-slate-700" />
                    {conv.user.status === 'online' && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-xs text-slate-100 truncate">{conv.user.name}</h4>
                      <span className="text-[10px] text-slate-500">{conv.lastTime}</span>
                    </div>
                    <p className="text-[11px] text-indigo-400 truncate mb-1">{conv.user.subject}</p>
                    <p className="text-[11px] text-slate-400 truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Chat Window & Agreement */}
        <div className="md:col-span-8 flex flex-col bg-slate-900/60">
          
          {/* Header */}
          {activeConv && (
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 backdrop-blur-md">
              <div className="flex items-center space-x-3">
                <Avatar src={activeConv.user.avatar} size={42} />
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {activeConv.user.name}
                    <Tag color={activeConv.user.role === 'Tutor' ? 'cyan' : activeConv.user.role === 'Admin' ? 'gold' : 'purple'}>
                      {activeConv.user.role === 'Tutor' ? 'Gia Sư Xác Thực' : activeConv.user.role === 'Admin' ? 'Trọng Tài Sàn' : 'Học Viên'}
                    </Tag>
                  </h3>
                  <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    <span>Sẵn sàng giảng dạy • Phản hồi trong 5 phút</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Tooltip title="Mở phòng Google Meet bảo chứng có telemetry">
                  <Button 
                    type="primary" 
                    icon={<VideoCameraOutlined />} 
                    onClick={handleStartMeet}
                    className="bg-emerald-600 hover:bg-emerald-500 border-none font-medium text-xs flex items-center shadow-lg shadow-emerald-900/30"
                  >
                    Vào Google Meet
                  </Button>
                </Tooltip>
              </div>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="text-center my-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/50">
                Cuộc trò chuyện bảo mật mã hóa end-to-end
              </span>
            </div>

            {messagesList.map((msg) => {
              return (
                <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center space-x-1 mb-1 px-1">
                    <span className="text-[10px] text-slate-400">{msg.senderName}</span>
                    <span className="text-[10px] text-slate-500">• {msg.time}</span>
                  </div>

                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-md ${
                    msg.isMe 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>

                  {/* If this message contains a Custom Agreement Card */}
                  {msg.type === 'AGREEMENT' && activeConv?.customAgreement && (
                    <div className="mt-3 max-w-[460px] w-full bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-purple-950/80 border-2 border-indigo-500/60 rounded-2xl p-4 shadow-xl text-slate-200">
                      <div className="flex items-center justify-between pb-3 border-b border-indigo-500/30">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">📜</span>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Đề Xuất Hợp Đồng Riêng</span>
                            <h4 className="text-xs font-bold text-white">{activeConv.customAgreement.title}</h4>
                          </div>
                        </div>
                        <Tag color="warning" className="text-[10px] font-bold m-0">CHỜ THANH TOÁN</Tag>
                      </div>

                      <p className="text-[11px] text-slate-300 mt-2.5 leading-relaxed">
                        {activeConv.customAgreement.description}
                      </p>

                      <div className="grid grid-cols-2 gap-2 my-3 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px]">
                        <div>
                          <span className="text-slate-400">Số buổi học:</span>
                          <p className="font-bold text-white">{activeConv.customAgreement.sessionsCount} buổi (60p/buổi)</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Đơn giá:</span>
                          <p className="font-bold text-white">{formatVND(activeConv.customAgreement.pricePerSession)}/buổi</p>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-slate-800 flex justify-between items-center">
                          <span className="text-slate-300 font-semibold">Tổng Ký Quỹ Escrow:</span>
                          <span className="text-sm font-extrabold text-amber-400">{formatVND(activeConv.customAgreement.totalAmount)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-emerald-400 bg-emerald-950/50 p-2 rounded-lg border border-emerald-500/30 mb-3">
                        <span className="flex items-center gap-1">
                          <SafetyCertificateFilled /> Tiền được giữ an toàn tại TutorHub Escrow
                        </span>
                        <span>Hoàn tiền nếu hủy</span>
                      </div>

                      <Button
                        type="primary"
                        block
                        icon={<ArrowRightOutlined />}
                        onClick={() => navigate(`/student/bookings/${activeConv.customAgreement.bookingId}/checkout`)}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border-none font-bold text-xs h-9 shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-1"
                      >
                        1-Click Checkout Ký Quỹ ({formatVND(activeConv.customAgreement.totalAmount)})
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/60 backdrop-blur-md">
            <div className="flex items-center space-x-2">
              <Tooltip title="Đính kèm tài liệu học tập">
                <Button shape="circle" icon={<PaperClipOutlined />} className="border-slate-700 bg-slate-800 text-slate-300 hover:text-white" />
              </Tooltip>
              <Input
                placeholder="Nhập tin nhắn trao đổi hoặc yêu cầu gia sư tùy chỉnh lộ trình..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onPressEnter={handleSend}
                className="bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500 rounded-xl text-xs py-2"
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                className="bg-indigo-600 hover:bg-indigo-500 border-none font-semibold text-xs px-4 h-9 rounded-xl flex items-center"
              >
                Gửi
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-500">
              <span>Nhấn Enter để gửi tin nhắn</span>
              <span className="text-indigo-400 hover:underline cursor-pointer">
                💡 Bạn có thể đề xuất gia sư tạo gói hợp đồng riêng phù hợp với ngân sách
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
