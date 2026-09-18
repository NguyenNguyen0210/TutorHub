/**
 * User & Profile Service — /api/v1/users & /api/v1/auth & /api/v1/tutors
 *
 * Contract:
 * - GET   /users/me               → MyProfileDto
 * - PUT   /users/me               → MyProfileDto
 * - POST  /auth/change-password   → bool
 * - GET   /tutors/me              → TutorMyProfileDto
 * - PATCH /tutors/me              → TutorMyProfileDto
 */
import { api } from './api';

export const userService = {
  /** GET /users/me → MyProfileDto */
  async getMyProfile() {
    const res = await api.get('/users/me');
    return res;
  },

  /** PUT /users/me body { fullName, phone, avatarUrl } → MyProfileDto */
  async updateMyProfile(data) {
    const res = await api.put('/users/me', data);
    return res;
  },

  /** POST /auth/change-password body { currentPassword, newPassword } → bool */
  async changePassword(currentPassword, newPassword) {
    const res = await api.post('/auth/change-password', { currentPassword, newPassword });
    return res;
  },

  /** GET /tutors/me → TutorMyProfileDto */
  async getMyTutorProfile() {
    const res = await api.get('/tutors/me');
    return res;
  },

  /** PATCH /tutors/me body UpdateMyProfileRequest → TutorMyProfileDto */
  async updateMyTutorProfile(data) {
    const res = await api.patch('/tutors/me', data);
    return res;
  },
};

export default userService;
