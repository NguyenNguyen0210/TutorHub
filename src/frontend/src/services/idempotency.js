export function idempotencyHeaders(key) {
  return { 'Idempotency-Key': key || crypto.randomUUID() };
}
