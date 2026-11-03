/**
 * Student Wallet Service — /api/v1/students/me/wallet and /api/v1/admin/student-wallets
 */
import api from './api';
import { idempotencyHeaders } from './idempotency';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeWallet(raw = {}) {
  return {
    id: raw.id ?? null,
    studentProfileId: raw.studentProfileId ?? null,
    availableBalance: toNumber(raw.availableBalance),
    withdrawingBalance: toNumber(raw.withdrawingBalance ?? raw.reservedBalance),
    reservedBalance: toNumber(raw.withdrawingBalance ?? raw.reservedBalance),
    totalBalance: toNumber(raw.totalBalance),
    updatedAt: raw.updatedAt ?? null,
  };
}

function normalizePaged(raw, normalizeItem = (item) => item) {
  const source = Array.isArray(raw?.items) ? raw.items : [];
  const items = source.map(normalizeItem);
  return {
    items,
    totalCount: toNumber(raw?.totalCount, items.length),
    pageNumber: toNumber(raw?.pageNumber, 1),
    pageSize: toNumber(raw?.pageSize, items.length),
    totalPages: toNumber(raw?.totalPages, items.length > 0 ? 1 : 0),
    hasPreviousPage: Boolean(raw?.hasPreviousPage),
    hasNextPage: Boolean(raw?.hasNextPage),
  };
}

export const studentWalletService = {
  // Student endpoints
  async getMyWallet() {
    const res = await api.get('/students/me/wallet');
    return normalizeWallet(res);
  },

  async getStatement({ pageNumber = 1, pageSize = 20 } = {}) {
    const res = await api.get('/students/me/wallet/statement', {
      params: { pageNumber, pageSize },
    });
    return normalizePaged(res);
  },

  async createVnPayTopUp({ amount }, idempotencyKey = null) {
    const headers = idempotencyHeaders(idempotencyKey);
    const res = await api.post('/students/me/wallet/top-up/vnpay', { amount: Number(amount) }, { headers });
    return res;
  },

  async getMyTopUpRequests({ pageNumber = 1, pageSize = 20 } = {}) {
    const res = await api.get('/students/me/wallet/top-up', {
      params: { pageNumber, pageSize },
    });
    return normalizePaged(res);
  },

  async requestWithdrawal(payload, idempotencyKey = null) {
    const headers = idempotencyHeaders(idempotencyKey);
    const res = await api.post('/students/me/wallet/withdrawals', {
      amount: Number(payload.amount),
      bankName: payload.bankName,
      bankCode: payload.bankCode || null,
      accountNumber: payload.accountNumber,
      accountHolderName: payload.accountHolderName,
      note: payload.note || null,
    }, { headers });
    return res;
  },
  async getMyWithdrawals({ pageNumber = 1, pageSize = 20 } = {}) {
    const res = await api.get('/students/me/wallet/withdrawals', {
      params: { pageNumber, pageSize },
    });
    return normalizePaged(res);
  },

  async payBookingFromWallet(bookingId, idempotencyKey = null) {
    const headers = idempotencyHeaders(idempotencyKey);
    const res = await api.post(`/payments/${bookingId}/wallet`, {}, { headers });
    return res;
  },

  // Admin endpoints
  async adminGetTopUps({ status = null, pageNumber = 1, pageSize = 20, search, recordId, signal } = {}) {
    const params = { pageNumber, pageSize, search, recordId };
    if (status) params.status = status;
    const res = await api.get('/admin/student-wallets/top-ups', { params, signal });
    return normalizePaged(res);
  },

  async adminConfirmTopUp(id, { adminNote = null } = {}) {
    const res = await api.post(`/admin/student-wallets/top-ups/${id}/confirm`, { adminNote });
    return res;
  },

  async adminRejectTopUp(id, { reason }) {
    const res = await api.post(`/admin/student-wallets/top-ups/${id}/reject`, { reason });
    return res;
  },

  async adminGetWithdrawals({ status = null, pageNumber = 1, pageSize = 20, recordId, signal } = {}) {
    const params = { pageNumber, pageSize, recordId };
    if (status) params.status = status;
    const res = await api.get('/admin/student-wallets/withdrawals', { params, signal });
    return normalizePaged(res);
  },

  async adminProcessWithdrawal(id) {
    const res = await api.post(`/admin/student-wallets/withdrawals/${id}/process`);
    return res;
  },

  async adminCompleteWithdrawal(id) {
    const res = await api.post(`/admin/student-wallets/withdrawals/${id}/complete`);
    return res;
  },

  async adminFailWithdrawal(id, { reason }) {
    const res = await api.post(`/admin/student-wallets/withdrawals/${id}/fail`, { reason });
    return res;
  },

  async adminFindWallets(search, pageNumber = 1, signal) {
    return normalizePaged(await api.get('/admin/student-wallets', { params: { search, pageNumber }, signal }));
  },

  async adminAdjustWallet({ studentWalletId, amount, direction, reason, referenceId = null, expectedAvailableBalance }, idempotencyKey) {
    const res = await api.post('/admin/student-wallets/adjust', {
      studentWalletId,
      amount: Number(amount),
      direction,
      reason,
      referenceId,
      expectedAvailableBalance,
    }, { headers: idempotencyHeaders(idempotencyKey) });
    return res;
  },
};

export default studentWalletService;
