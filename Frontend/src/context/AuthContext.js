import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authService } from "../services/authService";
import { watchlistService } from "../services/watchlistService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authService.me();
      setUser(data.user);
    } catch {
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
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authService.register(payload);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
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
      register,
      logout,
      refreshUser,
      addToWatchlist,
      removeFromWatchlist,
    }),
    [
      addToWatchlist,
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
