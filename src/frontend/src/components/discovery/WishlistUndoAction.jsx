import { userFacingError } from '@/utils/userFacingError';
import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { wishlistService } from '@/services/wishlistService';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';

export default function WishlistUndoAction({ itemType, itemId, userId, saved = false, dismiss }) {
  const [restoring, setRestoring] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  const restore = async () => {
    if (restoring) return;
    setRestoring(true);
    try {
      if (useAuthStore.getState().user?.id !== userId || !useAuthStore.getState().isAuthenticated) {
        throw new Error('Vui lòng đăng nhập lại để lưu mục này.');
      }
      // Read first: undo should restore the previous state, not blindly toggle again.
      const ids = await wishlistService.getWishlistIds();
      const currentIds = (itemType === 'Tutor' ? ids.tutorIds : ids.serviceIds) || [];
      const desiredSaved = !saved;
      const currentlySaved = currentIds.some(id => String(id).toLowerCase() === String(itemId).toLowerCase());
      if (currentlySaved !== desiredSaved) {
        const result = await wishlistService.toggleWishlist(itemType, itemId);
        if (result?.isFavorited !== desiredSaved) throw new Error('Chưa thể hoàn tác. Vui lòng thử lại.');
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wishlist', 'ids', userId] }),
        queryClient.invalidateQueries({ queryKey: ['wishlist', 'items', userId] }),
      ]);
      dismiss();
      toast.success(`${desiredSaved ? 'Đã lưu lại' : 'Đã bỏ lưu'} ${itemType === 'Tutor' ? 'gia sư' : "gói học"}.`);
    } catch (err) {
      toast.error(userFacingError(err, 'Không thể hoàn tác. Vui lòng thử lại.'));
    } finally { setRestoring(false); }
  };

  return (
    <span className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <span>{`${saved ? 'Đã lưu' : 'Đã bỏ lưu'} ${itemType === 'Tutor' ? 'gia sư' : "gói học"}.`}</span>
      <button type="button" onClick={restore} disabled={restoring} aria-busy={restoring || undefined}
        className="min-h-11 rounded px-1 font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current disabled:opacity-60">
        {restoring ? 'Đang hoàn tác…' : 'Hoàn tác'}
      </button>
    </span>
  );
}
