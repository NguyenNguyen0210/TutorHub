import api from './api';

export default {
  getMyReports: (pageNumber = 1) => api.get('/reports/me', { params: { pageNumber, pageSize: 10 } }),
  create: (bookingId, description) => api.post(`/bookings/${bookingId}/reports`, { description: description.trim() }),
};
