import { http } from "./http";

export const authService = {
  register(payload) {
    return http.post("/auth/register", payload).then((res) => res.data.data);
  },
  login(payload) {
    return http.post("/auth/login", payload).then((res) => res.data.data);
  },
  logout() {
    return http.post("/auth/logout").then((res) => res.data);
  },
  me() {
    return http.get("/auth/me").then((res) => res.data.data);
  },
};
