import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Checkbox, Alert, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';

export default function Register() {
  const navigate = useNavigate();
  const { registerWithCredentials } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onFinish = async (values) => {
    setLoading(true);
    setError(null);

    try {
      const result = await registerWithCredentials(
        values.email,
        values.password,
        values.fullName,
        values.phone,
        'Student'
      );

      if (result.success) {
        message.success('Dang ky tai khoan thanh cong! Chao mung ' + result.user.name);
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Dang ky that bai. Vui long thu lai.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Dang Ky Tai Khoan Hoc Vien
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Tim gia su chat luong cao & duoc bao chung hoc phi 100% qua Escrow
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

      <Form name="registerForm" layout="vertical" onFinish={onFinish} size="large">
        <Form.Item
          name="fullName"
          label={<span className="text-xs font-bold text-slate-700 uppercase">Ho va Ten</span>}
          rules={[{ required: true, message: 'Vui long nhap ho ten!' }]}
        >
          <Input prefix={<UserOutlined className="text-slate-400" />} placeholder="Nguyen Van A" className="rounded-xl text-xs" autoComplete="name" />
        </Form.Item>

        <Form.Item
          name="email"
          label={<span className="text-xs font-bold text-slate-700 uppercase">Email</span>}
          rules={[{ required: true, message: 'Vui long nhap email!' }, { type: 'email', message: 'Email khong hop le!' }]}
        >
          <Input prefix={<MailOutlined className="text-slate-400" />} placeholder="student@example.com" className="rounded-xl text-xs" autoComplete="email" />
        </Form.Item>

        <Form.Item
          name="phone"
          label={<span className="text-xs font-bold text-slate-700 uppercase">So Dien Thoai</span>}
          rules={[{ required: true, message: 'Vui long nhap so dien thoai!' }]}
        >
          <Input prefix={<PhoneOutlined className="text-slate-400" />} placeholder="0912345678" className="rounded-xl text-xs" autoComplete="tel" />
        </Form.Item>

        <Form.Item
          name="password"
          label={<span className="text-xs font-bold text-slate-700 uppercase">Mat Khau</span>}
          rules={[
            { required: true, message: 'Vui long nhap mat khau!' },
            { min: 6, message: 'Mat khau toi thieu 6 ky tu!' },
          ]}
        >
          <Input.Password prefix={<LockOutlined className="text-slate-400" />} placeholder="••••••••" className="rounded-xl text-xs" autoComplete="new-password" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label={<span className="text-xs font-bold text-slate-700 uppercase">Xac Nhan Mat Khau</span>}
          dependencies={['password']}
          rules={[
            { required: true, message: 'Vui long xac nhan mat khau!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) return Promise.resolve();
                return Promise.reject(new Error('Mat khau xac nhan khong khop!'));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined className="text-slate-400" />} placeholder="••••••••" className="rounded-xl text-xs" autoComplete="new-password" />
        </Form.Item>

        <Form.Item
          name="agreement"
          valuePropName="checked"
          rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('Vui long dong y dieu khoan!')) }]}
        >
          <Checkbox className="text-xs text-slate-600">
            Toi dong y voi <a href="#" className="text-indigo-600">Dieu khoan su dung</a> va cam ket bao chung Escrow cua TutorHub.
          </Checkbox>
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          block
          loading={loading}
          className="h-11 rounded-xl bg-indigo-600 font-bold text-sm shadow-md shadow-indigo-600/25 hover:bg-indigo-500"
        >
          Tao Tai Khoan & Bat Dau Hoc
        </Button>
      </Form>

      <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
        Da co tai khoan?{' '}
        <Link to="/auth/login" className="font-bold text-indigo-600 hover:underline">
          Dang nhap tai day
        </Link>
      </div>
    </div>
  );
}