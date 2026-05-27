import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import "./styles.css";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import { motion } from "framer-motion";
import StarOutlineIcon from "@mui/icons-material/StarOutline";
import StarIcon from "@mui/icons-material/Star";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";
import { getApiMessage } from "../../../services/http";

function Grid({ coin, delay }) {
  const navigate = useNavigate();
  const {
    addToWatchlist,
    isAuthenticated,
    removeFromWatchlist,
    watchlistIds,
  } = useAuth();
  const isCoinAdded = watchlistIds.includes(coin.id);
  const priceChange = coin.price_change_percentage_24h || 0;
  const currentPrice = coin.current_price || 0;
  const totalVolume = coin.total_volume || 0;
  const marketCap = coin.market_cap || 0;

  const handleWatchlistClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      toast.info("Login to save coins to your watchlist.");
      navigate("/login");
      return;
    }

    try {
      if (isCoinAdded) {
        await removeFromWatchlist(coin.id);
        toast.success(`${coin.name} removed from watchlist.`);
      } else {
        await addToWatchlist(coin.id);
        toast.success(`${coin.name} added to watchlist.`);
      }
    } catch (err) {
      toast.error(getApiMessage(err, "Watchlist could not be updated."));
    }
  };

  const handleCardKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate(`/coin/${coin.id}`);
    }
  };

  return (
    <motion.div
      className={`grid ${priceChange < 0 ? "grid-red" : ""}`}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      viewport={{ once: true, amount: 0.2 }}
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/coin/${coin.id}`)}
      onKeyDown={handleCardKeyDown}
    >
      <div className="img-flex">
        <img
          src={coin.image}
          className="coin-image"
          alt={coin.name}
          loading="lazy"
          decoding="async"
        />
        <div className="icon-flex">
          <div className="info-flex">
            <p className="coin-symbol">{coin.symbol}</p>
            <p className="coin-name">{coin.name}</p>
          </div>
          <button
            type="button"
            className={`watchlist-icon ${
              priceChange < 0 ? "watchlist-icon-red" : ""
            }`}
            onClick={handleWatchlistClick}
            aria-label={
              isCoinAdded
                ? `Remove ${coin.name} from watchlist`
                : `Add ${coin.name} to watchlist`
            }
          >
            {isCoinAdded ? <StarIcon /> : <StarOutlineIcon />}
          </button>
        </div>
      </div>
      {priceChange >= 0 ? (
        <div className="chip-flex">
          <div className="price-chip">{priceChange.toFixed(2)}%</div>
          <div className="chip-icon">
            <TrendingUpRoundedIcon />
          </div>
        </div>
      ) : (
        <div className="chip-flex">
          <div className="price-chip red">{priceChange.toFixed(2)}%</div>
          <div className="chip-icon red">
            <TrendingDownRoundedIcon />
          </div>
        </div>
      )}
      {priceChange >= 0 ? (
        <p className="current-price">${currentPrice.toLocaleString()}</p>
      ) : (
        <p className="current-price-red">${currentPrice.toLocaleString()}</p>
      )}
      <p className="coin-name">Total Volume : {totalVolume.toLocaleString()}</p>
      <p className="coin-name">Market Capital : ${marketCap.toLocaleString()}</p>
    </motion.div>
  );
}

export default memo(Grid);
