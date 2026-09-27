/**
 * Wallet Service — /api/v1/tutors/me/wallet
 *
 * Verified payloads:
 * - GET  /tutors/me/wallet              → WalletDto { id, tutorProfileId, pendingBalance,
 *   availableBalance, heldBalance, withdrawableBalance, pendingWithdrawal, totalBalance, updatedAt }
 * - GET  /tutors/me/wallet/withdrawals  → PagedResult<WithdrawalDto>
 * - POST /tutors/me/wallet/withdrawals  → 201 WithdrawalDto
 * - GET  /tutors/me/wallet/payout-account → TutorPayoutAccountDto
 * - PUT  /tutors/me/wallet/payout-account → TutorPayoutAccountDto
 * - GET  /tutors/me/wallet/statement    → PagedResult<WalletTransactionDto>
 */
import api from './api';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeWallet(raw = {}) {
  return {
    id: raw.id ?? null,
    tutorProfileId: raw.tutorProfileId ?? null,
    pendingBalance: toNumber(raw.pendingBalance),
    availableBalance: toNumber(raw.availableBalance),
    heldBalance: toNumber(raw.heldBalance),
    withdrawableBalance: toNumber(raw.withdrawableBalance),
    pendingWithdrawal: toNumber(raw.pendingWithdrawal),
    totalBalance: toNumber(raw.totalBalance),
    updatedAt: raw.updatedAt ?? null,
  };
}

function normalizePaged(raw, normalizeItem) {
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

export const walletService = {
  /** GET /tutors/me/wallet → WalletDto */
  async getMyWallet() {
    const res = await api.get('/tutors/me/wallet');
    return normalizeWallet(res);
  },

  /** GET /tutors/me/wallet/payout-account → TutorPayoutAccountDto */
  async getPayoutAccount() {
    const res = await api.get('/tutors/me/wallet/payout-account');
    return res ?? null;
  },

  /**
   * PUT /tutors/me/wallet/payout-account
   * Body: { bankName, bankCode, accountNumber, accountHolderName }
   */
  async updatePayoutAccount(payload) {
    return api.put('/tutors/me/wallet/payout-account', payload);
  },

  /**
   * GET /tutors/me/wallet/withdrawals → PagedResult<WithdrawalDto>
   */
  async getWithdrawals({ status = null, pageNumber = 1, pageSize = 10 } = {}) {
    const params = { pageNumber, pageSize };
    if (status) params.status = status;
    const res = await api.get('/tutors/me/wallet/withdrawals', { params });
    return normalizePaged(res, (item) => item);
  },

  /**
   * POST /tutors/me/wallet/withdrawals → 201 Created + WithdrawalDto
   * Body: { amount, bankName, bankCode, accountNumber, accountHolderName, note }
   */
  async createWithdrawal(payload) {
    return api.post('/tutors/me/wallet/withdrawals', payload);
  },

  /**
   * GET /tutors/me/wallet/statement → PagedResult<WalletTransactionDto>
   * Params: { fromDate, toDate, pageNumber, pageSize }
   */
  async getWalletStatement({ fromDate = null, toDate = null, pageNumber = 1, pageSize = 20 } = {}) {
    const params = { pageNumber, pageSize };
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    const res = await api.get('/tutors/me/wallet/statement', { params });
    return res;
  },
};

export default walletService;
