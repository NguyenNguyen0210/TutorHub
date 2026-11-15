import api from './api.js';

export default {
  getMyReports: (pageNumber = 1, reportId) => api.get('/reports/me', { params: { pageNumber, pageSize: 10, reportId: reportId || undefined } }),
  create: (bookingId, description) => api.post(`/bookings/${bookingId}/reports`, { description: description.trim() }, { errorPresentation: 'local' }),
  reportUser: (id, reason) => api.post(`/users/${id}/report`, { reason }, { errorPresentation: 'local' }),
  reportReview: (id, description) => api.post(`/reviews/${id}/report`, { description }, { errorPresentation: 'local' }),
};
