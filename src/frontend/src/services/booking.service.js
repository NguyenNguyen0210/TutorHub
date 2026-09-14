import { api } from './api';
import { MOCK_TUTORS } from '@/config/mockData';

export const bookingService = {
  /**
   * Tạo đơn đặt chỗ mới với hạn giữ chỗ 15 phút
   */
  async createBooking(serviceId) {
    try {
      const res = await api.post('/bookings', { serviceId });
      if (res && res.id) {
        return res;
      }
      return createMockBooking(serviceId);
    } catch (err) {
      console.warn('[bookingService] Backend /bookings offline, using mock booking hold.', err.message);
      return createMockBooking(serviceId);
    }
  },

  /**
   * Lấy chi tiết đơn đặt chỗ theo ID
   */
  async getBookingById(id) {
    try {
      const res = await api.get(`/bookings/${id}`);
      if (res && res.id) {
        return res;
      }
      return getMockBooking(id);
    } catch (err) {
      console.warn(`[bookingService] Backend /bookings/${id} offline, using mock booking.`, err.message);
      return getMockBooking(id);
    }
  },

  /**
   * Hủy đơn đặt chỗ
   */
  async cancelBooking(id, reason = 'Người dùng hủy đặt chỗ') {
    try {
      const res = await api.post(`/bookings/${id}/cancel`, { reason });
      return res;
    } catch (err) {
      console.warn(`[bookingService] Backend cancel /bookings/${id} offline.`, err.message);
      return { success: true, message: 'Đã hủy đơn đặt chỗ thành công.' };
    }
  },
};

// HELPER TẠO MOCK BOOKING 15 PHÚT
function createMockBooking(serviceId) {
  // Tìm gói học trong mockData
  let foundService = null;
  let foundTutor = null;

  for (const tutor of MOCK_TUTORS) {
    const s = tutor.services.find(item => item.id === serviceId);
    if (s) {
      foundService = s;
      foundTutor = tutor;
      break;
    }
  }

  // Mặc định nếu không tìm thấy
  if (!foundService) {
    foundTutor = MOCK_TUTORS[0];
    foundService = foundTutor.services[0];
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString(); // 15 phút nữa

  return {
    id: 'b1b1b1b1-0001-0000-0000-000000000001',
    serviceId: foundService.id,
    serviceTitle: foundService.title,
    tutorId: foundTutor.id,
    tutorName: foundTutor.fullName,
    tutorAvatar: foundTutor.avatarUrl,
    tutorEducation: foundTutor.education,
    totalSessions: foundService.totalSessions,
    sessionDurationMinutes: foundService.sessionDurationMinutes,
    teachingMode: foundService.teachingMode,
    price: foundService.price,
    platformFeeRate: 0.10,
    platformFeeAmount: 0, // Miễn phí sàn cho học viên
    totalAmount: foundService.price,
    status: 'Holding',
    holdingExpiresAt: expiresAt,
    createdAt: now.toISOString(),
  };
}

function getMockBooking(id) {
  return createMockBooking(id);
}

export default bookingService;
