import { ZodError } from 'zod';
export const validate = (schema, where = 'body') => (req, res, next) => {
  const parsed = schema.safeParse(req[where]);
  if (!parsed.success) return next(parsed.error);
  req[where] = parsed.data;
  next();
};
export const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function notFound(req, res) { res.status(404).json({ error: 'NOT_FOUND', message: 'That page does not exist.' }); }
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError)
    return res.status(400).json({ error: 'INVALID_INPUT', message: 'Some fields are not valid.', fields: err.issues.map(i => ({ field: i.path.join('.'), message: i.message })) });
  if (err.name === 'CastError') return res.status(400).json({ error: 'INVALID_ID', message: 'That id is not valid.' });
  if (err.code === 11000) return res.status(409).json({ error: 'DUPLICATE', message: 'That already exists.' });
  console.error(err);
  res.status(500).json({ error: 'SERVER_ERROR', message: 'Something went wrong on our side. Please try again.' });
}
