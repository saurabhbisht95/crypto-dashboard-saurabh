import axios from "axios";

export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:9000/api/v1";

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getApiMessage = (error, fallback = "Something went wrong.") => {
  return error?.response?.data?.message || error?.message || fallback;
};
