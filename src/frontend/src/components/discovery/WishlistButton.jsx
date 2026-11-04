import React from 'react';
import Icon from '@/components/ui/Icon';
import { useWishlist } from '@/hooks/useWishlist';

export default function WishlistButton({ itemType, itemId }) {
  const { isFavorited, toggle, isPending } = useWishlist();
  const saved = isFavorited(itemType, itemId);
  const label = `${saved ? 'Bỏ lưu' : 'Lưu'} ${itemType === 'Tutor' ? 'gia sư' : "gói học"}`;
  return (
    <button type="button" onClick={() => toggle(itemType, itemId)} disabled={isPending}
      title={label} aria-label={label} aria-pressed={saved} aria-busy={isPending || undefined}
      className={`relative z-20 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 ${saved ? 'border-danger/20 bg-danger-subtle text-danger-strong hover:border-danger/50' : 'border-border bg-surface text-fg-secondary hover:bg-neutral-100 hover:text-danger-strong'}`}>
      <Icon name="favorite" size="md" filled={saved} />
    </button>
  );
}
