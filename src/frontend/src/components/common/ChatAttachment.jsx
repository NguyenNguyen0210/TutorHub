import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import chatService from '@/services/chat.service';
import { saveDownloadedFile } from '@/utils/chatAttachment';
import Icon from '@/components/ui/Icon';

export function ChatFilePreview({ file, onRemove, disabled }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!file?.type.startsWith('image/')) { setUrl(null); return undefined; }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border p-3">
    {url ? <img src={url} alt="Ảnh đính kèm đã chọn" className="h-12 w-12 shrink-0 rounded-lg object-cover" /> : <Icon name="description" size="md" />}
    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{file.name}</p><p className="text-xs text-fg-secondary">{Math.max(1, Math.round(file.size / 1024))} KB</p></div>
    <button type="button" onClick={onRemove} disabled={disabled} aria-label="Bỏ tệp đính kèm" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-ring"><Icon name="close" size="sm" /></button>
  </div>;
}
ChatFilePreview.propTypes = { file: PropTypes.object.isRequired, onRemove: PropTypes.func.isRequired, disabled: PropTypes.bool };

export default function ChatAttachment({ message }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const download = async () => {
    if (busy) return;
    setBusy(true); setError(false);
    try { saveDownloadedFile(await chatService.downloadAttachment(message.conversationId, message.attachmentKey), message.attachmentName); }
    catch { setError(true); }
    finally { setBusy(false); }
  };
  return <div className="mt-1"><button type="button" disabled={busy} onClick={download} className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg text-left underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-current"><Icon name="download" size="sm" /><span className="break-all">{busy ? 'Đang tải tệp…' : message.attachmentName}</span></button>{error && <p role="alert" className="mt-1 text-xs">Chưa tải được tệp. Vui lòng thử lại.</p>}</div>;
}
ChatAttachment.propTypes = { message: PropTypes.object.isRequired };
