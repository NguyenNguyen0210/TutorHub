export function getHoldingSeconds(expiresAt, now = Date.now()) {
  const deadline = new Date(expiresAt).getTime();
  if (!expiresAt || !Number.isFinite(deadline)) return 0;
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

export function hasBookingExpired(booking, now = Date.now()) {
  return ['Cancelled', 'Expired'].includes(booking?.status)
    || getHoldingSeconds(booking?.holdingExpiresAt, now) === 0;
}
