/**
 * Booking Service — /api/v1/bookings
 *
 * Contract (BookingsController + BookingDto):
 * - GET  /bookings                → PagedResult<BookingSummaryDto>
 * - POST /bookings                body { serviceId: Guid } → 201 BookingDto
 * - GET  /bookings/{id}           → BookingDto
 * - POST /bookings/{id}/cancel    body { reason } → BookingDto
 */
import { api } from './api';

export const bookingService = {
  /**
   * GET /bookings → PagedResult<BookingSummaryDto>
   * Params: { status, fromDate, toDate, pageNumber, pageSize }
   */
  async getMyBookings({ status = null, fromDate = null, toDate = null, pageNumber = 1, pageSize = 10 } = {}) {
    const params = { pageNumber, pageSize };
    if (status) params.status = status;
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    const res = await api.get('/bookings', { params });
    return res;
  },

  /** POST /bookings → BookingDto (tạo hold 15 phút) */
  async createBooking(serviceId) {
    const res = await api.post('/bookings', { serviceId });
    return res;
  },

  /** GET /bookings/{id} → BookingDto */
  async getBookingById(id) {
    const res = await api.get(`/bookings/${id}`);
    return res;
  },

  /** POST /bookings/{id}/cancel → BookingDto */
  async cancelBooking(id, reason = 'Người dùng hủy đặt chỗ') {
    const res = await api.post(`/bookings/${id}/cancel`, { reason });
    return res;
  },
};

export default bookingService;
