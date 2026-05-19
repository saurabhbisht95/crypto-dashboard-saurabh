import { http } from "./http";

export const systemService = {
  getStatus() {
    return http.get("/system/status").then((res) => res.data.data);
  },
};
