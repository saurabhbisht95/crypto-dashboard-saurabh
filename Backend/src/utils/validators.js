export const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

export const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};
