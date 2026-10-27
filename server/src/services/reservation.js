// Reservation hold: the "cart" of a one-of-a-kind item. A buyer gets a time-limited lock.
export const HOLD_MINUTES = 10;

export function isHoldActive(item, now = new Date()) {
  return item.status === 'reserved' && item.reservedUntil && new Date(item.reservedUntil) > now;
}

// Returns { ok, reason?, patch? }. Never mutates.
export function tryReserve(item, buyerId, sellerOwnsIt, now = new Date()) {
  if (sellerOwnsIt) return { ok: false, reason: 'OWN_ITEM' };
  if (item.status === 'sold') return { ok: false, reason: 'SOLD' };
  if (isHoldActive(item, now)) {
    return String(item.reservedBy) === String(buyerId)
      ? { ok: true, patch: {}, alreadyHeld: true }
      : { ok: false, reason: 'HELD_BY_OTHER' };
  }
  return {
    ok: true,
    patch: { status: 'reserved', reservedBy: buyerId, reservedUntil: new Date(now.getTime() + HOLD_MINUTES * 60000) },
  };
}

export function releasePatch() {
  return { status: 'available', reservedBy: null, reservedUntil: null };
}

// Expired hold that was never paid for -> should go back on sale.
export function needsRelease(item, now = new Date()) {
  return item.status === 'reserved' && item.reservedUntil && new Date(item.reservedUntil) <= now;
}
