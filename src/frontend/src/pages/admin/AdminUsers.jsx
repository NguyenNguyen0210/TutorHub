import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Input, Select, Modal, message, Avatar } from 'antd';
import { 
  UserOutlined, 
  SearchOutlined, 
  WarningOutlined, 
  StopOutlined, 
  CheckCircleOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import adminService from '../../services/admin.service';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState(null);
  const [strikeModalVisible, setStrikeModalVisible] = useState(false);

  useEffect(() => {
    adminService.getUsers().then(setUsers);
  }, []);

  const handleUpdateStrike = (userId, delta, reason) => {
    adminService.updateUserStrike(userId, delta, reason).then((updated) => {
      message.success(`Đã cập nhật Strike cho ${updated.name}: Hiện có ${updated.strikes}/3 Strikes`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, strikes: updated.strikes, status: updated.status } : u));
      setStrikeModalVisible(false);
    });
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchText.toLowerCase()) || u.email.toLowerCase().includes(searchText.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <UserOutlined className="text-indigo-400" />
            Quản Lý Người Dùng & Kỷ Luật Vi Phạm Sàn
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi Absent Strikes (Quy tắc 2 Strikes tạm ngưng đặt lịch, 3 Strikes khóa vĩnh viễn)
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl mb-6 shadow-xl flex flex-col sm:flex-row gap-3">
        <Input
          prefix={<SearchOutlined className="text-slate-500" />}
          placeholder="Tìm theo tên học viên, gia sư, email hoặc số điện thoại..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="bg-slate-950 border-slate-700 text-slate-200 text-xs sm:w-80"
        />
        <Select
          value={roleFilter}
          onChange={setRoleFilter}
          className="sm:w-48 text-xs"
          options={[
            { label: 'Tất Cả Vai Trò', value: 'ALL' },
            { label: 'Học Viên (Student)', value: 'Student' },
            { label: 'Gia Sư (Tutor)', value: 'Tutor' },
          ]}
        />
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
        <Table
          dataSource={filteredUsers}
          rowKey="id"
          pagination={{ pageSize: 8 }}
          className="admin-dark-table"
          columns={[
            {
              title: 'Thành Viên',
              key: 'user',
              render: (_, record) => (
                <div className="flex items-center space-x-3">
                  <Avatar size={40} className="bg-indigo-600 font-bold">
                    {record.name.charAt(0)}
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-xs text-white">{record.name}</h4>
                    <p className="text-[11px] text-slate-400">{record.email}</p>
                    <span className="text-[10px] text-slate-500">{record.phone}</span>
                  </div>
                </div>
              )
            },
            {
              title: 'Vai Trò',
              dataIndex: 'role',
              key: 'role',
              render: (r) => (
                <Tag color={r === 'Tutor' ? 'cyan' : 'purple'} className="font-semibold text-xs">
                  {r === 'Tutor' ? 'Gia Sư' : 'Học Viên'}
                </Tag>
              )
            },
            {
              title: 'Absent Strikes Vi Phạm',
              key: 'strikes',
              render: (_, record) => {
                const s = record.strikes;
                return (
                  <div>
                    <div className="flex items-center space-x-1 mb-1">
                      <span className={`text-xs font-black ${
                        s === 0 ? 'text-emerald-400' : s === 1 ? 'text-amber-400' : s === 2 ? 'text-orange-500' : 'text-rose-500'
                      }`}>
                        {s}/3 Strikes
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      {[1, 2, 3].map(step => (
                        <div
                          key={step}
                          className={`w-5 h-1.5 rounded-full ${
                            step <= s ? (s >= 2 ? 'bg-rose-500' : 'bg-amber-400') : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                );
              }
            },
            {
              title: 'Trạng Thái Tài Khoản',
              dataIndex: 'status',
              key: 'status',
              render: (st) => {
                if (st === 'ACTIVE') return <Tag color="green">HOẠT ĐỘNG</Tag>;
                if (st === 'WARNED') return <Tag color="gold">CẢNH CÁO</Tag>;
                if (st === 'SUSPENDED_7D') return <Tag color="volcano">TẠM KHÓA 7 NGÀY</Tag>;
                return <Tag color="red">ĐÃ KHÓA VĨNH VIỄN</Tag>;
              }
            },
            {
              title: 'Hành Động',
              key: 'actions',
              render: (_, record) => (
                <div className="flex items-center space-x-2">
                  <Button
                    size="small"
                    onClick={() => {
                      setSelectedUser(record);
                      setStrikeModalVisible(true);
                    }}
                    className="bg-slate-800 text-amber-400 border-amber-500/30 text-xs font-semibold"
                  >
                    Điều Chỉnh Kỷ Luật
                  </Button>
                </div>
              )
            }
          ]}
        />
      </div>

      {/* Adjust Strike Modal */}
      {selectedUser && (
        <Modal
          title={<span className="text-white font-bold">Điều Chỉnh Strike Kỷ Luật: {selectedUser.name}</span>}
          open={strikeModalVisible}
          onCancel={() => setStrikeModalVisible(false)}
          footer={null}
        >
          <div className="py-4 space-y-4 text-xs text-slate-300">
            <p>
              Hiện tại tài khoản đang có <span className="font-bold text-amber-400">{selectedUser.strikes}/3 Strikes</span> vi phạm vắng mặt không lý do.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Button
                danger
                icon={<WarningOutlined />}
                onClick={() => handleUpdateStrike(selectedUser.id, 1, 'Admin phạt thêm 1 Strike do tái phạm vắng mặt')}
                className="font-semibold text-xs h-10"
              >
                +1 Phạt Thêm Strike
              </Button>

              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleUpdateStrike(selectedUser.id, -1, 'Admin ân xá giảm 1 Strike')}
                className="bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs h-10"
              >
                -1 Ân Xá / Giảm Strike
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
