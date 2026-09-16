import axios from 'axios';
import { API_BASE_URL } from '../config/constants';
import { useAuthStore } from '../store/authStore';

// Tạo hàm sinh UUID v4 đơn giản cho X-Correlation-ID
function generateCorrelationId() {
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
  const response = error?.response;
  const payload = response?.data;
  const status = response?.status ?? 0;

  return new ApiError(payload?.message || error?.message || 'Đã có lỗi xảy ra', {
    status,
    errors: Array.isArray(payload?.errors) ? payload.errors : [],
    traceId: payload?.traceId ?? response?.headers?.['x-correlation-id'] ?? null,
    kind: kindForStatus(status),
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
const CREDENTIAL_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];

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
        // Caller nhận thẳng payload; KHÔNG đọc thêm `.data` ở tầng service/page.
        return resData.data;
      }
      return Promise.reject(
        new ApiError(resData.message || 'Lỗi xử lý nghiệp vụ', {
          status: response.status,
          errors: Array.isArray(resData.errors) ? resData.errors : [],
          traceId: resData.traceId ?? null,
          kind: 'business',
        })
      );
    }

    return resData;
  },
  async (error) => {
    const originalRequest = error.config ?? {};
    const status = error.response?.status;
    const url = originalRequest.url ?? '';
    const isCredentialCall = CREDENTIAL_ENDPOINTS.some((endpoint) => url.includes(endpoint));
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
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;

        // Gọi thẳng axios để không đi qua interceptor (tránh đệ quy refresh).
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = refreshResponse.data?.data?.accessToken;
        if (newAccessToken) {
          useAuthStore.getState().login(useAuthStore.getState().user, {
            accessToken: newAccessToken,
            refreshToken: refreshResponse.data?.data?.refreshToken || refreshToken,
          });
          processQueue(null, newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        useAuthStore.getState().logout();
        return Promise.reject(toApiError(refreshErr));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(toApiError(error));
  }
);

export default api;
