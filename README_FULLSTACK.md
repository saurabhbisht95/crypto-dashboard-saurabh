# CryptoTracker Full-Stack Architecture

CryptoTracker is now structured as a production-style full-stack application:

- React frontend with protected routes, auth state, portfolio, alerts, dashboard, compare, and watchlist pages.
- Express API with versioned routes under `/api/v1`.
- MongoDB models for users, portfolio holdings, and price alerts.
- Backend CoinGecko proxy with in-memory caching to reduce rate-limit pressure.
- Live price polling, market heatmap, market intelligence, discovery, screener, exchange, NFT, converter, and system status APIs.
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
- Discovery: `GET /api/v1/market/discovery`, `GET /api/v1/market/screener`, `GET /api/v1/market/categories`, `GET /api/v1/market/chains`
- Live market: `GET /api/v1/market/live-prices`, `GET /api/v1/market/heatmap`, `GET /api/v1/market/intelligence`, `GET /api/v1/market/convert`
- Exchanges and NFTs: `GET /api/v1/market/exchanges`, `GET /api/v1/market/nfts`
- Coin detail: `GET /api/v1/market/coins/:coinId/advanced`
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
- Keep `MARKET_PROVIDER_MIN_INTERVAL_MS` near `2500` for public/demo CoinGecko usage so the backend stays around 24 provider calls per minute. Lower it only after moving to a paid provider tier.
- Keep `MARKET_STALE_CACHE_TTL_MS` enabled. The backend now serves stale cache instantly, refreshes in the background, and only uses a short fallback snapshot when CoinGecko returns `429` or temporary `5xx` errors.
- Add a paid CoinGecko API key before launch for higher and contract-backed rate limits. The app is protected from short outages, but a serious production crypto product should not depend only on the shared public API.
