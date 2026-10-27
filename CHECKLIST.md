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
- [x] DB-free API tests (validation, login-required, error shapes) -- 20 tests passing
- [x] .env.example, .gitignore

## Remaining
### Backend
- [x] Mongoose models: User, Item, Offer, Order, Wishlist, Notification
- [x] Auth routes (register/login, bcrypt, JWT) + auth middleware + role check
- [x] Item routes (create/edit/delete own, search, filter, sort, pagination)
- [x] Wishlist routes (add/remove/list) + price-drop alerts
- [x] Offer routes (make / counter / accept / reject / withdraw)
- [x] Reservation routes (reserve, release, auto-expiry sweep)
- [x] Checkout routes (Razorpay create order, verify signature, safe to call twice)
- [x] Order routes (buyer/seller views, meetup confirm, cancel)
- [x] Input validation + central error handler + rate limit
- [x] Seed script (npm run seed)
- [x] Notification routes (list / mark read)
- [ ] Test everything against a real MongoDB (not possible in my sandbox -- run locally)
### Frontend
- [x] Vite + React app shell, router, auth context (builds cleanly)
- [x] Pages done: Login/Register, Browse (search, filters, sort, pages)
- [x] Pages done: Item detail (save, offer, reserve, owner can change price / remove), Sell, Checkout (hold countdown + Razorpay popup)
- [x] Pages done: Wishlist, Offers (accept / decline / counter / withdraw), Orders (confirm handover, cancel), Alerts with unread badge
- [x] Loading / empty / error / success states on every page
### Ship
- [x] README (all sections required by the brief), DEMO-SCRIPT.md, SUBMISSION.md, client/vercel.json
- [ ] Deploy (Render/Railway for API, Vercel for client, MongoDB Atlas)
- [ ] Git repo with real commit history
- [ ] 3-5 min demo video
- [ ] Submission form

## On YOUR side (only you can do these)
- [ ] Run `npm install` in server/ and client/, copy .env.example to .env, fill MONGO_URI, JWT_SECRET
- [ ] Create a free MongoDB Atlas cluster and paste its connection string
- [ ] Get Razorpay TEST keys (dashboard > Test Mode > API keys) into .env
- [ ] Run the app locally once and click through every flow (my sandbox has no database)
- [ ] Create the GitHub repo and push (history is already in the zip's .git)
- [ ] Deploy API (Render/Railway) + client (Vercel), set the same env variables there
- [ ] Open repo, deployed link and video in an incognito window
- [ ] Record the 3-5 min demo video
- [ ] Submit the Google Form before 27 Oct, 11:59 PM IST
