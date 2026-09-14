/**
 * Tutor Service - Quản lý API Khám phá Gia sư, Danh mục & Gói học
 * Dual-Mode Architecture: Ưu tiên Backend API thật, tự động Graceful Fallback về mockData khi offline
 */
import { api } from './api';
import { MOCK_CATEGORIES, MOCK_SUBJECTS, MOCK_TUTORS } from '@/config/mockData';

export const tutorService = {
  /**
   * Lấy danh sách 10 danh mục môn học cấp 1
   */
  async getCategories() {
    try {
      const res = await api.get('/categories');
      if (res && Array.isArray(res) && res.length > 0) {
        return res;
      }
      return MOCK_CATEGORIES;
    } catch (err) {
      console.warn('[tutorService] Backend /categories offline, using mock categories fallback.', err.message);
      return MOCK_CATEGORIES;
    }
  },

  /**
   * Lấy danh sách 15 môn học cấp 2 (có thể lọc theo categoryId hoặc search)
   */
  async getSubjects(categoryId = null, search = '') {
    try {
      const params = {};
      if (categoryId) params.categoryId = categoryId;
      if (search) params.search = search;
      const res = await api.get('/subjects', { params });
      if (res && res.items && Array.isArray(res.items)) {
        return res.items;
      }
      return filterMockSubjects(categoryId, search);
    } catch (err) {
      console.warn('[tutorService] Backend /subjects offline, using mock subjects fallback.', err.message);
      return filterMockSubjects(categoryId, search);
    }
  },

  /**
   * Tìm kiếm và lọc gia sư với bộ lọc đa chiều (Subject, Mode, Price, Rating, Search, Sort)
   */
  async getTutors({
    subjectId = null,
    minPrice = null,
    maxPrice = null,
    teachingMode = null,
    minRating = null,
    search = '',
    sortBy = 'rating_desc',
    pageNumber = 1,
    pageSize = 9,
  } = {}) {
    try {
      const params = { pageNumber, pageSize };
      if (subjectId) params.subjectId = subjectId;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (teachingMode && teachingMode !== 'All') params.teachingMode = teachingMode;
      if (minRating) params.minRating = minRating;
      if (search) params.search = search;
      if (sortBy) params.sortBy = sortBy;

      const res = await api.get('/tutors', { params });
      if (res && res.items && Array.isArray(res.items)) {
        return res;
      }
      return filterMockTutors({ subjectId, minPrice, maxPrice, teachingMode, minRating, search, sortBy, pageNumber, pageSize });
    } catch (err) {
      console.warn('[tutorService] Backend /tutors offline, using mock tutors fallback.', err.message);
      return filterMockTutors({ subjectId, minPrice, maxPrice, teachingMode, minRating, search, sortBy, pageNumber, pageSize });
    }
  },

  /**
   * Lấy chi tiết hồ sơ công khai của một gia sư theo ID
   */
  async getTutorById(id) {
    try {
      const res = await api.get(`/tutors/${id}`);
      if (res && res.id) {
        return res;
      }
      return findMockTutor(id);
    } catch (err) {
      console.warn(`[tutorService] Backend /tutors/${id} offline, using mock tutor fallback.`, err.message);
      return findMockTutor(id);
    }
  },

  /**
   * Lấy ma trận lịch rảnh của gia sư theo tuần
   */
  async getTutorAvailability(id, fromDate = null, toDate = null) {
    try {
      const params = {};
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      const res = await api.get(`/tutors/${id}/availability`, { params });
      if (res && res.slots) {
        return res.slots;
      }
      const tutor = findMockTutor(id);
      return tutor?.availability || [];
    } catch (err) {
      console.warn(`[tutorService] Backend /tutors/${id}/availability offline, using mock availability fallback.`);
      const tutor = findMockTutor(id);
      return tutor?.availability || [];
    }
  },

  /**
   * Lấy danh sách các gói học dịch vụ (Services) đã niêm yết của gia sư
   */
  async getTutorServices(id) {
    try {
      const res = await api.get(`/tutors/${id}/services`);
      if (res && Array.isArray(res)) {
        return res;
      }
      const tutor = findMockTutor(id);
      return tutor?.services || [];
    } catch (err) {
      console.warn(`[tutorService] Backend /tutors/${id}/services offline, using mock services fallback.`);
      const tutor = findMockTutor(id);
      return tutor?.services || [];
    }
  },

  /**
   * Lấy danh sách đánh giá từ học viên của gia sư
   */
  async getTutorReviews(id, pageNumber = 1, pageSize = 10) {
    try {
      const res = await api.get(`/tutors/${id}/reviews`, { params: { pageNumber, pageSize } });
      if (res && res.items) {
        return res;
      }
      const tutor = findMockTutor(id);
      return {
        items: tutor?.reviews || [],
        totalCount: tutor?.reviews?.length || 0,
        pageNumber,
        pageSize,
      };
    } catch (err) {
      console.warn(`[tutorService] Backend /tutors/${id}/reviews offline, using mock reviews fallback.`);
      const tutor = findMockTutor(id);
      return {
        items: tutor?.reviews || [],
        totalCount: tutor?.reviews?.length || 0,
        pageNumber,
        pageSize,
      };
    }
  },
};

// HELPER FUNCTIONS CHO MOCK FALLBACK
function filterMockSubjects(categoryId, search) {
  return MOCK_SUBJECTS.filter(s => {
    if (categoryId && s.categoryId !== categoryId) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
}

function findMockTutor(id) {
  if (!id) return MOCK_TUTORS[0];
  const found = MOCK_TUTORS.find(t => t.id === id || t.profileId === id);
  return found || MOCK_TUTORS[0];
}

function filterMockTutors({
  subjectId,
  minPrice,
  maxPrice,
  teachingMode,
  minRating,
  search,
  sortBy,
  pageNumber,
  pageSize,
}) {
  let list = [...MOCK_TUTORS];

  if (subjectId) {
    list = list.filter(t => t.subjects.some(s => s.id === subjectId));
  }

  if (teachingMode && teachingMode !== 'All') {
    list = list.filter(t => t.teachingMode === teachingMode || t.teachingMode === 'Both');
  }

  if (minPrice != null) {
    list = list.filter(t => t.minPrice >= minPrice);
  }

  if (maxPrice != null) {
    list = list.filter(t => t.minPrice <= maxPrice);
  }

  if (minRating != null) {
    list = list.filter(t => t.rating >= minRating);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(t =>
      t.fullName.toLowerCase().includes(q) ||
      t.education.toLowerCase().includes(q) ||
      t.bio.toLowerCase().includes(q) ||
      t.subjects.some(s => s.name.toLowerCase().includes(q))
    );
  }

  // Sắp xếp
  if (sortBy === 'rating_desc') {
    list.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'price_asc') {
    list.sort((a, b) => a.minPrice - b.minPrice);
  } else if (sortBy === 'price_desc') {
    list.sort((a, b) => b.minPrice - a.minPrice);
  } else if (sortBy === 'experience_desc') {
    list.sort((a, b) => b.experienceYears - a.experienceYears);
  }

  const totalCount = list.length;
  const startIndex = (pageNumber - 1) * pageSize;
  const items = list.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    items,
    totalCount,
    pageNumber,
    pageSize,
    totalPages,
    hasPreviousPage: pageNumber > 1,
    hasNextPage: pageNumber < totalPages,
  };
}

export default tutorService;
