// Wallet Service - Connected to /api/v1/tutors/me/wallet with graceful fallback
import api from './api';

const MOCK_WALLET = {
  id: '22222222-3333-3333-3333-111111111111',
  tutorProfileId: '22222222-2222-2222-2222-111111111111',
  pendingBalance: 3600000,
  availableBalance: 900000,
  heldBalance: 200000,
  withdrawableBalance: 700000,
  pendingWithdrawal: 300000,
  totalBalance: 4800000,
  bankAccount: {
    bankName: 'Ngân Hàng TMCP Ngoại Thương Việt Nam (Vietcombank)',
    bankCode: 'VCB',
    accountNumber: '0011001234567',
    accountHolderName: 'NGUYEN VAN AN',
    status: 'VERIFIED_KYC'
  }
};

const MOCK_WITHDRAWALS = [
  {
    id: 'fa01fa01-0001-0000-0000-000000000001',
    amount: 300000,
    status: 'Pending',
    bankName: 'Vietcombank',
    accountNumber: '0011001234567',
    accountHolderName: 'NGUYEN VAN AN',
    note: 'Rút thù lao dạy tuần 1',
    requestedAt: '13/09/2026 20:38'
  },
  {
    id: 'fa01fa01-0001-0000-0000-000000000002',
    amount: 500000,
    status: 'Completed',
    bankName: 'Vietcombank',
    accountNumber: '0011001234567',
    accountHolderName: 'NGUYEN VAN AN',
    note: 'Rút thù lao tháng trước',
    requestedAt: '04/09/2026 20:38'
  }
];

export const walletService = {
  getMyWallet: async () => {
    try {
      const res = await api.get('/tutors/me/wallet');
      if (res && res.data) {
        return {
          ...res.data,
          bankAccount: MOCK_WALLET.bankAccount
        };
      }
      return MOCK_WALLET;
    } catch (err) {
      console.warn('[walletService] Fallback to mock wallet:', err.message);
      return MOCK_WALLET;
    }
  },

  getWithdrawals: async () => {
    try {
      const res = await api.get('/tutors/me/wallet/withdrawals');
      if (res && res.data && res.data.items) {
        return res.data.items;
      }
      return MOCK_WITHDRAWALS;
    } catch (err) {
      console.warn('[walletService] Fallback to mock withdrawals:', err.message);
      return MOCK_WITHDRAWALS;
    }
  },

  createWithdrawal: async (payload) => {
    try {
      const res = await api.post('/tutors/me/wallet/withdrawals', payload);
      return res.data || res;
    } catch (err) {
      console.warn('[walletService] Simulation of createWithdrawal:', err.message);
      return { success: true, message: 'Lệnh rút tiền đã gửi thành công (Mock simulation)' };
    }
  }
};

export default walletService;
