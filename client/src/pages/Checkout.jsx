import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((ok, fail) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = ok; s.onerror = () => fail(new Error('Could not load the payment window. Check your internet and try again.'));
    document.body.appendChild(s);
  });
}

export default function Checkout() {
  const { id } = useParams();
  const nav = useNavigate();
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);
  const [left, setLeft] = useState(null); // seconds left on the hold
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => { // Opening this page puts the item on hold for you.
    api(`/reservations/${id}`, { method: 'POST' }).then((d) => setItem(d.item)).catch(setError);
  }, [id]);

  useEffect(() => {
    if (!item?.reservedUntil) return;
    const tick = () => setLeft(Math.max(0, Math.round((new Date(item.reservedUntil) - Date.now()) / 1000)));
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t);
  }, [item]);

  async function pay() {
    setBusy(true); setError(null);
    try {
      const order = await api(`/checkout/${id}`, { method: 'POST' });
      await loadRazorpay();
      new window.Razorpay({
        key: order.keyId, order_id: order.razorpayOrderId, amount: order.amount * 100, currency: 'INR', name: 'SwapKart', description: item.title,
        handler: async (r) => {
          try {
            await api('/checkout/verify/payment', { method: 'POST', body: { razorpayOrderId: r.razorpay_order_id, razorpayPaymentId: r.razorpay_payment_id, razorpaySignature: r.razorpay_signature } });
            setPaid(true);
          } catch (e) { setError(e); } finally { setBusy(false); }
        },
        modal: { ondismiss: () => setBusy(false) },
      }).open();
    } catch (e) { setError(e); setBusy(false); }
  }

  async function cancel() { await api(`/reservations/${id}`, { method: 'DELETE' }).catch(() => {}); nav(`/items/${id}`); }

  if (paid) return <div className="card narrow"><h1>Payment received</h1><p>Meet the seller, hand over the item, then confirm the handover so the order can close.</p><Link className="btn" to="/">Keep browsing</Link></div>;
  if (error && !item) return <p className="state err" role="alert">{error.message} <Link to={`/items/${id}`}>Back to the item</Link></p>;
  if (!item) return <p className="state">Holding this item for you…</p>;

  const mm = left != null ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : '';
  return (
    <div className="card narrow">
      <h1>Checkout</h1>
      <p><strong>{item.title}</strong></p>
      <p className="price">₹{item.price}</p>
      <p className="meta">If the seller accepted your offer, the agreed price is charged instead.</p>
      {left === 0 ? <p className="banner">Your hold has ended. <Link to={`/items/${id}`}>Go back and reserve again.</Link></p>
        : <p className="banner">Held for you: {mm}</p>}
      {error && <p className="err" role="alert">{error.message}</p>}
      <button className="btn" onClick={pay} disabled={busy || left === 0}>{busy ? 'Opening payment…' : 'Pay now'}</button>
      <button className="link" onClick={cancel}>Cancel and release the item</button>
      <small className="meta">Test mode: use Razorpay's test card details, no real money moves.</small>
    </div>
  );
}
