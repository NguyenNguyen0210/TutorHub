import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Form, Input, Button, Checkbox, Alert, message } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithCredentials } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const from = location.state?.from?.pathname || null;

  const onFinish = async (values) => {
    setLoading(true);
    setError(null);

    try {
      const result = await loginWithCredentials(values.email, values.password);

      if (result.success) {
        message.success(`Dang nhap thanh cong! Chao mung ${result.user.name}`);

        // Redirect to previous page or role-based dashboard
        if (from) {
          navigate(from, { replace: true });
        } else if (result.user.role === 'Admin') {
          navigate('/admin/dashboard');
        } else if (result.user.role === 'Tutor') {
          navigate('/tutor/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      }
    } catch (err) {
      setError(err.message || 'Email hoac mat khau khong dung. Vui long thu lai.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Dang Nhap Tai Khoan
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Truy cap he thong hoc tap & quan tri bao chung Escrow TutorHub
        </p>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          className="rounded-xl"
        />
      )}

      {from && (
        <Alert
          message="Ban can dang nhap de truy cap trang nay."
          type="info"
          showIcon
          className="rounded-xl"
        />
      )}

      {/* LOGIN FORM */}
      <Form
        name="loginForm"
        layout="vertical"
        initialValues={{ remember: true }}
        onFinish={onFinish}
        size="large"
      >
        <Form.Item
          name="email"
          label={<span className="text-xs font-bold text-slate-700 uppercase">Email</span>}
          rules={[
            { required: true, message: 'Vui long nhap email!' },
            { type: 'email', message: 'Email khong hop le!' },
          ]}
        >
          <Input
            prefix={<UserOutlined className="text-slate-400" />}
            placeholder="name@example.com"
            className="rounded-xl text-xs"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={<span className="text-xs font-bold text-slate-700 uppercase">Mat Khau</span>}
          rules={[{ required: true, message: 'Vui long nhap mat khau!' }]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-slate-400" />}
            placeholder="••••••••"
            className="rounded-xl text-xs"
            autoComplete="current-password"
          />
        </Form.Item>

        <div className="flex items-center justify-between text-xs mb-4">
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox className="text-xs text-slate-600">Ghi nho dang nhap</Checkbox>
          </Form.Item>
          <a href="#" className="text-indigo-600 hover:underline">Quen mat khau?</a>
        </div>

        <Button
          type="primary"
          htmlType="submit"
          block
          loading={loading}
          className="h-11 rounded-xl bg-indigo-600 font-bold text-sm shadow-md shadow-indigo-600/25 hover:bg-indigo-500"
        >
          Dang Nhap Vao He Thong
        </Button>
      </Form>

      {/* FOOTER */}
      <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
        Chua co tai khoan hoc vien?{' '}
        <Link to="/auth/register" className="font-bold text-indigo-600 hover:underline">
          Dang ky mien phi ngay
        </Link>
        <div className="mt-2">
          Ban la chuyen gia / giao vien?{' '}
          <Link to="/tutor/application" className="font-bold text-emerald-600 hover:underline">
            Dang ky lam Gia su tai day &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}