import { http } from "./http";

export const alertService = {
  getAlerts() {
    return http.get("/alerts").then((res) => res.data.data.alerts);
  },
  createAlert(payload) {
    return http.post("/alerts", payload).then((res) => res.data.data.alerts);
  },
  toggleAlert(alertId) {
    return http
      .patch(`/alerts/${alertId}/toggle`)
      .then((res) => res.data.data.alerts);
  },
  deleteAlert(alertId) {
    return http.delete(`/alerts/${alertId}`).then((res) => res.data.data.alerts);
  },
};
