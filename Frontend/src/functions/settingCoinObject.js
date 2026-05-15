export const buildCoinObject = (data) => {
  if (!data?.id || !data?.market_data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name || data.id,
    symbol: data.symbol || "",
    image: data.image?.large || data.image?.small || data.image?.thumb || "",
    desc: data.description?.en || "No description available for this coin.",
    price_change_percentage_24h:
      data.market_data.price_change_percentage_24h || 0,
    total_volume: data.market_data.total_volume?.usd || 0,
    current_price: data.market_data.current_price?.usd || 0,
    market_cap: data.market_data.market_cap?.usd || 0,
  };
};

export const settingCoinObject = (data, setCoin) => {
  const coin = buildCoinObject(data);

  if (coin) {
    setCoin(coin);
  }

  return coin;
};
