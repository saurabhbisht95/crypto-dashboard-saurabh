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
  getDiscovery() {
    return http.get("/market/discovery").then((res) => res.data.data);
  },
  getScreener(params = {}) {
    return http
      .get("/market/screener", { params })
      .then((res) => res.data.data);
  },
  getCategories() {
    return http
      .get("/market/categories")
      .then((res) => res.data.data.categories);
  },
  getChains(filter) {
    return http
      .get("/market/chains", { params: { filter } })
      .then((res) => res.data.data.chains);
  },
  getExchanges(params = {}) {
    return http
      .get("/market/exchanges", { params })
      .then((res) => res.data.data.exchanges);
  },
  getNfts(params = {}) {
    return http.get("/market/nfts", { params }).then((res) => res.data.data);
  },
  convert(params = {}) {
    return http.get("/market/convert", { params }).then((res) => res.data.data);
  },
  getCoinAdvanced(coinId, params = {}) {
    return http
      .get(`/market/coins/${coinId}/advanced`, { params })
      .then((res) => res.data.data);
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
