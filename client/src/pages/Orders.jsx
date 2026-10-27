import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

const LABEL = { pending_payment: 'Waiting for payment', paid: 'Paid, handover pending', completed: 'Completed', cancelled: 'Cancelled', refund_due: 'Refund due' };

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);
  const [note, setNote] = useState(null);
  const load = () => api('/orders').then((d) => setOrders(d.orders)).catch(setError);
  useEffect(() => { load(); }, []);

  async function act(o, what) {
    setNote(null);
    try { await api(`/orders/${o._id}/${what}`, { method: 'POST' }); } catch (e) { setNote(e.message); }
    load();
  }

  if (error) return <p className="state err" role="alert">{error.message}</p>;
  if (!orders) return <p className="state">Loading orders…</p>;
  return (
    <>
      <h1>Orders</h1>
      {note && <p className="err" role="alert">{note}</p>}
      {orders.length === 0 ? <p className="state">No orders yet. <Link to="/">Browse items</Link></p> : (
        <ul className="list">
          {orders.map((o) => {
            const me = o.buyer._id === user.id ? 'buyer' : 'seller';
            return (
              <li key={o._id} className="card stack">
                <div className="rowcard">
                  <div>
                    <strong>{o.item?.title || 'Removed item'}</strong>
                    <p className="meta">{me === 'buyer' ? `Bought from ${o.seller.name}` : `Sold to ${o.buyer.name}`} · {new Date(o.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="right"><span className="price">₹{o.amount}</span><p className="meta">{LABEL[o.status]}</p></div>
                </div>
                {o.status === 'paid' && (o.confirmed[me]
                  ? <p className="ok">You confirmed the handover. Waiting for the {me === 'buyer' ? 'seller' : 'buyer'}.</p>
                  : <button className="btn" onClick={() => act(o, 'confirm')}>{me === 'buyer' ? 'I received the item' : 'I handed over the item'}</button>)}
                {o.status === 'pending_payment' && me === 'buyer' && (
                  <div className="row"><Link className="btn" to={`/checkout/${o.item._id}`}>Continue to payment</Link><button className="btn ghost" onClick={() => act(o, 'cancel')}>Cancel order</button></div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
