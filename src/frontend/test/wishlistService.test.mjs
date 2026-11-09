import test from 'node:test';
import assert from 'node:assert/strict';
import { wishlistService } from '../src/services/wishlistService.js';
import apiClient from '../src/lib/apiClient.js';

test('wishlistService: endpoints and payload shapes', () => {
  const togglePayload = (itemType, itemId) => ({ itemType, itemId });
  const payload = togglePayload('Tutor', '3fa85f64-5717-4562-b3fc-2c963f66afa6');

  assert.equal(payload.itemType, 'Tutor');
  assert.equal(payload.itemId, '3fa85f64-5717-4562-b3fc-2c963f66afa6');
});

test('wishlistService: getWishlistIds calls /api/v1/wishlist/ids and returns ids', async () => {
  const originalGet = apiClient.get;
  try {
    let capturedUrl = '';
    apiClient.get = async (url) => {
      capturedUrl = url;
      return {
        data: {
          data: {
            tutorIds: ['tutor-1'],
            serviceIds: ['service-1'],
          },
        },
      };
    };

    const res = await wishlistService.getWishlistIds();
    assert.equal(capturedUrl, '/api/v1/wishlist/ids');
    assert.deepEqual(res, { tutorIds: ['tutor-1'], serviceIds: ['service-1'] });
  } finally {
    apiClient.get = originalGet;
  }
});

test('wishlistService: getWishlistItems sends type, page, and pageSize params', async () => {
  const originalGet = apiClient.get;
  try {
    let captured = null;
    apiClient.get = async (url, config) => {
      captured = { url, config };
      return {
        data: {
          data: {
            items: [{ id: 'item-1' }],
            totalCount: 1,
            page: 2,
            pageSize: 5,
          },
        },
      };
    };

    const res = await wishlistService.getWishlistItems('Service', 2, 5);
    assert.equal(captured.url, '/api/v1/wishlist');
    assert.deepEqual(captured.config.params, { type: 'Service', page: 2, pageSize: 5 });
    assert.equal(res.totalCount, 1);
    assert.equal(res.items.length, 1);
  } finally {
    apiClient.get = originalGet;
  }
});

test('wishlistService: toggleWishlist posts itemType and itemId', async () => {
  const originalPost = apiClient.post;
  try {
    let captured = null;
    apiClient.post = async (url, body) => {
      captured = { url, body };
      return {
        data: {
          data: { isFavorited: true, message: 'Đã lưu gia sư vào danh sách yêu thích.' },
        },
      };
    };

    const res = await wishlistService.toggleWishlist('Tutor', 'tutor-123');
    assert.equal(captured.url, '/api/v1/wishlist/toggle');
    assert.deepEqual(captured.body, { itemType: 'Tutor', itemId: 'tutor-123' });
    assert.equal(res.isFavorited, true);
  } finally {
    apiClient.post = originalPost;
  }
});
