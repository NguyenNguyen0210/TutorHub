# Google Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kích hoạt đăng nhập Google end-to-end (backend đã có, `.env` đã điền): vá `docker-compose.yml`, thêm service + callback page + nối nút Google ở Login/Register.

**Architecture:** Không sửa backend C# (chỉ compose env-forward). Frontend thêm 1 service (`externalAuth.service.js`) + 1 route public `/auth/oauth/callback` (POST code/state lên API, không tin email từ client) + 1 store action tái dùng mapping user của `loginWithCredentials`. Nút Google ẩn khi providers không chứa Google.

**Tech Stack:** React 18 + Vite + react-router-dom 6 + axios (envelope bóc 1 lần trong `services/api.js`) + Zustand `authStore`; `npx eslint` + `npm run build` (frontend không có test runner).

---

## File-structure map

**Modify (infra):**
- `docker-compose.yml:35-72` — thêm 3 biến `ExternalAuth__*` vào service `api.environment`

**Create (frontend):**
- `src/frontend/src/services/externalAuth.service.js` — `getProviders()`, `startGoogleLogin()`, `completeGoogleCallback({code, state})`
- `src/frontend/src/pages/auth/OAuthCallback.jsx` — trang callback SPA

**Modify (frontend):**
- `src/frontend/src/store/authStore.js` — thêm `loginWithExternal(authResponse)` (map user giống `loginWithCredentials:52-81`)
- `src/frontend/src/routes/index.jsx:44-46,133-137` — import + route `/auth/oauth/callback` trong cụm PublicLayout
- `src/frontend/src/pages/auth/Login.jsx:161-163,419-447` — nối nút Google, ẩn khi chưa bật
- `src/frontend/src/pages/auth/Register.jsx:149-150,530-548` — tương tự Register

**Không chạm:** mọi file `src/backend/**` (ngoài compose), `Login.jsx` form mật khẩu, `api.js` interceptor, `TutorApplication` flow.

## Phase order

- **Phase A (Task 1):** compose env-forward. Kiểm thử: `docker compose config` thấy biến.
- **Phase B (Tasks 2–4):** service + store + callback page + route. Kiểm thử: lint + build.
- **Phase C (Task 5):** nối nút Login/Register. Kiểm thử: lint + build + test tay với test user.
- **Phase D (Task 6):** E2E + docs + secret scan.

### Task 1: Forward `ExternalAuth__*` vào container `api`

**Files:**
- Modify: `docker-compose.yml:35-72`
- Test: `docker compose config` (không cần chạy container)

- [ ] **Step 1: Thêm 3 dòng env vào service `api`**

Đặt ngay sau khối `Cors__AllowedOrigins` (cuối `environment:` của `api`), giữ indent 6 spaces:

```yaml
      Cors__AllowedOrigins: ${Cors__AllowedOrigins}
      ExternalAuth__RedirectUri: ${ExternalAuth__RedirectUri:-http://localhost:5173/auth/oauth/callback}
      ExternalAuth__Google__ClientId: ${ExternalAuth__Google__ClientId}
      ExternalAuth__Google__ClientSecret: ${ExternalAuth__Google__ClientSecret}
```

Không thêm Facebook (giữ tắt có chủ ý). Không đổi `POSTGRES_*` hay bất kỳ dòng nào khác.

- [ ] **Step 2: Verify compose config**

Run: `docker compose config | Select-String "ExternalAuth"`
Expected: 3 dòng `ExternalAuth__RedirectUri/Google__ClientId/Google__ClientSecret` hiện ra (giá trị ClientSecret hiện plain text trong output local — không paste output này vào chat/PR).

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "chore(compose): forward ExternalAuth Google vars to api container"
```

### Task 2: `externalAuth.service.js` — 3 hàm gọi API OAuth

**Files:**
- Create: `src/frontend/src/services/externalAuth.service.js`
- Test: `npx eslint src/frontend/src/services/externalAuth.service.js` (0 errors)

Contract backend (`AuthController.cs:117-157`, envelope đã bóc 1 lần ở `api.js:96-116` nên `res` là payload thẳng):
- `GET /auth/oauth/providers` → `{ providers: string[], enabled: boolean }`
- `GET /auth/oauth/google/start` → `{ authorizeUrl: string, state: string, provider: string }`
- `POST /auth/oauth/google/callback` body `{ code, state }` → `AuthResponseDto` (`AuthResponseDto.cs:3-9`: `accessToken, refreshToken, tokenType, expiresIn, user`)

- [ ] **Step 1: Tạo file service**

```js
import { api } from './api';

