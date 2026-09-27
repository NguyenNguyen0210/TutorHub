import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { externalAuthService } from '@/services/externalAuth.service';
import tutorService from '@/services/tutor.service';
import AuthHeader from '@/components/layout/AuthHeader';

function roleHome(role) {
  if (role === 'Admin') return '/admin/dashboard';
  if (role === 'Tutor') return '/tutor/dashboard';
  return '/student/dashboard';
}

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginWithExternal = useAuthStore((s) => s.loginWithExternal);
  const [errorMsg, setErrorMsg] = useState('');
  const onceRef = useRef(false);

  useEffect(() => {
    if (onceRef.current) return;
    onceRef.current = true;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const providerError = searchParams.get('error');
    if (providerError || !code || !state) {
      setErrorMsg('Liên kết đăng nhập thiếu code hoặc đã hết hạn. Hãy bấm đăng nhập Google lại từ trang đăng nhập.');
      return;
    }
    (async () => {
      try {
        const authResponse = await externalAuthService.completeGoogleCallback(code, state);
        const { user } = await loginWithExternal(authResponse);
        if (user.role === 'Tutor') {
          try {
            const app = await tutorService.getMyTutorApplication();
            if (!app) {
              navigate('/tutor/application', { replace: true });
              return;
            }
          } catch {
            // fallback to dashboard if API fails (same as Login.jsx)
          }
        }
        navigate(roleHome(user.role), { replace: true });
      } catch (err) {
        setErrorMsg(err?.message || 'Đăng nhập Google thất bại. Link có thể đã hết hạn hoặc đã dùng — hãy bắt đầu lại.');
      }
    })();
  }, [searchParams, loginWithExternal, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-fg">
      <AuthHeader mode="login" />
      <main className="flex-1 flex items-center justify-center px-6 pb-10">
        <div className="w-full max-w-md rounded-[10px] border border-border bg-white p-6 text-center">
          {!errorMsg ? (
            <>
              <span className="inline-block w-6 h-6 border-2 border-brand-primary-600 border-t-transparent rounded-full animate-spin" aria-label="Đang xử lý" />
              <p className="mt-3 text-[13px] text-fg-secondary">Đang hoàn tất đăng nhập Google…</p>
            </>
          ) : (
            <>
              <p className="text-[13px] text-danger-strong font-medium">{errorMsg}</p>
              <Link to="/auth/login" className="inline-block mt-4 text-brand-primary-600 font-bold text-[13px] hover:underline">
                Quay về đăng nhập
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
