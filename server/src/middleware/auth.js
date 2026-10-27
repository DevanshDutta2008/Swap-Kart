import jwt from 'jsonwebtoken';
export const signToken = (user) =>
  jwt.sign({ id: String(user._id), role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'LOGIN_REQUIRED', message: 'Please log in first.' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'INVALID_TOKEN', message: 'Your session has expired. Please log in again.' });
  }
}
export const requireRole = (role) => (req, res, next) =>
  req.user?.role === role ? next() : res.status(403).json({ error: 'FORBIDDEN', message: 'You are not allowed to do this.' });
