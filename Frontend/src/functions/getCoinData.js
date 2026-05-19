import { marketService } from "../services/marketService";

export const getCoinData = (id) => {
  return marketService.getCoin(id);
};
