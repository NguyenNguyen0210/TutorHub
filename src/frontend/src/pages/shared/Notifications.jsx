import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tabs, Tag, Button, List, Empty, Tooltip, message } from 'antd';
import { 
  BellOutlined, 
  DollarCircleOutlined, 
  CalendarOutlined, 
  ExclamationCircleOutlined, 
  CheckCircleOutlined,
  ArrowRightOutlined,
  ReadOutlined
} from '@ant-design/icons';
import notificationService from '../../services/notification.service';

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    notificationService.getNotifications().then(data => {
      setNotifications(data);
    });
  }, []);

  const handleMarkRead = (id) => {
    notificationService.markAsRead(id).then(() => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      message.success('Đã đánh dấu đã đọc');
    });
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead().then(() => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      message.success('Đã đánh dấu tất cả là đã đọc');
    });
  };

  const filteredNotifs = notifications.filter(n => {
    if (activeTab === 'all') return true;
    return n.category === activeTab;
  });

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'escrow':
        return <Tag color="green" icon={<DollarCircleOutlined />}>Tài Chính Escrow</Tag>;
      case 'session':
        return <Tag color="blue" icon={<CalendarOutlined />}>Lịch Học & Điểm Danh</Tag>;
      case 'dispute':
        return <Tag color="red" icon={<ExclamationCircleOutlined />}>Tranh Chấp</Tag>;
      default:
        return <Tag color="default">Hệ Thống</Tag>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <BellOutlined className="text-indigo-500" />
            Trung Tâm Thông Báo Đa Kênh
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi dòng tiền Escrow, lời nhắc điểm danh 24h và quyết định trọng tài phân xử
          </p>
        </div>
        <Button 
          icon={<CheckCircleOutlined />} 
          onClick={handleMarkAllRead}
          className="text-xs font-semibold bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
        >
          Đánh Dấu Tất Cả Đã Đọc
        </Button>
      </div>

      {/* Tabs */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'all', label: `Tất Cả (${notifications.length})` },
            { key: 'escrow', label: `Tài Chính Escrow (${notifications.filter(n => n.category === 'escrow').length})` },
            { key: 'session', label: `Lịch & Điểm Danh (${notifications.filter(n => n.category === 'session').length})` },
            { key: 'dispute', label: `Tranh Chấp (${notifications.filter(n => n.category === 'dispute').length})` },
          ]}
        />

        <List
          itemLayout="vertical"
          dataSource={filteredNotifs}
          locale={{ emptyText: <Empty description="Không có thông báo nào trong mục này" /> }}
          renderItem={(item) => (
            <div
              key={item.id}
              className={`p-4 mb-3 rounded-xl border transition-all ${
                item.read
                  ? 'bg-slate-900/40 border-slate-800/60 opacity-80'
                  : 'bg-slate-800/70 border-indigo-500/40 shadow-lg shadow-indigo-950/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1.5 flex-wrap gap-y-1">
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    )}
                    {getCategoryBadge(item.category)}
                    {item.priority === 'URGENT' && (
                      <Tag color="volcano" className="text-[10px] font-bold uppercase">Khẩn Cấp</Tag>
                    )}
                    <span className="text-[11px] text-slate-400">{item.timestamp}</span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-1">{item.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">{item.message}</p>

                  <div className="flex items-center space-x-3">
                    {item.actionLabel && (
                      <Button
                        type="primary"
                        size="small"
                        icon={<ArrowRightOutlined />}
                        onClick={() => navigate(item.actionUrl)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold flex items-center"
                      >
                        {item.actionLabel}
                      </Button>
                    )}
                    {!item.read && (
                      <Button
                        size="small"
                        type="text"
                        onClick={() => handleMarkRead(item.id)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Đã đọc
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