export const externalAuthService = {
  async getProviders() {
    const res = await api.get('/auth/oauth/providers');
    const providers = Array.isArray(res?.providers) ? res.providers : [];
    return { providers, enabled: res?.enabled === true && providers.length > 0 };
  },

  async startGoogleLogin() {
    const res = await api.get('/auth/oauth/google/start');
    if (!res?.authorizeUrl || !res?.state) {
      throw new Error('Máy chủ chưa cấu hình đăng nhập Google.');
    }
    return { authorizeUrl: res.authorizeUrl, state: res.state };
  },

  async completeGoogleCallback(code, state) {
    if (!code || !state) {
      throw new Error('Liên kết đăng nhập thiếu code hoặc state.');
    }
    const res = await api.post('/auth/oauth/google/callback', { code, state });
    if (!res?.accessToken || !res?.user) {
      throw new Error('Phản hồi đăng nhập không hợp lệ từ máy chủ.');
    }
    return res;
  },
};

export default externalAuthService;
```

Quy tắc: không gửi email từ client (body callback chỉ `code` + `state` — `CompleteExternalLoginRequest.cs:10-12`); provider viết thường `google` trong URL (controller parse case-insensitive, handler chuẩn hóa).

- [ ] **Step 2: Lint**

Run: `cd src/frontend && npx eslint src/services/externalAuth.service.js`
Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/services/externalAuth.service.js
git commit -m "feat(frontend): externalAuth service for Google OAuth"
```

### Task 3: `authStore.loginWithExternal` — tái dùng mapping user

**Files:**
- Modify: `src/frontend/src/store/authStore.js:81-94` (chèn sau `loginWithCredentials`, trước `registerWithCredentials`)
- Test: `npx eslint src/frontend/src/store/authStore.js`

- [ ] **Step 1: Thêm action sau `loginWithCredentials`**

```js
  // Login via Google OAuth callback - AuthResponseDto shape == login response
  loginWithExternal: async (authResponse) => {
    const u = authResponse?.user;
    if (!authResponse?.accessToken || !u) {
      throw new Error('Phản hồi đăng nhập không hợp lệ từ máy chủ.');
    }
    const mappedUser = {
      id: u.id,
      name: u.fullName || u.email,
      fullName: u.fullName || u.email,
      email: u.email,
      role: u.role,
      phone: u.phone || null,
      avatarUrl: u.avatarUrl || null,
      idProfile: u.idProfile || null,
      tutorProfileId: u.role === 'Tutor' ? (u.idProfile || null) : null,
      absentStrikes: u.absentStrikes ?? 0,
    };
    get().login(mappedUser, {
      accessToken: authResponse.accessToken,
      refreshToken: authResponse.refreshToken,
    });
    return { success: true, user: mappedUser };
  },
```

Copy nguyên mapping từ `loginWithCredentials` (kể cả comment không dùng DiceBear — không sinh avatar bên thứ ba). Không lưu `code`/`state` vào localStorage.

- [ ] **Step 2: Lint**

