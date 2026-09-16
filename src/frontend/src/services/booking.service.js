/**
 * Booking Service — /api/v1/bookings
 *
 * Contract (BookingsController + BookingDto):
 * - POST /bookings                body { serviceId: Guid } → 201 BookingDto
 *   (Booking là package-based: KHÔNG gửi tutorId/totalAmount như trước).
 * - GET  /bookings/{id}           → BookingDto
 * - POST /bookings/{id}/cancel    body { reason } → BookingDto
 *
 * BookingDto: { id, studentProfileId, studentName, studentEmail, studentPhone,
 *   tutorProfileId, tutorName, tutorEmail, tutorPhone, subjectId, subjectName, status,
 *   holdingExpiresAt, confirmedAt, completedAt, cancelledAt, cancelledBy,
 *   cancellationReason, createdAt, transaction, serviceId, totalPrice, totalSessions,
 *   sessionDurationMinutes, teachingMode, enrollment }
 *
 * Mock: chỉ khi VITE_USE_MOCK === 'true'; lỗi khác được ném lại (ApiError).
 */
import { api } from './api';
import { USE_MOCK } from '@/config/constants';
import { MOCK_TUTORS } from '@/config/mockData';

/** POST /bookings → BookingDto (tạo hold 15 phút) */
async function createBooking(serviceId) {
  try {
    const res = await api.post('/bookings', { serviceId });
    return res;
  } catch (err) {
    if (!USE_MOCK) throw err;
    console.warn('[bookingService] /bookings lỗi, dùng mock (VITE_USE_MOCK=true).', err.message);
    return createMockBooking(serviceId);
  }
}

export const bookingService = {
  createBooking,

  /** GET /bookings/{id} → BookingDto */
  async getBookingById(id) {
    try {
      const res = await api.get(`/bookings/${id}`);
      return res;
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn(`[bookingService] /bookings/${id} lỗi, dùng mock (VITE_USE_MOCK=true).`, err.message);
      return createMockBooking(id);
    }
  },

  /** POST /bookings/{id}/cancel → BookingDto */
  async cancelBooking(id, reason = 'Người dùng hủy đặt chỗ') {
    try {
      const res = await api.post(`/bookings/${id}/cancel`, { reason });
      return res;
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn(`[bookingService] cancel /bookings/${id} lỗi, dùng mock (VITE_USE_MOCK=true).`, err.message);
      return createMockBooking(id);
    }
  },
};

// ---------------------------------------------------------------------------
// MOCK (chỉ chạy khi VITE_USE_MOCK === 'true')
// ---------------------------------------------------------------------------

function createMockBooking(serviceId) {
  let foundService = null;
  let foundTutor = null;

  for (const tutor of MOCK_TUTORS) {
    const service = tutor.services.find((item) => item.id === serviceId);
    if (service) {
      foundService = service;
      foundTutor = tutor;
      break;
    }
  }

  if (!foundService) {
    foundTutor = MOCK_TUTORS[0];
    foundService = foundTutor.services[0];
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

  return {
    id: 'b1b1b1b1-0001-0000-0000-000000000001',
    studentProfileId: null,
    studentName: 'Học viên (mock)',
    studentEmail: 'student@tutorhub.com',
    studentPhone: null,
    tutorProfileId: foundTutor.profileId ?? foundTutor.id,
    tutorName: foundTutor.fullName,
    tutorEmail: foundTutor.email,
    tutorPhone: foundTutor.phone,
    subjectId: null,
    subjectName: foundService.subjectName ?? '',
    status: 'Holding',
    holdingExpiresAt: expiresAt,
    confirmedAt: null,
    completedAt: null,
    cancelledAt: null,
    cancelledBy: null,
    cancellationReason: null,
    createdAt: now.toISOString(),
    transaction: null,
    serviceId: foundService.id,
    totalPrice: foundService.price,
    totalSessions: foundService.totalSessions,
    sessionDurationMinutes: foundService.sessionDurationMinutes,
    teachingMode: foundService.teachingMode,
    enrollment: null,
  };
}

export default bookingService;
