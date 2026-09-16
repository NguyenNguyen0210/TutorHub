/**
 * Wallet Service — /api/v1/tutors/me/wallet
 *
 * Verified payloads (curl, seeded tutor.an@tutorhub.com):
 * - GET  /tutors/me/wallet              → WalletDto { id, tutorProfileId, pendingBalance,
 *   availableBalance, heldBalance, withdrawableBalance, pendingWithdrawal, totalBalance, updatedAt }
 *   (KHÔNG có `bankAccount` — trước đây service tự gắn dữ liệu giả vào đây).
 * - GET  /tutors/me/wallet/withdrawals  → PagedResult<WithdrawalDto> (đọc `items`).
 * - POST /tutors/me/wallet/withdrawals  → 201 WithdrawalDto.
 * - GET  /tutors/me/wallet/payout-account → TutorPayoutAccountDto { bankName, bankCode,
 *   accountNumber, accountHolderName }.
 *
 * Mock: chỉ khi VITE_USE_MOCK === 'true'; lỗi khác được ném lại (ApiError).
 */
import api from './api';
import { USE_MOCK } from '@/config/constants';

const MOCK_WALLET = {
  id: '22222222-3333-3333-3333-111111111111',
  tutorProfileId: '22222222-2222-2222-2222-111111111111',
  pendingBalance: 3600000,
  availableBalance: 900000,
  heldBalance: 200000,
  withdrawableBalance: 700000,
  pendingWithdrawal: 300000,
  totalBalance: 4800000,
  updatedAt: '2026-09-14T13:38:01.747215Z',
};

const MOCK_PAYOUT_ACCOUNT = {
  bankName: 'Ngân Hàng TMCP Ngoại Thương Việt Nam',
  bankCode: 'VCB',
  accountNumber: '0011001234567',
  accountHolderName: 'NGUYEN VAN AN',
};

const MOCK_WITHDRAWALS = [
  {
    id: 'fa01fa01-0001-0000-0000-000000000001',
    walletId: '22222222-3333-3333-3333-111111111111',
    tutorProfileId: '22222222-2222-2222-2222-111111111111',
    tutorName: 'Nguyễn Văn An',
    tutorEmail: 'tutor.an@tutorhub.com',
    amount: 300000,
    status: 'Pending',
    bankName: 'Ngân Hàng TMCP Ngoại Thương Việt Nam',
    bankCode: 'VCB',
    accountNumber: '0011001234567',
    accountHolderName: 'NGUYEN VAN AN',
    note: 'Rút thù lao dạy tuần 1',
    requestedAt: '2026-09-13T13:38:01.747215Z',
    processingStartedAt: null,
    processedAt: null,
    failureReason: null,
  },
];

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** WalletDto → view model (số dư luôn là number để formatCurrency không vỡ). */
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
    try {
      const res = await api.get('/tutors/me/wallet');
      return normalizeWallet(res);
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn('[walletService] /tutors/me/wallet lỗi, dùng mock (VITE_USE_MOCK=true).', err.message);
      return normalizeWallet(MOCK_WALLET);
    }
  },

  /** GET /tutors/me/wallet/payout-account → TutorPayoutAccountDto */
  async getPayoutAccount() {
    try {
      const res = await api.get('/tutors/me/wallet/payout-account');
      return res ?? null;
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn('[walletService] /tutors/me/wallet/payout-account lỗi, dùng mock (VITE_USE_MOCK=true).', err.message);
      return MOCK_PAYOUT_ACCOUNT;
    }
  },

  /**
   * GET /tutors/me/wallet/withdrawals → PagedResult<WithdrawalDto>
   * @returns {Promise<{items: object[], totalCount: number, pageNumber: number, pageSize: number, totalPages: number, hasPreviousPage: boolean, hasNextPage: boolean}>}
   */
  async getWithdrawals({ status = null, pageNumber = 1, pageSize = 10 } = {}) {
    try {
      const params = { pageNumber, pageSize };
      if (status) params.status = status;
      const res = await api.get('/tutors/me/wallet/withdrawals', { params });
      return normalizePaged(res, (item) => item);
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn('[walletService] /tutors/me/wallet/withdrawals lỗi, dùng mock (VITE_USE_MOCK=true).', err.message);
      return normalizePaged(
        { items: MOCK_WITHDRAWALS, totalCount: MOCK_WITHDRAWALS.length, pageNumber, pageSize },
        (item) => item,
      );
    }
  },

  /**
   * POST /tutors/me/wallet/withdrawals → 201 Created + WithdrawalDto
   * Body: { amount, bankName, bankCode, accountNumber, accountHolderName, note }
   */
  async createWithdrawal(payload) {
    return api.post('/tutors/me/wallet/withdrawals', payload);
  },
};

export default walletService;
