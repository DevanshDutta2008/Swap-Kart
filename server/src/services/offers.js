// Offer negotiation as an explicit state machine.
// pending   : buyer's offer waiting on seller
// countered : seller's counter waiting on buyer
export const OPEN = ['pending', 'countered'];

const RULES = {
  pending:   { seller: ['accept', 'reject', 'counter'], buyer: ['withdraw'] },
  countered: { buyer: ['accept', 'reject', 'counter'], seller: ['withdraw'] },
};
const NEXT = { accept: 'accepted', reject: 'rejected', withdraw: 'withdrawn', counter: null };

export function validateAmount(amount, listPrice) {
  if (!Number.isFinite(amount) || amount <= 0) return 'INVALID_AMOUNT';
  if (amount > listPrice) return 'ABOVE_LIST_PRICE';
  if (amount < listPrice * 0.4) return 'TOO_LOW'; // stops lowball spam
  return null;
}

// actor: 'buyer' | 'seller'. Returns { ok, reason?, status?, amount? }.
export function applyAction(offer, actor, action, { amount, listPrice, now = new Date() } = {}) {
  if (!OPEN.includes(offer.status)) return { ok: false, reason: 'OFFER_CLOSED' };
  if (offer.expiresAt && new Date(offer.expiresAt) <= now) return { ok: false, reason: 'OFFER_EXPIRED' };
  if (!RULES[offer.status][actor]?.includes(action)) return { ok: false, reason: 'NOT_YOUR_TURN' };
  if (action === 'counter') {
    const err = validateAmount(amount, listPrice);
    if (err) return { ok: false, reason: err };
    return { ok: true, status: actor === 'seller' ? 'countered' : 'pending', amount };
  }
  return { ok: true, status: NEXT[action] };
}

export const OFFER_TTL_HOURS = 48;
export const newExpiry = (now = new Date()) => new Date(now.getTime() + OFFER_TTL_HOURS * 3600000);
