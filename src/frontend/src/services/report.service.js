import api from './api';

export default {
  getMyReports: (pageNumber = 1, reportId) => api.get('/reports/me', { params: { pageNumber, pageSize: 10, reportId: reportId || undefined } }),
  create: (bookingId, description) => api.post(`/bookings/${bookingId}/reports`, { description: description.trim() }),
};
