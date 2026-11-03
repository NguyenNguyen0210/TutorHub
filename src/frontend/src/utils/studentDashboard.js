// Student-facing amounts are gross tuition, including the platform fee.
export function summarizeTuition(enrollments) {
  return enrollments.filter(e => ['Active', 'Completed', 'Cancelled'].includes(e.status)).reduce((acc, e) => {
    const total = Math.max(0, Number(e.totalPrice) || 0);
    const released = Math.min(total, Math.max(0, Number(e.releasedAmount) || 0));
    const refunded = Math.min(total - released, Math.max(0, Number(e.refundedAmount) || 0));
    acc.totalTuition += total;
    acc.escrowReleased += released;
    acc.escrowRefunded += refunded;
    acc.escrowRemaining += total - released - refunded;
    return acc;
  }, { totalTuition: 0, escrowReleased: 0, escrowRefunded: 0, escrowRemaining: 0 });
}
