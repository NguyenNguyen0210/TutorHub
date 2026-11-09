import apiClient from '../lib/apiClient.js';

export const wishlistService = {
  async getWishlistIds() {
    const response = await apiClient.get('/api/v1/wishlist/ids');
    return response.data?.data || { tutorIds: [], serviceIds: [] };
  },

  async getWishlistItems(type, page = 1, pageSize = 10) {
    const response = await apiClient.get('/api/v1/wishlist', {
      params: { type, page, pageSize },
    });
    return response.data?.data || { items: [], totalCount: 0, page, pageSize };
  },

  async toggleWishlist(itemType, itemId) {
    const response = await apiClient.post('/api/v1/wishlist/toggle', { itemType, itemId });
    return response.data?.data;
  },
};

export default wishlistService;
