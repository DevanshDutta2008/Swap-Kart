# SwapKart

A campus marketplace where students buy and sell second-hand things (books, cycles, furniture, electronics, clothes) with each other, including price negotiation and test-mode online payment.

**Live app:** _add your deployed link here_  
**Demo video:** _add your video link here_

## Problem Statement
Students leave campus every year with items they no longer need, while new students buy the same things at full price. Today this happens in messy group chats: no search, no way to know if an item is still available, haggling gets lost in scrolling messages, and two people can both be told "yes, it's yours".

## Target Users
- **Sellers:** students who want to clear out belongings quickly.
- **Buyers:** students (especially new joiners) who want affordable items from people on the same campus.

## Solution
SwapKart gives every one-of-a-kind item a clear state (available, on hold, sold), turns haggling into a structured offer and counter-offer flow, protects a buyer who is paying with a short hold, and closes each deal only after both people confirm the handover.

## Key Features
1. **Accounts:** register and log in (passwords hashed, 7-day sessions).
2. **Browse and list:** search, category, condition and price filters, sorting and pages. Sellers list, edit and remove their own items.
3. **Wishlist with price-drop alerts:** save an item; if the seller lowers the price, you get an alert.
4. **Offers:** buyer offers (40%-100% of the price), seller accepts, declines or counters, buyer answers the counter. Each side can only act on its own turn. Offers expire after 48 hours.
5. **Reserve, pay, hand over:** a 10-minute hold stops two buyers paying for the same item. Payment uses Razorpay test mode (charged at the agreed offer price if there is one). The order completes only when buyer and seller both confirm the handover.

## Tech Stack
React 18 + Vite + React Router · Node.js + Express · MongoDB + Mongoose · JWT + bcrypt · Zod (input validation) · Razorpay (test mode) · Node's built-in test runner.

## Architecture
```
React client ──HTTP/JSON──> Express API ──> MongoDB
                               │
                               └── Razorpay (create order, then verify signature)
```
- `server/src/services/` holds the business rules as plain functions with no database access: `offers.js` (negotiation state machine), `reservation.js` (hold rules), `orders.js` (order lifecycle), `razorpay.js` (signature check). They are unit tested.
- `server/src/routes/` are thin HTTP layers: auth, items, wishlist, offers, reservations, checkout, orders, notifications.
- `server/src/middleware/` handles login checks, validation and one central error format.
- **Race protection:** reserving an item, acting on an offer and marking an item sold all use a single conditional database update, so two simultaneous requests cannot both succeed.
- **Payment safety:** the server never trusts the browser saying "paid". It recomputes Razorpay's HMAC signature, and the verify step is safe to call twice.
- Data: `User`, `Item`, `Offer`, `Order`, `Wishlist` (unique per user and item), `Notification`.

## Local Setup
Requirements: Node 18+ and a MongoDB (local or Atlas).
```bash
# API
cd server
npm install
cp .env.example .env      # then fill in the values
npm run seed              # optional demo data (asha@demo.test / ravi@demo.test, password demo12345)
npm run dev               # http://localhost:5000

# Client (new terminal)
cd client
npm install
npm run dev               # http://localhost:5173 (proxies /api to the API)
```
Run the tests: `cd server && npm test`

## Environment Variables
| Where | Name | Purpose |
|---|---|---|
| server | `MONGO_URI` | MongoDB connection string |
| server | `JWT_SECRET` | long random string used to sign logins |
| server | `CLIENT_URL` | the client's address, allowed by CORS |
| server | `PORT` | optional, default 5000 |
| server | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay **test** keys |
| client | `VITE_API_URL` | API address when deployed (empty for local dev) |

Never commit `.env`. It is in `.gitignore`.

## Deployment
- **Database:** MongoDB Atlas free cluster; allow network access from anywhere so the host can connect.
- **API (Render or Railway):** root folder `server`, build `npm install`, start `npm start`, add all server variables above. `CLIENT_URL` must be the exact client address.
- **Client (Vercel):** root folder `client`, build `npm run build`, output `dist`, set `VITE_API_URL` to the API address (no trailing slash). `client/vercel.json` makes page refreshes work.
- To try payments, use Razorpay test mode and its published test card details; no real money moves.

## Notes
- Built as the end-term project, applying the ShopKart lab series (auth, products, wishlist, cart, checkout and orders) to a different product with its own workflows. It is not a copy of any existing open-source project.
- Item photos are links to images; there is no file upload.
