import { marketService } from "../services/marketService";

export const get100Coins = (options = {}) => {
  return marketService.getCoins({
    page: options.page || 1,
    perPage: options.perPage || 100,
  });
};
