export const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

export const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

export const preciseNumber = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 8,
});

export const formatPercent = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(2)}%` : "-";
};

export const percentClass = (value) => (Number(value) >= 0 ? "positive" : "negative");
