import Notification from '../models/Notification.js';
export const notify = (user, type, message, item) => Notification.create({ user, type, message, item });