Run: `cd src/frontend && npx eslint src/store/authStore.js`
Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/store/authStore.js
git commit -m "feat(frontend): loginWithExternal stores OAuth session"
```

### Task 4: `OAuthCallback.jsx` + route `/auth/oauth/callback`

**Files:**
- Create: `src/frontend/src/pages/auth/OAuthCallback.jsx`
- Modify: `src/frontend/src/routes/index.jsx:44-46,133-137`
- Test: `npx eslint` + `npm run build`

Trang này nằm trong cụm `PublicLayout` nhưng bọc `GuestGuard` (giống login/register): user đã login mà vào đây thì đá về dashboard.

- [ ] **Step 1: Tạo trang callback**

```jsx
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
              <span className="inline-block w-6 h-6 border-2 border-brand-primary-600/30 border-t-brand-primary-600 rounded-full animate-spin" aria-label="Đang xử lý" />
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
```

Không render `code`/`state` ra UI. `onceRef` chống double-POST khi React StrictMode mount 2 lần (state backend dùng 1 lần — POST lặp lại sẽ 400).

- [ ] **Step 2: Đăng ký route**

Trong `routes/index.jsx`: thêm import cùng nhóm auth (`:44-46`):

```jsx
import OAuthCallback from '../pages/auth/OAuthCallback';
```

Thêm 2 route cạnh login/register (`:133-137`):

```jsx
<Route path="/auth/oauth/callback" element={<GuestGuard><OAuthCallback /></GuestGuard>} />
```

Không bọc `RequireAuth` (user chưa login lúc này). Không thêm route Facebook/Apple.

- [ ] **Step 3: Lint + build**

Run: `cd src/frontend && npx eslint src/pages/auth/OAuthCallback.jsx src/routes/index.jsx && npm run build`
Expected: 0 errors; `vite build` success.

- [ ] **Step 4: Commit**

```bash
git add src/frontend/src/pages/auth/OAuthCallback.jsx src/frontend/src/routes/index.jsx
git commit -m "feat(frontend): Google OAuth callback page and route"
```

### Task 5: Nối nút Google ở Login/Register, ẩn khi chưa bật

**Files:**
- Modify: `src/frontend/src/pages/auth/Login.jsx:1-20,100-163,419-447`
- Modify: `src/frontend/src/pages/auth/Register.jsx:60-80,149-150,525-555`
- Test: `npx eslint` + `npm run build` + test tay

- [ ] **Step 1: Login.jsx — providers state + handler thật**

Import thêm (cạnh `:18-19`):

```jsx
import { externalAuthService } from '@/services/externalAuth.service';
```

Trong component, cạnh `useState` hiện có, thêm:

```jsx
const [googleEnabled, setGoogleEnabled] = useState(false);
const [socialLoading, setSocialLoading] = useState(false);
```

Trong `useEffect` mount (`:100-115`), sau logic hiện có, thêm:

```jsx
let cancelled = false;
externalAuthService.getProviders()
  .then(({ providers }) => {
    if (!cancelled && providers.some((p) => String(p).toLowerCase() === 'google')) {
      setGoogleEnabled(true);
    }
  })
  .catch(() => {});
