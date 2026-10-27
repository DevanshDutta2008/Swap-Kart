const BASE = import.meta.env.VITE_API_URL || '';
export class ApiError extends Error {
  constructor(data, status) { super(data?.message || 'Something went wrong. Please try again.'); this.code = data?.error; this.fields = data?.fields; this.status = status; }
}
export const getToken = () => localStorage.getItem('sk_token');
export const setToken = (t) => (t ? localStorage.setItem('sk_token', t) : localStorage.removeItem('sk_token'));

export async function api(path, { method = 'GET', body, query } = {}) {
  const qs = query ? '?' + new URLSearchParams(Object.entries(query).filter(([, v]) => v !== '' && v != null)) : '';
  let res;
  try {
    res = await fetch(`${BASE}/api${path}${qs}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(getToken() && { Authorization: `Bearer ${getToken()}` }) },
      body: body && JSON.stringify(body),
    });
  } catch {
    throw new ApiError({ message: 'Can not reach the server. Check your internet and try again.' }, 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data, res.status);
  return data;
}
