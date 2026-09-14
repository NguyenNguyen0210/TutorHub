import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Checkbox, Divider, Alert, Tag, message } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  ThunderboltFilled,
  SafetyCertificateFilled,
  ArrowRightOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import { TEST_ACCOUNTS } from '../../config/constants';

export default function Login() {
  const navigate = useNavigate();
  const { login, switchTestAccount } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const onFinish = (values) => {
    setLoading(true);
    setTimeout(() => {
      // Tìm tài khoản phù hợp hoặc tạo user thường
      const found = TEST_ACCOUNTS.find((a) => a.email === values.email);
      const user = found || {
        id: 'usr-custom-001',
        name: values.email.split('@')[0],
        fullName: values.email.split('@')[0],
        email: values.email,
        role: 'Student',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
        status: 'Active',
      };

      login(user, { accessToken: 'mock-jwt-token-123', refreshToken: 'mock-refresh-token-456' });
      setLoading(false);
      message.success(`Đăng nhập thành công! Chào mừng ${user.name || user.fullName}`);

      // Điều hướng theo vai trò
      if (user.role === 'Admin') navigate('/admin/dashboard');
      else if (user.role === 'Tutor') navigate('/tutor/dashboard');
      else navigate('/student/dashboard');
    }, 400);
  };

  const handleQuickLogin = (account) => {
    switchTestAccount(account.email);
    message.success(`Đã chuyển sang tài khoản: ${account.name} (${account.role})`);
    if (account.role === 'Admin') navigate('/admin/dashboard');
    else if (account.role === 'Tutor') navigate('/tutor/dashboard');
    else navigate('/student/dashboard');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Đăng Nhập Tài Khoản
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Truy cập hệ thống học tập & quản trị bảo chứng Escrow TutorHub
        </p>
      </div>

      {/* 1-CLICK TEST ACCOUNT SWITCHER BOX */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-900">
            <ThunderboltFilled className="text-amber-500" /> Chọn Nhanh Tài Khoản Thử Nghiệm
          </span>
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
            1-Click Login
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {TEST_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => handleQuickLogin(acc)}
              className="flex flex-col items-start rounded-xl border border-slate-200 bg-white p-2.5 text-left transition-all hover:border-indigo-500 hover:shadow-xs cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-xs text-slate-800 line-clamp-1">{acc.name}</span>
                <Tag
                  color={acc.role === 'Admin' ? 'red' : acc.role === 'Tutor' ? 'blue' : 'green'}
                  className="m-0 text-[9px] font-bold px-1 py-0 leading-tight"
                >
                  {acc.role}
                </Tag>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">{acc.label}</span>
            </button>
          ))}
        </div>
      </div>

      <Divider className="text-xs text-slate-400 my-4">Hoặc Đăng Nhập Thủ Công</Divider>

      {/* LOGIN FORM */}
      <Form
        name="loginForm"
        layout="vertical"
        initialValues={{ remember: true, email: 'student.tuan@tutorhub.com', password: 'Test@123' }}
        onFinish={onFinish}
        size="large"
      >
        <Form.Item
          name="email"
          label={<span className="text-xs font-bold text-slate-700 uppercase">Email</span>}
          rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}
        >
          <Input
            prefix={<UserOutlined className="text-slate-400" />}
            placeholder="name@example.com"
            className="rounded-xl text-xs"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={<span className="text-xs font-bold text-slate-700 uppercase">Mật Khẩu</span>}
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-slate-400" />}
            placeholder="••••••••"
            className="rounded-xl text-xs"
          />
        </Form.Item>

        <div className="flex items-center justify-between text-xs mb-4">
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox className="text-xs text-slate-600">Ghi nhớ đăng nhập</Checkbox>
          </Form.Item>
          <a href="#" className="text-indigo-600 hover:underline">Quên mật khẩu?</a>
        </div>

        <Button
          type="primary"
          htmlType="submit"
          block
          loading={loading}
          className="h-11 rounded-xl bg-indigo-600 font-bold text-sm shadow-md shadow-indigo-600/25 hover:bg-indigo-500"
        >
          Đăng Nhập Vào Hệ Thống
        </Button>
      </Form>

      {/* FOOTER */}
      <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
        Chưa có tài khoản học viên?{' '}
        <Link to="/auth/register" className="font-bold text-indigo-600 hover:underline">
          Đăng ký miễn phí ngay
        </Link>
        <div className="mt-2">
          Bạn là chuyên gia / giáo viên?{' '}
          <Link to="/tutor/application" className="font-bold text-emerald-600 hover:underline">
            Đăng ký làm Gia sư tại đây →
          </Link>
        </div>
      </div>
    </div>
  );
}
