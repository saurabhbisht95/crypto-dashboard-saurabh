# CryptoTracker Full-Stack Architecture

CryptoTracker is now structured as a production-style full-stack application:

- React frontend with protected routes, auth state, portfolio, alerts, dashboard, compare, and watchlist pages.
- Express API with versioned routes under `/api/v1`.
- MongoDB models for users, portfolio holdings, and price alerts.
- Backend CoinGecko proxy with in-memory caching to reduce rate-limit pressure.
- Live price polling, market heatmap, market intelligence, and system status APIs.
- Recruiter demo login that seeds a watchlist, sample portfolio, and alerts.
- JWT auth with secure HTTP-only cookies and a bearer-token-compatible middleware.

## Local Development

Backend:

```bash
cd Backend
cp .env.example .env
npm install
npm run dev
```

Frontend:

```bash
cd Frontend
cp .env.example .env
npm install
npm start
```

## Feature Map

- Auth: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`
- Demo: `POST /api/v1/auth/demo`
- Market data: `GET /api/v1/market/coins`, `GET /api/v1/market/coins/:coinId`, `GET /api/v1/market/summary`
- Live market: `GET /api/v1/market/live-prices`, `GET /api/v1/market/heatmap`, `GET /api/v1/market/intelligence`
- Watchlist: `GET /api/v1/watchlist`, `POST /api/v1/watchlist/:coinId`, `DELETE /api/v1/watchlist/:coinId`
- Portfolio: `GET /api/v1/portfolio`, `POST /api/v1/portfolio/holdings`, `DELETE /api/v1/portfolio/holdings/:holdingId`
- Alerts: `GET /api/v1/alerts`, `POST /api/v1/alerts`, `PATCH /api/v1/alerts/:alertId/toggle`, `DELETE /api/v1/alerts/:alertId`
- System: `GET /api/v1/system/status`

## Production Notes

- Keep the real MongoDB URI only in `Backend/.env` or your deployment provider secrets.
- Set a long random `JWT_SECRET` before deployment.
- In production, set `CORS_ORIGIN` to your deployed frontend URL.
- Add `COINGECKO_API_KEY` on the backend only. Do not expose market API keys in React env variables.
- Tune `MARKET_FETCH_TIMEOUT_MS` if your deployment region needs a longer provider timeout.
