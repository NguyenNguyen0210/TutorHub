import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import { DEMO_VIDEO_ACCEPT, formatVideoSize, validateServiceDemoVideo } from '@/utils/serviceDemoVideo';

/** 16:9 frame: plays the pending file locally, else the saved video, else empty state. */
export function DemoVideoPreview({ value, file, className = '' }) {
  const [local, setLocal] = useState(null);

  useEffect(() => {
    if (!file) { setLocal(null); return undefined; }
    const url = URL.createObjectURL(file);
    setLocal(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const src = file ? local : value || null;

  return (
    <div className={`flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-border bg-neutral-900 ${className}`}>
      {src ? (
        // The service API has no caption tracks for uploaded demos.
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video src={src} controls preload="metadata" className="h-full w-full" aria-label="Xem trước video demo gói học" />
      ) : (
        <div className="space-y-2 p-4 text-center text-fg-secondary">
          <Icon name="videocam" size="lg" />
          <p className="text-caption">Chưa có video demo</p>
        </div>
      )}
    </div>
  );
}

DemoVideoPreview.propTypes = {
  value: PropTypes.string,
  file: PropTypes.object,
  className: PropTypes.string,
};

/**
 * Replaces the old "trial lesson link" field: tutors upload an MP4 that is
 * stored in our media library and played from /api/v1/media/{id}/demo-video.
 */
export default function ServiceDemoVideoPicker({ form, onChange, disabled = false, locked = false, error: externalError = '' }) {
  const inputRef = React.useRef(null);
  const [error, setError] = useState('');

  useEffect(() => { setError(''); }, [form.trialVideoFile, form.trialVideoUrl]);

  const choose = (file) => {
    if (!file) return;
    const invalid = validateServiceDemoVideo(file);
    if (invalid) { setError(invalid); return; }
    setError('');
    onChange('trialVideoFile', file);
  };

  const shownError = externalError || error;
  const hasVideo = Boolean(form.trialVideoUrl || form.trialVideoFile);

  return (
    <div className="space-y-3">
      <p className="text-body-reg font-semibold text-fg">Video demo gói học</p>
      <DemoVideoPreview value={form.trialVideoUrl} file={form.trialVideoFile} className="max-w-md" />

      {!locked && (
        <>
          <p id="service-demo-video-hint" className="text-caption text-fg-secondary">
            Chỉ nhận tệp MP4, tối đa 100 MB. Video được tải lên khi bạn lưu gói học.
          </p>
          <input
            ref={inputRef}
            id="service-demo-video"
            type="file"
            accept={DEMO_VIDEO_ACCEPT}
            aria-label="Chọn video demo gói học"
            aria-describedby={shownError ? 'service-demo-video-hint service-demo-video-error' : 'service-demo-video-hint'}
            aria-invalid={Boolean(shownError)}
            disabled={disabled}
            className="sr-only"
            onChange={(event) => {
              choose(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              icon={<Icon name="videocam" size="sm" />}
            >
              {hasVideo ? 'Thay video demo' : 'Chọn video demo'}
            </Button>
            {hasVideo && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={disabled}
                onClick={() => {
                  onChange('trialVideoFile', null);
                  onChange('trialVideoUrl', '');
                  setError('');
                }}
              >
                Xóa video demo
              </Button>
            )}
          </div>
          {form.trialVideoFile && (
            <p className="break-all text-caption text-fg-secondary">
              {form.trialVideoFile.name} · {formatVideoSize(form.trialVideoFile.size)} · Chưa lưu
            </p>
          )}
          {shownError && (
            <p id="service-demo-video-error" role="alert" className="text-caption text-danger-strong">{shownError}</p>
          )}
        </>
      )}

      {locked && !hasVideo && (
        <p className="text-caption text-fg-secondary">Gói học chưa có video demo.</p>
      )}
    </div>
  );
}

ServiceDemoVideoPicker.propTypes = {
  form: PropTypes.shape({
    trialVideoUrl: PropTypes.string,
    trialVideoFile: PropTypes.object,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  locked: PropTypes.bool,
  error: PropTypes.string,
};
