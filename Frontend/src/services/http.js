import axios from "axios";

export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:9000/api/v1";

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getApiMessage = (error, fallback = "Something went wrong.") => {
  if (error?.code === "ECONNABORTED") {
    return "The request timed out. Please retry in a moment.";
  }

  return error?.response?.data?.message || error?.message || fallback;
};
