import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { wishlistService } from '../services/wishlistService.js';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/ui/Toast';

export function useWishlist() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const toast = useToast();

  const { data: wishlistIds = { tutorIds: [], serviceIds: [] } } = useQuery({
    queryKey: ['wishlist', 'ids'],
    queryFn: wishlistService.getWishlistIds,
    enabled: Boolean(isAuthenticated),
    staleTime: 5 * 60 * 1000,
  });

  const isFavorited = (itemType, itemId) => {
    if (!isAuthenticated || !itemId) return false;
    const strId = String(itemId).toLowerCase();
    if (itemType === 'Tutor') {
      return (wishlistIds.tutorIds || []).some((id) => String(id).toLowerCase() === strId);
    }
    if (itemType === 'Service') {
      return (wishlistIds.serviceIds || []).some((id) => String(id).toLowerCase() === strId);
    }
    return false;
  };

  const toggleMutation = useMutation({
    mutationFn: ({ itemType, itemId }) => wishlistService.toggleWishlist(itemType, itemId),
    onMutate: async ({ itemType, itemId }) => {
      await queryClient.cancelQueries({ queryKey: ['wishlist', 'ids'] });
      const previousIds = queryClient.getQueryData(['wishlist', 'ids']) || { tutorIds: [], serviceIds: [] };
      const strId = String(itemId).toLowerCase();

      const newIds = {
        tutorIds: [...(previousIds.tutorIds || [])],
        serviceIds: [...(previousIds.serviceIds || [])],
      };

      if (itemType === 'Tutor') {
        const index = newIds.tutorIds.findIndex((id) => String(id).toLowerCase() === strId);
        if (index >= 0) newIds.tutorIds.splice(index, 1);
        else newIds.tutorIds.push(itemId);
      } else if (itemType === 'Service') {
        const index = newIds.serviceIds.findIndex((id) => String(id).toLowerCase() === strId);
        if (index >= 0) newIds.serviceIds.splice(index, 1);
        else newIds.serviceIds.push(itemId);
      }

      queryClient.setQueryData(['wishlist', 'ids'], newIds);
      return { previousIds };
    },
    onError: (err, variables, context) => {
      if (context?.previousIds) {
        queryClient.setQueryData(['wishlist', 'ids'], context.previousIds);
      }
      const message =
        err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi cập nhật danh sách yêu thích.';
      if (typeof toast?.error === 'function') {
        toast.error(message);
      } else if (typeof toast?.showToast === 'function') {
        toast.showToast({ title: 'Thao tác không thành công', message, type: 'error' });
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', 'items'] });
      const message =
        data?.message ||
        (data?.isFavorited ? 'Đã lưu vào danh sách yêu thích.' : 'Đã bỏ lưu khỏi danh sách yêu thích.');
      if (typeof toast?.success === 'function') {
        toast.success(message);
      } else if (typeof toast?.showToast === 'function') {
        toast.showToast({ title: 'Thông báo', message, type: 'success' });
      }
    },
  });

  const toggle = (itemType, itemId) => {
    if (!isAuthenticated) {
      const message = 'Vui lòng đăng nhập để lưu vào danh sách yêu thích.';
      if (typeof toast?.info === 'function') {
        toast.info(message);
      } else if (typeof toast?.showToast === 'function') {
        toast.showToast({ title: 'Yêu cầu đăng nhập', message, type: 'info' });
      }
      const returnUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
      navigate('/auth/login', { state: { returnUrl } });
      return;
    }
    toggleMutation.mutate({ itemType, itemId });
  };

  return {
    wishlistIds,
    isFavorited,
    toggle,
    isPending: toggleMutation.isPending,
  };
}

export default useWishlist;
