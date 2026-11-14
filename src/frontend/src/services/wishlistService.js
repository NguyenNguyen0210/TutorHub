import api from './api.js';

export const wishlistService = {
  async getWishlistIds() {
    return await api.get('/wishlist/ids') || { tutorIds: [], serviceIds: [] };
  },

  async getWishlistItems(type, page = 1, pageSize = 10) {
    return await api.get('/wishlist', {
      params: { type, page, pageSize },
    }) || { items: [], totalCount: 0, page, pageSize };
  },

  async toggleWishlist(itemType, itemId) {
    return api.post('/wishlist/toggle', { itemType, itemId });
  },
};

export default wishlistService;
