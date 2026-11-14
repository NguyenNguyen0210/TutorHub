import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/ui/Icon';

export default function VideoPreviewDialog({ media, onClose }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);
  return createPortal(<dialog ref={dialogRef} aria-label="Video học thử" aria-modal="true"
    onCancel={event => { event.preventDefault(); onClose(); }}
    className="m-auto w-[calc(100%-2rem)] max-w-4xl overflow-visible rounded-2xl border-0 bg-black p-0 text-white shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm">
    <button type="button" onClick={onClose} aria-label="Đóng video học thử"
      className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
      <Icon name="close" size="sm" />
    </button>
    <div className="aspect-video w-full overflow-hidden rounded-2xl">
      {media.direct
        // The service API does not provide caption tracks for recordings.
        // eslint-disable-next-line jsx-a11y/media-has-caption
        ? <video controls src={media.href} className="h-full w-full" aria-label="Video học thử" />
        : <iframe src={media.embed} title="Video học thử giới thiệu gói học" className="h-full w-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />}
    </div>
  </dialog>, document.body);
}
