import { http } from "./http";

export const watchlistService = {
  getWatchlist() {
    return http.get("/watchlist").then((res) => res.data.data.watchlist);
  },
  addCoin(coinId) {
    return http.post(`/watchlist/${coinId}`).then((res) => res.data.data.watchlist);
  },
  removeCoin(coinId) {
    return http.delete(`/watchlist/${coinId}`).then((res) => res.data.data.watchlist);
  },
};
