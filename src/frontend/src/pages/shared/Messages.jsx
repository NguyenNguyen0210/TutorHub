import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/utils/formatters';
import { message } from 'antd';

export default function Messages() {
  const navigate = useNavigate();
  const [activeChat, setActiveChat] = useState('tut-001');
  const [inputText, setInputText] = useState('');
  const [messagesList, setMessagesList] = useState([
    { id: 'm1', sender: 'tutor', text: 'Chào Tuấn, thầy đã nhận được đăng ký gói 10 buổi của em!', time: '14:20' },
    { id: 'm2', sender: 'student', text: 'Dạ vâng thầy ơi, tối thứ 2 tuần này mình học buổi đầu tiên đúng không ạ?', time: '14:22' },
    { id: 'm3', sender: 'tutor', text: 'Đúng rồi em, thầy có gửi thêm đề xuất gói học bổ trợ 5 buổi trọng tâm bên dưới nhé:', time: '14:25' },
  ]);

  const customOffer = {
    title: 'Đề Xuất Hợp Đồng Học Tập Tùy Chỉnh (Custom Agreement)',
    desc: 'Học viên Tuấn muốn học tăng cường 5 buổi tối, tập trung chuyên đề Hàm Số & Tích Phân 9+.',
    sessions: '5 buổi x 60 phút',
    mode: 'Trực Tuyến (Online)',
    price: 1000000,
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setMessagesList((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: 'student', text: inputText, time: 'Vừa xong' }
    ]);
    setInputText('');
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
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border-light">
          {/* Chat Item 1 */}
          <div
            onClick={() => setActiveChat('tut-001')}
            className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${
              activeChat === 'tut-001' ? 'bg-white border-l-4 border-brand-indigo-600' : 'hover:bg-white'
            }`}
          >
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                alt="ThS. Nguyễn Văn An"
                className="w-11 h-11 rounded-2xl object-cover"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 truncate">ThS. Nguyễn Văn An</span>
                <span className="text-[10px] text-text-muted">14:25</span>
              </div>
              <p className="text-[11px] text-text-muted truncate mt-0.5">Thầy có gửi thêm đề xuất gói học...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Stream */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <div className="p-4 border-b border-border-light flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                alt="ThS. Nguyễn Văn An"
                className="w-10 h-10 rounded-2xl object-cover"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-slate-900">ThS. Nguyễn Văn An</span>
                <span className="material-symbols-outlined text-financial-available text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold">Đang hoạt động • Gia sư Toán THPT</span>
            </div>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messagesList.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender === 'student' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md p-3.5 rounded-2xl text-xs space-y-1 shadow-xs ${
                  m.sender === 'student'
                    ? 'bg-brand-indigo-600 text-white rounded-br-none'
                    : 'bg-slate-100 text-slate-900 rounded-bl-none'
                }`}
              >
                <p className="leading-relaxed">{m.text}</p>
                <span className={`text-[9px] block text-right ${m.sender === 'student' ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {m.time}
                </span>
              </div>
            </div>
          ))}

          {/* Embedded Custom Agreement Offer Card */}
          <div className="max-w-md mx-auto p-5 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-brand-indigo-50/50 to-white border-2 border-brand-indigo-500 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-indigo-600 text-white text-[10px] font-extrabold uppercase">
                Hợp Đồng Đề Xuất Riêng
              </span>
              <span className="text-financial-available font-bold text-xs font-monospace-num">
                {formatCurrency(customOffer.price)}
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900">{customOffer.title}</h4>
            <p className="text-[11px] text-slate-600 leading-normal">{customOffer.desc}</p>
            <div className="text-[11px] text-brand-indigo-800 font-semibold space-y-0.5">
              <p>• Quy cách: {customOffer.sessions}</p>
              <p>• Hình thức: {customOffer.mode}</p>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => navigate('/student/bookings/BK-CUSTOM-001/checkout')}
                className="flex-1 py-2.5 rounded-xl bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                Chấp Nhận & Mua Ngay
              </button>
              <button
                type="button"
                onClick={() => message.info('Đã từ chối đề xuất hợp đồng')}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
              >
                Từ Chối
              </button>
            </div>
          </div>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-border-light flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Nhập tin nhắn trao đổi với gia sư..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-border-light text-xs text-slate-900 focus:ring-2 focus:ring-brand-indigo-500 outline-hidden"
          />
          <button
            type="submit"
            className="w-10 h-10 rounded-xl bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white flex items-center justify-center shrink-0 transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-lg">send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
