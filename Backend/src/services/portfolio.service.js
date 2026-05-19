import { getMarketCoins } from "./coinGecko.service.js";

export const enrichHoldings = async (holdings) => {
  const coinIds = [...new Set(holdings.map((holding) => holding.coinId))];
  const marketCoins = coinIds.length
    ? await getMarketCoins({ ids: coinIds, perPage: coinIds.length })
    : [];
  const coinById = new Map(marketCoins.map((coin) => [coin.id, coin]));

  const enrichedHoldings = holdings.map((holding) => {
    const coin = coinById.get(holding.coinId);
    const currentPrice = coin?.current_price || 0;
    const investedValue = holding.amount * holding.averageBuyPrice;
    const currentValue = holding.amount * currentPrice;
    const profitLoss = currentValue - investedValue;
    const profitLossPercentage =
      investedValue > 0 ? (profitLoss / investedValue) * 100 : 0;

    return {
      id: holding._id,
      coinId: holding.coinId,
      symbol: holding.symbol,
      name: holding.name,
      amount: holding.amount,
      averageBuyPrice: holding.averageBuyPrice,
      currentPrice,
      currentValue,
      investedValue,
      profitLoss,
      profitLossPercentage,
      image: coin?.image || "",
      priceChange24h: coin?.price_change_percentage_24h || 0,
      updatedAt: holding.updatedAt,
    };
  });

  const totals = enrichedHoldings.reduce(
    (summary, holding) => {
      summary.investedValue += holding.investedValue;
      summary.currentValue += holding.currentValue;
      summary.profitLoss += holding.profitLoss;
      return summary;
    },
    { investedValue: 0, currentValue: 0, profitLoss: 0 }
  );

  totals.profitLossPercentage =
    totals.investedValue > 0
      ? (totals.profitLoss / totals.investedValue) * 100
      : 0;

  const allocation = enrichedHoldings.map((holding) => ({
    coinId: holding.coinId,
    name: holding.name,
    value: holding.currentValue,
    percentage:
      totals.currentValue > 0
        ? (holding.currentValue / totals.currentValue) * 100
        : 0,
  }));

  return {
    holdings: enrichedHoldings,
    summary: totals,
    allocation,
  };
};
