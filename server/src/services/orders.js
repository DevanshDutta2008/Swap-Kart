// Order lifecycle: pending_payment -> paid -> completed (or cancelled / refund_due)
const FLOW = {
  pending_payment: ['paid', 'cancelled'],
  paid: ['completed', 'refund_due'],
  completed: [], cancelled: [], refund_due: [],
};
export const canMove = (from, to) => (FLOW[from] || []).includes(to);

// Both sides confirm meetup handover before an order completes.
export function confirmHandover(order, actor) {
  if (order.status !== 'paid') return { ok: false, reason: 'NOT_PAID' };
  const confirmed = { ...order.confirmed, [actor]: true };
  const done = confirmed.buyer && confirmed.seller;
  return { ok: true, confirmed, status: done ? 'completed' : 'paid' };
}
