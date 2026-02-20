# 🚗 RIDECHAIN — Campus Ride-Share with Crypto Settlement
> RIFT 2026 Hackathon • Algorand Open Innovation Track

Peer-to-peer campus ride-sharing where fares are settled instantly on **Algorand Testnet** via Pera Wallet. No middlemen, no cash, full transparency on-chain.

---

## 🏗 Project Structure

```
ridechain/
├── frontend/
│   ├── src/
│   │   └── App.jsx          ← rideshare.jsx (all-in-one React app)
│   ├── package.json
│   └── .env.example
├── backend/
│   ├── server.js            ← rideshare_server.js (Express API)
│   ├── package.json
│   └── .env.example
└── README.md
```

---

## ⚡ Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

The frontend (`rideshare.jsx`) is a **fully self-contained React component** — works standalone without the backend via localStorage. All algorithms run in-browser.

### Backend
```bash
cd backend
npm install
node server.js
# API at http://localhost:5000
```

Install dependencies:
```bash
npm install express cors uuid
```

---

## 🌍 Environment Variables

**Frontend `.env`:**
```env
VITE_API_URL=http://localhost:5000
VITE_MAPS_API_KEY=your_google_maps_api_key
VITE_ALGOD_URL=https://testnet-api.algonode.cloud
VITE_ALGOD_TOKEN=
```

**Backend `.env`:**
```env
PORT=5000
ALGOD_API_URL=https://testnet-api.algonode.cloud
ALGOD_API_TOKEN=
MAPS_API_KEY=your_google_maps_api_key
MONGODB_URI=mongodb://localhost:27017/ridechain
```

---

## 🔗 API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/trips` | — | List trips (filterable) |
| POST | `/api/trips` | Wallet | Post a new ride |
| PATCH | `/api/trips/:id/complete` | Driver | Complete trip |
| POST | `/api/bookings` | Wallet | Book a seat + record tx |
| GET | `/api/bookings` | Wallet | Get rider/driver bookings |
| PATCH | `/api/bookings/:id/complete` | Driver | Mark booking complete |
| POST | `/api/ratings` | Wallet | Submit a rating |
| GET | `/api/ratings/:wallet` | — | Get ratings for wallet |
| GET | `/api/profile` | Wallet | Get full profile |
| POST | `/api/calculate-fare` | — | Calculate fare by distance |

Authentication: pass `x-wallet-address` header with Algorand wallet address.

---

## ⬡ Algorand Integration

Payments use **Algorand Testnet** via Pera Wallet (WalletConnect). 

```javascript
// Example using algosdk
import algosdk from "algosdk";
const algodClient = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "");

const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
  from: riderWallet,
  to: driverWallet,
  amount: algosdk.algosToMicroalgos(fare),
  suggestedParams: await algodClient.getTransactionParams().do(),
});
// Sign with Pera Wallet, broadcast, get txId
```

All transaction IDs are viewable at: `https://testnet.algoexplorer.io/tx/{txId}`

---

## 🚀 Deployment

**Frontend → Vercel:**
```bash
npm install -g vercel
cd frontend
vercel deploy
```

**Backend → Render:**
1. New Web Service → connect GitHub repo
2. Root directory: `backend`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add environment variables in Render dashboard

---

## 🔥 Features

| Feature | Status |
|---------|--------|
| Pera Wallet connection | ✅ |
| Post & find rides | ✅ |
| Auto fare calculation (distance × rate) | ✅ |
| ALGO payment with tx ID | ✅ |
| AlgoExplorer transaction link | ✅ |
| Booking management (Pending/Paid/Completed) | ✅ |
| Driver dashboard | ✅ |
| Rider dashboard | ✅ |
| 5-star rating system | ✅ |
| Profile with transaction history | ✅ |
| localStorage persistence | ✅ |
| Toast notifications | ✅ |
| Responsive design | ✅ |

---

## 📦 Tech Stack

- **Frontend**: React 18, DM Sans + Syne fonts, CSS animations
- **Backend**: Node.js, Express.js
- **Blockchain**: Algorand Testnet, AlgoSDK, Pera Wallet
- **Maps**: Google Maps API (pluggable)
- **Storage**: localStorage (frontend), in-memory/MongoDB (backend)
