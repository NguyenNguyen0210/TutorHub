import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { externalAuthService } from '@/services/externalAuth.service';
import { getPostAuthDestination } from '@/services/authRedirect.service';
import AuthHeader from '@/components/layout/AuthHeader';

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
      setErrorMsg('Không thể hoàn tất đăng nhập bằng Google. Vui lòng quay lại trang đăng nhập để thử lại.');
      return;
    }
    (async () => {
      try {
        const authResponse = await externalAuthService.completeGoogleCallback(code, state);
        const { user } = await loginWithExternal(authResponse);
        const storageKey = `tutorhub_oauth_return:${state}`;
        const returnUrl = sessionStorage.getItem(storageKey);
        sessionStorage.removeItem(storageKey);
        const destination = await getPostAuthDestination(user.role, returnUrl);
        if (useAuthStore.getState().isAuthenticated) navigate(destination, { replace: true });
      } catch {
        setErrorMsg('Không thể hoàn tất đăng nhập bằng Google. Vui lòng quay lại trang đăng nhập để thử lại.');
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
