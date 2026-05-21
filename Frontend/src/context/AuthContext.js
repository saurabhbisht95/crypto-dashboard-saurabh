import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authService } from "../services/authService";
import { setAuthToken } from "../services/http";
import { watchlistService } from "../services/watchlistService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authService.me();
      setUser(data.user);
    } catch (err) {
      if (err?.response?.status === 401) {
        setAuthToken("");
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (payload) => {
    const data = await authService.login(payload);
    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const demoLogin = useCallback(async () => {
    const data = await authService.demoLogin();
    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authService.register(payload);
    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setAuthToken("");
      setUser(null);
    }
  }, []);

  const syncWatchlist = useCallback((watchlist) => {
    setUser((currentUser) =>
      currentUser
        ? {
            ...currentUser,
            watchlist: watchlist.ids,
          }
        : currentUser
    );
    return watchlist;
  }, []);

  const addToWatchlist = useCallback(async (coinId) => {
    const watchlist = await watchlistService.addCoin(coinId);
    return syncWatchlist(watchlist);
  }, [syncWatchlist]);

  const removeFromWatchlist = useCallback(async (coinId) => {
    const watchlist = await watchlistService.removeCoin(coinId);
    return syncWatchlist(watchlist);
  }, [syncWatchlist]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      watchlistIds: user?.watchlist || [],
      login,
      demoLogin,
      register,
      logout,
      refreshUser,
      addToWatchlist,
      removeFromWatchlist,
    }),
    [
      addToWatchlist,
      demoLogin,
      loading,
      login,
      logout,
      refreshUser,
      register,
      removeFromWatchlist,
      user,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
};
