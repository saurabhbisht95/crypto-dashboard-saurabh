import { getApiMessage } from "../services/http";

export const getApiErrorMessage = (
  error,
  fallback = "Unable to load crypto data right now. Please try again."
) => {
  const status = error?.response?.status;

  if (status === 401) {
    return "Please login to continue.";
  }

  if (status === 429) {
    return "Market data provider rate limit reached. Cached backend data will be used when available; please retry in a minute.";
  }

  if (status >= 500) {
    return "The server is temporarily unavailable. Please retry in a moment.";
  }

  return getApiMessage(error, fallback);
};