// trong cleanup hiện có: cancelled = true;
```

Thay `handleSocialLogin` (`:161-163`):

```jsx
const handleSocialLogin = async (provider) => {
  if (provider !== 'Google') {
    toast.info(`Đăng nhập với ${provider} sẽ sớm có mặt.`);
    return;
  }
  try {
    setSocialLoading(true);
    const { authorizeUrl } = await externalAuthService.startGoogleLogin();
    window.location.href = authorizeUrl;
  } catch (err) {
    toast.error(err?.message || 'Không khởi tạo được đăng nhập Google.');
  } finally {
    setSocialLoading(false);
  }
};
```

Render (`:419-447`): bọc nút Google trong `{googleEnabled && ...}`, thêm `disabled={socialLoading}` cho cả 3 nút; Facebook/Apple giữ nguyên toast. Khi `googleEnabled === false` thì grid còn 2 nút — giữ `grid-cols-3` nguyên (YAGNI, không vẽ lại layout).

- [ ] **Step 2: Register.jsx — tương tự**

Cùng pattern: `googleEnabled` state, `getProviders()` ở mount, `handleSocialRegister('Google')` gọi `startGoogleLogin()` rồi `window.location.href`, các provider khác giữ toast. Nút Google ẩn khi chưa bật.

- [ ] **Step 3: Lint + build**

Run: `cd src/frontend && npx eslint src/pages/auth/Login.jsx src/pages/auth/Register.jsx && npm run build`
Expected: 0 errors; build success.

- [ ] **Step 4: Test tay (browser, API đang chạy với `.env` đã điền)**

1. Mở `http://localhost:5173/auth/login` → thấy nút Google.
2. Bấm Google → sang trang consent Google → tiếp tục bằng **test user** → về `/auth/oauth/callback` (loading) → vào dashboard đúng role.
3. F5 vào `/auth/oauth/callback?code=x&state=y` cũ → trang báo link hết hạn + link về login.
4. Tắt Google (xóa `ExternalAuth__Google__*` khỏi env, restart API) → nút Google biến mất, login mật khẩu vẫn chạy.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/pages/auth/Login.jsx src/frontend/src/pages/auth/Register.jsx
git commit -m "feat(frontend): wire Google sign-in buttons to OAuth flow"
```

### Task 6: Kiểm thử cuối, docs, secret scan

**Files:**
- Modify: `docs/google-login-spec.md` (§1 frontend + §5 compose → đánh dấu xong)
- Test: backend suite + contract script

- [ ] **Step 1: Backend không hồi quy**

Run: `dotnet build src/backend/TutorHub.sln --nologo -v q`
Expected: `Build succeeded, 0 warnings, 0 errors` (TreatWarningsAsErrors bật).

- [ ] **Step 2: API live check (API chạy, `.env` đã nạp)**

Run:

```powershell
Invoke-RestMethod http://localhost:5129/api/v1/auth/oauth/providers | ConvertTo-Json
```

Expected: `providers: ["Google"]`, `enabled: true`. Sau đó mở Swagger `http://localhost:5129/swagger`, gọi `GET /api/v1/auth/oauth/google/start` → 200, `authorizeUrl` chứa `accounts.google.com`, `code_challenge_method=S256`, `redirect_uri` encode của `http://localhost:5173/auth/oauth/callback`.

- [ ] **Step 3: Secret scan + docs touch-up**

Run: `pwsh ./scripts/scan-secrets.ps1`
Expected: sạch (không có `GOCSPX` hay client ID trong diff).

Trong `docs/google-login-spec.md`: cập nhật §1 (frontend: từ "Chưa có" → "Đã có, xem plan này"), §5 (compose: "Thiếu" → "Đã forward"). Không ghi secret vào docs. Nếu có file secret nào lọt vào `git status`, dừng lại và xóa khỏi tracking trước khi commit.

- [ ] **Step 4: Final frontend gates**

Run: `cd src/frontend && npm run lint && npm run build`
Expected: cả hai pass, 0 warnings.

- [ ] **Step 5: Commit**

```bash
git add docs/google-login-spec.md
git commit -m "docs: mark Google login activated"
```

## Self-review

1. **Spec coverage (`docs/google-login-spec.md`):** redirect URI khớp console (§3.1) → Task 1 default + Task 6-Step 2 kiểm tra; test users (§3.2) → Task 5-Step 4 dùng test user; POST callback + PKCE + state 1 lần (§4) → backend có sẵn, Task 4 không tạo GET callback và chống double-POST; linking giữ role / Student mặc định / từ chối khi thiếu `email_verified` (§4) → backend có sẵn, Task 4 giữ logic Tutor-application check của Login.jsx; compose forward (§5) → Task 1; service + callback + nút ẩn/hiện (§6) → Tasks 2–5; cổng kiểm (§7) → Task 6; giới hạn single-node/unlink (§8) → không sửa, đúng phạm vi.
2. **Placeholder scan:** không TBD/TODO; số liệu cụ thể (TTL 10 phút server-side, `grid-cols-3` giữ nguyên, route chính xác `/auth/oauth/callback`); mỗi bước có file + lệnh + expected.
3. **Type consistency:** `ExternalProvidersDto(Providers, Enabled)` → service đọc `res.providers`/`res.enabled`; `ExternalAuthorizeUrlDto(AuthorizeUrl, State, Provider)` → service đọc `res.authorizeUrl`/`res.state` (camelCase JSON); `CompleteExternalLoginRequest(Code, State)` → POST `{ code, state }`; `AuthResponseDto(AccessToken, RefreshToken, TokenType, ExpiresIn, User)` → store đọc `accessToken`/`refreshToken`/`user` — khớp mọi task.

