import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Checkbox, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, SafetyCertificateFilled } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const onFinish = (values) => {
    setLoading(true);
    setTimeout(() => {
      const newUser = {
        id: 'usr-new-' + Date.now(),
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        role: 'Student',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + values.fullName,
        status: 'Active',
      };
      login(newUser, { accessToken: 'jwt-reg-token', refreshToken: 'jwt-ref-token' });
      setLoading(false);
      message.success('Đăng ký tài khoản học viên thành công! Chào mừng ' + newUser.fullName);
      navigate('/student/dashboard');
    }, 400);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Đăng Ký Tài Khoản Học Viên
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Tìm gia sư chất lượng cao & được bảo chứng học phí 100% qua Escrow
        </p>
      </div>

      <Form name="registerForm" layout="vertical" onFinish={onFinish} size="large">
        <Form.Item
          name="fullName"
          label={<span className="text-xs font-bold text-slate-700 uppercase">Họ và Tên</span>}
          rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
        >
          <Input prefix={<UserOutlined className="text-slate-400" />} placeholder="Nguyễn Văn A" className="rounded-xl text-xs" />
        </Form.Item>

        <Form.Item
          name="email"
          label={<span className="text-xs font-bold text-slate-700 uppercase">Email</span>}
          rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}
        >
          <Input prefix={<MailOutlined className="text-slate-400" />} placeholder="student@example.com" className="rounded-xl text-xs" />
        </Form.Item>

        <Form.Item
          name="phone"
          label={<span className="text-xs font-bold text-slate-700 uppercase">Số Điện Thoại</span>}
          rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
        >
          <Input prefix={<PhoneOutlined className="text-slate-400" />} placeholder="0912345678" className="rounded-xl text-xs" />
        </Form.Item>

        <Form.Item
          name="password"
          label={<span className="text-xs font-bold text-slate-700 uppercase">Mật Khẩu</span>}
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }, { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự!' }]}
        >
          <Input.Password prefix={<LockOutlined className="text-slate-400" />} placeholder="••••••••" className="rounded-xl text-xs" />
        </Form.Item>

        <Form.Item
          name="agreement"
          valuePropName="checked"
          rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('Vui lòng đồng ý điều khoản!')) }]}
        >
          <Checkbox className="text-xs text-slate-600">
            Tôi đồng ý với <a href="#" className="text-brand-indigo-600">Điều khoản sử dụng</a> và cam kết bảo chứng Escrow của TutorHub.
          </Checkbox>
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          block
          loading={loading}
          className="h-11 rounded-xl bg-brand-indigo-600 font-bold text-sm shadow-md shadow-brand-indigo-600/25 hover:bg-brand-indigo-500"
        >
          Tạo Tài Khoản & Bắt Đầu Học
        </Button>
      </Form>

      <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
        Đã có tài khoản?{' '}
        <Link to="/auth/login" className="font-bold text-brand-indigo-600 hover:underline">
          Đăng nhập tại đây
        </Link>
      </div>
    </div>
  );
}
