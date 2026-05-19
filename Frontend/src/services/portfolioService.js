import { http } from "./http";

export const portfolioService = {
  getPortfolio() {
    return http.get("/portfolio").then((res) => res.data.data.portfolio);
  },
  saveHolding(payload) {
    return http
      .post("/portfolio/holdings", payload)
      .then((res) => res.data.data.portfolio);
  },
  deleteHolding(holdingId) {
    return http
      .delete(`/portfolio/holdings/${holdingId}`)
      .then((res) => res.data.data.portfolio);
  },
};
