import axios from "axios";

export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:9000/api/v1";
const AUTH_TOKEN_KEY = "cryptotracker_access_token";

const getStorage = () => {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
};

export const getStoredAuthToken = () => {
  return getStorage()?.getItem(AUTH_TOKEN_KEY) || "";
};

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const setAuthToken = (token) => {
  if (token) {
    http.defaults.headers.common.Authorization = `Bearer ${token}`;
    getStorage()?.setItem(AUTH_TOKEN_KEY, token);
    return;
  }

  delete http.defaults.headers.common.Authorization;
  getStorage()?.removeItem(AUTH_TOKEN_KEY);
};

setAuthToken(getStoredAuthToken());

http.interceptors.request.use((config) => {
  const token = getStoredAuthToken();

  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getApiMessage = (error, fallback = "Something went wrong.") => {
  if (error?.code === "ECONNABORTED") {
    return "The request timed out. Please retry in a moment.";
  }

  return error?.response?.data?.message || error?.message || fallback;
};
