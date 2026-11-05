import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import StatePanel from './StatePanel';
import { userFacingError } from '@/utils/userFacingError';
import { getErrorPresentation } from '@/utils/errorPresentation';

export default function ErrorState({ error, title, message, onRetry, backPath, backLabel = 'Quay lại', className, showTechnicalDetails = false }) {
  const state = getErrorPresentation(error);
  const destination = backPath || (state.kind === 'unauthorized' ? '/auth/login' : !state.canRetry || !onRetry ? '/' : null);
  const destinationLabel = backPath ? backLabel : state.kind === 'unauthorized' ? 'Đăng nhập' : 'Về trang tìm gia sư';
  const details = showTechnicalDetails && Array.isArray(error?.errors) ? error.errors : [];
  return (
    <StatePanel title={title || state.title} description={userFacingError(message || error, state.message)} icon={state.icon} alert className={className}
      actions={<>
        {onRetry && state.canRetry && <Button onClick={onRetry} icon={<Icon name="refresh" size="sm" />}>Thử lại</Button>}
        {destination && <Button as={Link} to={destination} variant={onRetry && state.canRetry ? 'outline' : 'primary'}>{destinationLabel}</Button>}
      </>}
    >
      {details.length > 0 && <ul className="mx-auto max-w-lg space-y-2 text-left text-sm text-fg-secondary">{details.map((entry, index) => <li key={index}>{userFacingError(entry, 'Vui lòng kiểm tra thông tin và thử lại.')}</li>)}</ul>}
      {showTechnicalDetails && error?.traceId && <details className="mx-auto max-w-lg text-left text-xs text-fg-secondary"><summary className="cursor-pointer py-2">Thông tin hỗ trợ</summary><p className="break-all leading-5">Mã hỗ trợ: <span className="font-mono">{error.traceId}</span></p></details>}
    </StatePanel>
  );
}
