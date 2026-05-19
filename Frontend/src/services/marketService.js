import { http } from "./http";

export const marketService = {
  getCoins(params = {}) {
    return http.get("/market/coins", { params }).then((res) => res.data.data.coins);
  },
  getCoin(coinId) {
    return http.get(`/market/coins/${coinId}`).then((res) => res.data.data.coin);
  },
  getCoinChart(coinId, params = {}) {
    return http
      .get(`/market/coins/${coinId}/chart`, { params })
      .then((res) => res.data.data.chart);
  },
  getSummary() {
    return http.get("/market/summary").then((res) => res.data.data);
  },
  getLivePrices(ids) {
    return http
      .get("/market/live-prices", {
        params: {
          ids: ids.join(","),
        },
      })
      .then((res) => res.data.data);
  },
  getHeatmap(limit = 50) {
    return http
      .get("/market/heatmap", { params: { limit } })
      .then((res) => res.data.data.heatmap);
  },
  getIntelligence() {
    return http.get("/market/intelligence").then((res) => res.data.data);
  },
};
