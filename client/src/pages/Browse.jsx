import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

const CATS = ['books', 'electronics', 'furniture', 'clothing', 'cycles', 'other'];
const CONDS = ['new', 'like-new', 'good', 'fair'];
const blank = { q: '', category: '', condition: '', minPrice: '', maxPrice: '', sort: 'newest', page: 1 };

export default function Browse() {
  const [f, setF] = useState(blank);
  const [q, setQ] = useState(''); // typed text; applied after a short pause
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { const t = setTimeout(() => setF((p) => ({ ...p, q, page: 1 })), 350); return () => clearTimeout(t); }, [q]);
  useEffect(() => {
    let live = true; setError(null);
    api('/items', { query: f }).then((d) => live && setData(d)).catch((e) => live && setError(e));
    return () => { live = false; };
  }, [f]);

  const pick = (k) => (e) => setF({ ...f, [k]: e.target.value, page: 1 });
  const reset = () => { setQ(''); setF(blank); };

  return (
    <>
      <h1>Things your campus is selling</h1>
      <div className="filters">
        <input placeholder="Search items" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search items" />
        <select value={f.category} onChange={pick('category')} aria-label="Category"><option value="">All categories</option>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
        <select value={f.condition} onChange={pick('condition')} aria-label="Condition"><option value="">Any condition</option>{CONDS.map((c) => <option key={c}>{c}</option>)}</select>
        <input type="number" min="0" placeholder="Min ₹" value={f.minPrice} onChange={pick('minPrice')} aria-label="Minimum price" />
        <input type="number" min="0" placeholder="Max ₹" value={f.maxPrice} onChange={pick('maxPrice')} aria-label="Maximum price" />
        <select value={f.sort} onChange={pick('sort')} aria-label="Sort"><option value="newest">Newest first</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select>
      </div>

      {error ? <p className="state err" role="alert">{error.message} <button className="link" onClick={() => setF({ ...f })}>Try again</button></p>
        : !data ? <p className="state">Loading items…</p>
        : data.items.length === 0 ? <p className="state">Nothing matches these filters. <button className="link" onClick={reset}>Clear filters</button></p>
        : (
          <>
            <ul className="grid">
              {data.items.map((it) => (
                <li key={it._id}>
                  <Link to={`/items/${it._id}`} className="card item">
                    <div className="pic">{it.images?.[0] ? <img src={it.images[0]} alt="" loading="lazy" /> : <span>{it.category}</span>}</div>
                    <h2>{it.title}</h2>
                    <p className="price">₹{it.price}</p>
                    <p className="meta">{it.condition} · {it.seller?.hostel || it.seller?.name}</p>
                    {it.status === 'reserved' && <span className="tag">On hold</span>}
                  </Link>
                </li>
              ))}
            </ul>
            {data.pages > 1 && (
              <div className="pager">
                <button className="btn ghost" disabled={f.page <= 1} onClick={() => setF({ ...f, page: f.page - 1 })}>Previous</button>
                <span>Page {data.page} of {data.pages}</span>
                <button className="btn ghost" disabled={f.page >= data.pages} onClick={() => setF({ ...f, page: f.page + 1 })}>Next</button>
              </div>
            )}
          </>
        )}
    </>
  );
}
