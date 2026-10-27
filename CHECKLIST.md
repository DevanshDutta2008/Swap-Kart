# SwapKart – build checklist
Campus second-hand marketplace (React + Express + MongoDB + JWT + Razorpay test mode).
Same stack/flow as ShopKart: Lab1-2 auth, Lab3 products, Lab4 wishlist, Lab5 cart (here: reservation hold), Lab6 checkout/orders.

## Done
- [x] Idea + 5 core workflows decided
- [x] Server folder structure, package.json
- [x] Pure business logic: offer negotiation state machine (services/offers.js)
- [x] Pure business logic: reservation hold with expiry (services/reservation.js)
- [x] Order lifecycle state machine (services/orders.js)
- [x] Unit tests for all three (node --test)
- [x] DB-free API tests (validation, login-required, error shapes) -- 16 tests passing
- [x] .env.example, .gitignore

## Remaining
### Backend
- [x] Mongoose models: User, Item, Offer, Order, Wishlist, Notification
- [x] Auth routes (register/login, bcrypt, JWT) + auth middleware + role check
- [x] Item routes (create/edit/delete own, search, filter, sort, pagination)
- [x] Wishlist routes (add/remove/list) + price-drop alerts
- [x] Offer routes (make / counter / accept / reject / withdraw)
- [x] Reservation routes (reserve, release, auto-expiry sweep)
- [ ] Checkout routes (Razorpay create order, verify signature, webhook-safe/idempotent)
- [ ] Order routes (buyer/seller views, meetup confirm, cancel)
- [x] Input validation + central error handler + rate limit
- [ ] Seed script
- [x] Notification routes (list / mark read)
- [ ] Test everything against a real MongoDB (not possible in my sandbox -- run locally)
### Frontend
- [ ] Vite + React app shell, router, auth context
- [ ] Pages: Browse, Item detail, Sell, Wishlist, Offers, Reservation/Checkout, Orders, Notifications
- [ ] Loading / empty / error / success states
### Ship
- [ ] README (all sections required by the brief)
- [ ] Deploy (Render/Railway for API, Vercel for client, MongoDB Atlas)
- [ ] Git repo with real commit history
- [ ] 3-5 min demo video
- [ ] Submission form
