import axios from 'axios';
import { API_BASE_URL } from '../config/constants.js';
import { useAuthStore } from '../store/authStore.js';
import { startRequestFeedback, finishRequestFeedback, timeoutMessage } from '../utils/requestFeedback.js';

// Tạo hàm sinh UUID v4 đơn giản cho X-Correlation-ID
export function generateCorrelationId() {
  return 'corr-' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * P1: lỗi có cấu trúc. UI cần phân biệt "hết hạn giữ chỗ" (409) với "mất mạng" (0)
 * hay "chưa đăng nhập" (401) — trước đây mọi lỗi bị nén thành `new Error(message)`
 * nên không thể branch, chỉ hiển thị được một câu chung.
 */
export class ApiError extends Error {
  constructor(message, { status = 0, errors = [], traceId = null, kind = 'unknown' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.traceId = traceId;
    this.kind = kind;
  }
}

function kindForStatus(status) {
  if (!status) return 'network';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'notFound';
  if (status === 409) return 'conflict';
  if (status === 429) return 'throttled';
  if (status >= 500) return 'server';
  return 'validation';
}

/** Chuẩn hoá lỗi axios/envelope thành ApiError (giữ errors[] + traceId của backend). */
export function toApiError(error) {
  if (error instanceof ApiError) return error;
  const response = error?.response;
  const payload = response?.data;
  const status = response?.status ?? 0;
  const errorsList = Array.isArray(payload?.errors) ? payload.errors : [];

  let msg = payload?.message || error?.message || 'Đã có lỗi xảy ra';
  const timedOut = ['ECONNABORTED', 'ETIMEDOUT'].includes(error?.code);
  if (timedOut) msg = timeoutMessage(error.config);
  else if (!response && error?.code === 'ERR_NETWORK') msg = 'Kết nối bị gián đoạn. Chưa nhận được kết quả; hãy kiểm tra trạng thái trước khi gửi lại.';

  const isGeneric =
    !msg ||
    msg.includes('A business conflict or duplicate resource was detected') ||
    msg.includes('Validation failed') ||
    msg.includes('The requested resource could not be found') ||
    msg.includes('Request failed with status code');

  if (isGeneric && errorsList.length > 0 && typeof errorsList[0] === 'string') {
    msg = errorsList[0];
  }

  return new ApiError(msg, {
    status,
    errors: errorsList,
    traceId: payload?.traceId ?? response?.headers?.['x-correlation-id'] ?? null,
    kind: timedOut ? 'timeout' : kindForStatus(status),
  });
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Gắn Bearer Token và Correlation ID
api.interceptors.request.use(
  (config) => {
    startRequestFeedback(config, useAuthStore.getState().user?.id);
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (!config.headers['X-Correlation-ID']) {
      config.headers['X-Correlation-ID'] = generateCorrelationId();
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: bóc tách ApiResponse<T> ĐÚNG MỘT LẦN và silent refresh token.
let isRefreshing = false;
let failedQueue = [];

// 401 ở chính các endpoint thông tin đăng nhập là sai thông tin, không phải token hết hạn.
const CREDENTIAL_URL_PATTERN = /^(?:\/api\/v1)?\/?auth\/(login|register|refresh|logout|oauth|forgot-password|verify-reset-otp|reset-password|change-password)/i;

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    const resData = response.data;

    if (resData && typeof resData.success === 'boolean') {
      if (resData.success) {
        finishRequestFeedback(response.config);
        // Caller nhận thẳng payload; KHÔNG đọc thêm `.data` ở tầng service/page.
        return resData.data;
      }
      const errorsList = Array.isArray(resData.errors) ? resData.errors : [];
      let msg = resData.message || 'Lỗi xử lý nghiệp vụ';
      if ((!msg || msg.includes('Validation failed') || msg.includes('A business conflict')) && errorsList.length > 0) {
        msg = errorsList[0];
      }
      const error = new ApiError(msg, {
          status: response.status,
          errors: errorsList,
          traceId: resData.traceId ?? null,
          kind: 'business',
        });
      finishRequestFeedback(response.config, error);
      return Promise.reject(error);
    }

    finishRequestFeedback(response.config);
    return resData;
  },
  async (error) => {
    const originalRequest = error.config ?? {};
    const reject = failure => {
      const publicError = toApiError(failure);
      finishRequestFeedback(originalRequest, publicError);
      return Promise.reject(publicError);
    };
    const status = error.response?.status;
    const url = originalRequest.url ?? '';
    const isCredentialCall = CREDENTIAL_URL_PATTERN.test(url);
    const hasRefreshToken = Boolean(useAuthStore.getState().refreshToken);

    // Xử lý lỗi 401 Unauthorized (Token hết hạn) — bỏ qua khi thiếu refresh token,
    // nếu không lỗi "sai mật khẩu" sẽ bị thay bằng "Không có refresh token".
    if (status === 401 && !isCredentialCall && hasRefreshToken && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(reject);
      }

      originalRequest._retry = true;
      isRefreshing = true;
      const refreshingSession = useAuthStore.getState();
      const refreshToken = refreshingSession.refreshToken;

      try {
        // Gọi thẳng axios để không đi qua interceptor (tránh đệ quy refresh).
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        }, { timeout: 15000 });

        const authState = useAuthStore.getState();
        if (authState.user?.id !== refreshingSession.user?.id || authState.refreshToken !== refreshToken) {
          throw new ApiError('Session changed during token refresh.', { status: 401, kind: 'unauthorized' });
        }
        const newAccessToken = refreshResponse.data?.data?.accessToken;
        if (newAccessToken) {
          authState.login(authState.user, {
            accessToken: newAccessToken,
            refreshToken: refreshResponse.data?.data?.refreshToken || refreshToken,
          }, authState.rememberMe);
          processQueue(null, newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }

        const missingTokenErr = new Error('No access token returned from refresh.');
        processQueue(missingTokenErr, null);
        useAuthStore.getState().logout();
        return reject(missingTokenErr);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        const currentSession = useAuthStore.getState();
        if (currentSession.user?.id === refreshingSession.user?.id && currentSession.refreshToken === refreshToken) {
          currentSession.logout();
        }
        return reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return reject(error);
  }
);

export default api;
