import { Alert } from "../models/Alert.model.js";
import { env } from "../config/env.js";
import { getSimplePrices } from "./coinLore.service.js";

const isAlertTriggered = (alert, currentPrice) => {
  if (alert.direction === "above") {
    return currentPrice >= alert.targetPrice;
  }

  return currentPrice <= alert.targetPrice;
};

export const evaluateAlerts = async (userId = null) => {
  const query = {
    active: true,
    triggered: false,
    ...(userId ? { user: userId } : {}),
  };
  const alerts = await Alert.find(query);
  const coinIds = [...new Set(alerts.map((alert) => alert.coinId))];
  const prices = await getSimplePrices(coinIds);

  const updates = alerts.map(async (alert) => {
    const currentPrice = prices[alert.coinId]?.usd;

    if (!currentPrice || !isAlertTriggered(alert, currentPrice)) {
      return alert;
    }

    alert.triggered = true;
    alert.active = false;
    alert.triggeredAt = new Date();
    return alert.save();
  });

  await Promise.all(updates);
};

export const decorateAlerts = async (alerts) => {
  const coinIds = [...new Set(alerts.map((alert) => alert.coinId))];
  const prices = await getSimplePrices(coinIds);

  return alerts.map((alert) => ({
    id: alert._id,
    coinId: alert.coinId,
    symbol: alert.symbol,
    name: alert.name,
    targetPrice: alert.targetPrice,
    direction: alert.direction,
    active: alert.active,
    triggered: alert.triggered,
    triggeredAt: alert.triggeredAt,
    currentPrice: prices[alert.coinId]?.usd || 0,
    priceChange24h: prices[alert.coinId]?.usd_24h_change || 0,
    createdAt: alert.createdAt,
  }));
};

export const startAlertScheduler = () => {
  setInterval(() => {
    evaluateAlerts().catch((error) => {
      console.error("Alert scheduler failed", error.message);
    });
  }, env.alertCheckIntervalMs);
};
