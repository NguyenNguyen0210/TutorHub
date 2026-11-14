import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { Buffer } from 'node:buffer';
import { setTimeout as sleep } from 'node:timers/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { URL } from 'node:url';

const storage = () => {
  const values = new Map();
  return { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, String(v)), removeItem: k => values.delete(k) };
};
globalThis.localStorage = storage();
globalThis.sessionStorage = storage();
const { useAuthStore } = await import('../src/store/authStore.js');
const { default: api } = await import('../src/services/api.js');
const { createHubAccessTokenFactory, createAuthenticatedHubConnection, startHubConnection } = await import('../src/services/signalrConnection.js');
const { Server: WebSocketServer } = createRequire(import.meta.resolve('@microsoft/signalr'))('ws');
const user = { id: 'student-1', role: 'Student' };
const jwt = seconds => `header.${Buffer.from(JSON.stringify({ exp: Date.now() / 1000 + seconds })).toString('base64url')}.signature`;
const response = (config, data, status = 200) => ({ config, status, statusText: String(status), headers: {}, data: { success: status < 400, data } });
const originalAdapter = api.defaults.adapter;
const originalAxiosAdapter = axios.defaults.adapter;
let refreshes, validations, validToken;
beforeEach(() => {
  globalThis.localStorage = storage(); globalThis.sessionStorage = storage();
  refreshes = 0; validations = 0; validToken = jwt(600);
  useAuthStore.getState().login(user, { accessToken: jwt(-60), refreshToken: 'refresh-1' });
  axios.defaults.adapter = async config => {
    refreshes++;
    await sleep(15);
    return response(config, { accessToken: validToken, refreshToken: 'refresh-2' });
  };
  api.defaults.adapter = async config => {
    if (config.url === '/auth/logout') return response(config, true);
    validations++;
    if (config.headers.Authorization !== `Bearer ${validToken}`) {
      throw new axios.AxiosError('Expired', 'ERR_BAD_REQUEST', config, null, response(config, null, 401));
    }
    return response(config, user);
  };
});
afterEach(() => { api.defaults.adapter = originalAdapter; axios.defaults.adapter = originalAxiosAdapter; });

test('valid hub tokens avoid extra REST calls', async () => {
  useAuthStore.getState().login(user, { accessToken: validToken, refreshToken: 'refresh-1' });
  assert.equal(await createHubAccessTokenFactory()(), validToken);
  assert.equal(refreshes, 0); assert.equal(validations, 0);
});

test('expired chat, notification and REST calls share one token rotation', async () => {
  const chat = createHubAccessTokenFactory();
  const notifications = createHubAccessTokenFactory();
  const [chatToken, notificationToken] = await Promise.all([chat(), notifications(), api.get('/conversations')]);
  assert.equal(chatToken, validToken); assert.equal(notificationToken, validToken);
  assert.equal(refreshes, 1);
  assert.equal(useAuthStore.getState().refreshToken, 'refresh-2');
});

test('malformed tokens are validated by the API instead of sent blindly to a hub', async () => {
  useAuthStore.getState().login(user, { accessToken: 'malformed', refreshToken: 'refresh-1' });
  assert.equal(await createHubAccessTokenFactory()(), validToken);
  assert.equal(refreshes, 1);
});

test('a connection cannot reconnect as a different account or after logout', async () => {
  const oldFactory = createHubAccessTokenFactory();
  useAuthStore.getState().login({ id: 'other-user' }, { accessToken: validToken, refreshToken: 'other-refresh' });
  await assert.rejects(oldFactory(), /no longer active/);
  await useAuthStore.getState().logout();
  await assert.rejects(oldFactory(), /no longer active/);
  assert.equal(refreshes, 0);
});

test('logout during refresh does not restore an old session', async () => {
  const factory = createHubAccessTokenFactory();
  let release;
  let began;
  const started = new Promise(resolve => { began = resolve; });
  axios.defaults.adapter = async config => {
    began(); await new Promise(resolve => { release = resolve; });
    return response(config, { accessToken: validToken, refreshToken: 'refresh-2' });
  };
  const result = assert.rejects(factory());
  await started;
  await useAuthStore.getState().logout();
  release(); await result;
  assert.equal(useAuthStore.getState().isAuthenticated, false);
  assert.equal(useAuthStore.getState().accessToken, null);
});

