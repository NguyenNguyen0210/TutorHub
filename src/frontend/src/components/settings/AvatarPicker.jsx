import React, { useEffect, useRef, useState } from 'react';
import Avatar, { Drawer } from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { AVATAR_ACCEPT, squareCrop, validateAvatar } from '@/utils/profileSettings';

export default function AvatarPicker({ src, name, disabled, onChoose, onDefault }) {
  const input = useRef(null);
  const image = useRef(null);
  const [selection, setSelection] = useState(null);
  const [dimensions, setDimensions] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [error, setError] = useState('');
  const [cropping, setCropping] = useState(false);
  useEffect(() => () => { if (selection) URL.revokeObjectURL(selection); }, [selection]);
  const close = () => { if (!cropping) { setSelection(null); setDimensions(null); } };
  const select = event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const message = validateAvatar(file);
    setError(message);
    if (message) return;
    setZoom(1); setX(50); setY(50); setDimensions(null);
    setSelection(URL.createObjectURL(file));
  };
  const crop = dimensions ? squareCrop(dimensions.width, dimensions.height, zoom, x, y) : null;
  const apply = async () => {
    if (!crop || cropping) return;
    setCropping(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 512;
      const context = canvas.getContext('2d');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, 512, 512);
      context.drawImage(image.current, crop.x, crop.y, crop.side, crop.side, 0, 0, 512, 512);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) throw new Error();
      onChoose(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
      setSelection(null); setDimensions(null); setError('');
    } catch { setError('Chưa thể xử lý ảnh. Vui lòng chọn ảnh khác.'); }
    finally { setCropping(false); }
  };
  return <section aria-labelledby="avatar-label" className="border-b border-border pb-6">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <Avatar key={src || 'default'} src={src} name={name} size="xl" className="h-24 w-24 border-4 border-surface ring-1 ring-border" />
      <div className="min-w-0 space-y-3"><div><h2 id="avatar-label" className="font-semibold text-fg">Ảnh đại diện</h2><p className="mt-1 text-sm leading-relaxed text-fg-secondary">Ảnh hiển thị trên hồ sơ và trong cuộc trò chuyện.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={disabled} onClick={() => input.current?.click()} icon={<Icon name="file_upload" size="sm" />}>Tải ảnh lên</Button><Button variant="ghost" disabled={disabled || !src} onClick={() => { setError(''); onDefault(); }}>Dùng ảnh mặc định</Button></div><p id="avatar-help" className="text-caption text-fg-secondary">JPG, PNG hoặc WebP, tối đa 5 MB. Ảnh được lưu khi bạn chọn Lưu thay đổi.</p></div>
    </div>
    <input ref={input} type="file" accept={AVATAR_ACCEPT} onChange={select} disabled={disabled} aria-label="Chọn ảnh đại diện" aria-describedby="avatar-help" className="sr-only" tabIndex={-1} />
    {error && <p role="alert" className="mt-3 text-sm text-danger-strong">{error}</p>}
    <Drawer open={Boolean(selection)} onClose={close} side="right" title="Điều chỉnh ảnh đại diện" widthClass="w-full max-w-sm" footer={<div className="flex w-full justify-end gap-2"><Button variant="outline" disabled={cropping} onClick={close}>Hủy</Button><Button onClick={apply} loading={cropping} disabled={!crop}>Dùng ảnh này</Button></div>}>
      <p className="mb-5 text-sm leading-relaxed text-fg-secondary">Chọn phần ảnh bạn muốn hiển thị. Ảnh sẽ được cắt thành hình vuông.</p>
      <div className="relative mx-auto aspect-square w-full max-w-[16rem] overflow-hidden rounded-xl bg-neutral-100" role="img" aria-label="Xem trước ảnh đại diện đã cắt">
        {/* Image load/error events do not add mouse or keyboard interactions. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        {selection && <img ref={image} src={selection} alt="" onLoad={event => setDimensions({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} onError={() => { setError('Ảnh không đọc được. Vui lòng chọn ảnh khác.'); setSelection(null); }} style={crop ? { position: 'absolute', maxWidth: 'none', width: `${dimensions.width / crop.side * 100}%`, height: `${dimensions.height / crop.side * 100}%`, left: `${-crop.x / crop.side * 100}%`, top: `${-crop.y / crop.side * 100}%` } : { visibility: 'hidden' }} />}
      </div>
      <div className="mt-6 space-y-5">{[['avatar-zoom', 'Phóng to', zoom, setZoom, 1, 3, 0.05], ['avatar-x', 'Vị trí ngang', x, setX, 0, 100, 1], ['avatar-y', 'Vị trí dọc', y, setY, 0, 100, 1]].map(([id, label, value, set, min, max, step]) => <div key={id}><label htmlFor={id} className="mb-2 block text-sm font-medium text-fg">{label}</label><input id={id} type="range" min={min} max={max} step={step} value={value} onChange={event => set(Number(event.target.value))} disabled={cropping} className="min-h-11 w-full accent-primary" /></div>)}</div>
    </Drawer>
  </section>;
}
