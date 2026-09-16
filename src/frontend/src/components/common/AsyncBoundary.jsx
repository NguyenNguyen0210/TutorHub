import React from 'react';
import { CardSkeleton } from './Skeleton';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';

/**
 * P4: Coordinates asynchronous states (loading skeleton, error, empty, content).
 * Prevents pages from flashing blank or returning null.
 */
export default function AsyncBoundary({
  loading = false,
  error = null,
  data = null,
  isEmpty = false,
  onRetry,
  loadingFallback,
  emptyProps = {},
  errorProps = {},
  children,
}) {
  if (loading) {
    return loadingFallback || <CardSkeleton count={3} />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} {...errorProps} />;
  }

  if (isEmpty || (Array.isArray(data) && data.length === 0)) {
    return <EmptyState {...emptyProps} />;
  }

  if (typeof children === 'function') {
    return children(data);
  }

  return children;
}
