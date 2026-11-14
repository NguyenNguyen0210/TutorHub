import { HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr';
import api from './api.js';
import { useAuthStore } from '../store/authStore.js';

function isTokenCurrent(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload));
    return typeof exp === 'number' && exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function createHubAccessTokenFactory() {
  // A connection belongs to the account that created it, including on reconnect.
  const userId = useAuthStore.getState().user?.id;
  const session = () => {
    const state = useAuthStore.getState();
    if (!userId || state.user?.id !== userId || !state.isAuthenticated || !state.accessToken) {
      throw new Error('SignalR session is no longer active.');
    }
    return state;
  };
  return async () => {
    if (!isTokenCurrent(session().accessToken)) {
      // Use the shared 401/refresh queue, so REST and hubs cannot rotate the
      // same refresh token independently. The API remains the token authority.
      await api.get('/auth/me');
    }
    return session().accessToken;
  };
}

export function createAuthenticatedHubConnection(hubUrl) {
  return new HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: createHubAccessTokenFactory(),
      transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .configureLogging(LogLevel.Warning)
    .build();
}

function waitForRetry(delay, signal) {
  return new Promise(resolve => {
    const finish = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', finish);
      resolve();
    };
    const timer = setTimeout(finish, delay);
    signal?.addEventListener('abort', finish, { once: true });
    if (signal?.aborted) finish();
  });
}

// SignalR automatic reconnect only applies after a successful initial start.
export async function startHubConnection(connection, signal, retryDelays = [2000, 5000, 10000]) {
  for (let attempt = 0; !signal?.aborted; attempt++) {
    try {
      await connection.start();
      return;
    } catch (error) {
      if (signal?.aborted) return;
      if (attempt >= retryDelays.length) throw error;
      await waitForRetry(retryDelays[attempt], signal);
    }
  }
}