test('account change during refresh cannot replace or clear the new account tokens', async () => {
  const factory = createHubAccessTokenFactory();
  let release, began;
  const started = new Promise(resolve => { began = resolve; });
  axios.defaults.adapter = async config => {
    began(); await new Promise(resolve => { release = resolve; });
    return response(config, { accessToken: validToken, refreshToken: 'refresh-2' });
  };
  const result = assert.rejects(factory());
  await started;
  useAuthStore.getState().login({ id: 'other-user' }, { accessToken: 'other-token', refreshToken: 'other-refresh' });
  release(); await result;
  assert.equal(useAuthStore.getState().user.id, 'other-user');
  assert.equal(useAuthStore.getState().accessToken, 'other-token');
  assert.equal(useAuthStore.getState().refreshToken, 'other-refresh');
});

test('failed refresh prevents hub authentication', async () => {
  axios.defaults.adapter = async config => { throw new axios.AxiosError('Revoked', 'ERR_BAD_REQUEST', config, null, response(config, null, 401)); };
  await assert.rejects(createHubAccessTokenFactory()());
  assert.equal(useAuthStore.getState().isAuthenticated, false);
});

test('initial transient failure retries and navigation cancels pending retries', async () => {
  let attempts = 0;
  await startHubConnection({ start: async () => { if (++attempts < 3) throw new Error('Offline'); } }, undefined, [1, 1]);
  assert.equal(attempts, 3);
  const controller = new globalThis.AbortController();
  attempts = 0;
  await startHubConnection({ start: async () => { attempts++; controller.abort(); throw new Error('Offline'); } }, controller.signal, [1, 1]);
  assert.equal(attempts, 1);
  const waitingController = new globalThis.AbortController();
  attempts = 0;
  const pending = startHubConnection({ start: async () => { attempts++; throw new Error('Offline'); } }, waitingController.signal, [10000]);
  await sleep(1);
  waitingController.abort();
  await pending;
  assert.equal(attempts, 1);
  await assert.rejects(startHubConnection({ start: async () => { throw new Error('Offline'); } }, undefined, [1]), /Offline/);
});

for (const hub of ['chat', 'notifications']) {
  test(`real SignalR ${hub} handshake refreshes expired credentials and reconnects after disconnect`, { timeout: 10000 }, async () => {
    const negotiations = [], sockets = [], invocations = [];
    const server = createServer((req, res) => {
      negotiations.push(req.headers.authorization);
      if (req.headers.authorization !== `Bearer ${validToken}`) { res.writeHead(401); res.end(); return; }
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ negotiateVersion: 1, connectionId: 'test-id', connectionToken: 'test-token', availableTransports: [{ transport: 'WebSockets', transferFormats: ['Text', 'Binary'] }] }));
    });
    const wsServer = new WebSocketServer({ server });
    wsServer.on('connection', socket => {
      sockets.push(socket);
      socket.on('message', bytes => {
        for (const item of bytes.toString().split('\u001e').filter(Boolean)) {
          const message = JSON.parse(item);
          if (message.protocol) socket.send('{}\u001e');
          if (message.invocationId) {
            invocations.push(message.target);
            socket.send(JSON.stringify({ type: 3, invocationId: message.invocationId }) + '\u001e');
          }
        }
      });
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = new URL(`http://127.0.0.1:${server.address().port}/hubs/${hub}`);
    const connection = createAuthenticatedHubConnection(url.href);
    try {
      // Reproduce the old factory: expired credentials fail without refreshing.
      const oldConnection = new HubConnectionBuilder().withUrl(url.href, {
        accessTokenFactory: () => useAuthStore.getState().accessToken || '',
      }).configureLogging(LogLevel.None).build();
      await assert.rejects(oldConnection.start(), /401/);
      assert.equal(refreshes, 0);
      negotiations.length = 0;
      await connection.start();
      assert.equal(refreshes, 1);
      assert.equal(negotiations.length, 1);
      await connection.invoke('JoinConversation', 'conversation-1');
      // Simulate the server closing an established connection as its token expires.
      useAuthStore.getState().login(user, { accessToken: jwt(-60), refreshToken: 'refresh-2' });
      validToken = jwt(900);
      const reconnected = new Promise((resolve, reject) => {
        const timeout = globalThis.setTimeout(() => reject(new Error('Reconnect timed out')), 5000);
        connection.onreconnected(() => {
          connection.invoke('JoinConversation', 'conversation-1').then(() => { globalThis.clearTimeout(timeout); resolve(); }, reject);
        });
      });
      sockets[0].terminate();
      await reconnected;
      assert.equal(refreshes, 2);
      assert.equal(negotiations.length, 2);
      assert.equal(negotiations[1], `Bearer ${validToken}`);
      assert.deepEqual(invocations, ['JoinConversation', 'JoinConversation']);
    } finally {
      await connection.stop();
      for (const socket of wsServer.clients) socket.terminate();
      await new Promise(resolve => wsServer.close(resolve));
      await new Promise(resolve => server.close(resolve));
    }
  });
}
