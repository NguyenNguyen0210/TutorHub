import { api } from './api';

export const forgotPasswordService = {
  /**
   * Bước 1: Yêu cầu cấp mã OTP 6 số qua email.
   * @param {string} email
   */
  async requestResetOtp(email) {
    return await api.post('/auth/forgot-password', {
      email: email.trim().toLowerCase(),
    });
  },

  /**
   * Bước 2: Xác thực mã OTP 6 số và nhận resetToken bí mật.
   * @param {string} email
   * @param {string} otp
   * @returns {Promise<string>} resetToken
   */
  async verifyResetOtp(email, otp) {
    return await api.post('/auth/verify-reset-otp', {
      email: email.trim().toLowerCase(),
      otp: otp.trim(),
    });
  },

  /**
   * Bước 3: Đặt mật khẩu mới với resetToken đã được cấp.
   * @param {string} email
   * @param {string} resetToken
   * @param {string} newPassword
   */
  async resetPassword(email, resetToken, newPassword) {
    return await api.post('/auth/reset-password', {
      email: email.trim().toLowerCase(),
      resetToken: resetToken.trim(),
      newPassword,
    });
  },
};

export default forgotPasswordService;
