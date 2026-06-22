import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import "./styles.css";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import { convertNumber } from "../../../functions/convertNumber";
import { motion } from "framer-motion";
import { Tooltip } from "@mui/material";
import StarOutlineIcon from "@mui/icons-material/StarOutline";
import StarIcon from "@mui/icons-material/Star";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";
import { getApiMessage } from "../../../services/http";

function List({ coin, delay, disableAnimation = false }) {
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

  return (
    <motion.tr
      className="list-row"
      initial={disableAnimation ? false : { opacity: 0, x: -50 }}
      animate={disableAnimation ? { opacity: 1, x: 0 } : undefined}
      whileInView={disableAnimation ? undefined : { opacity: 1, x: 0 }}
      transition={disableAnimation ? undefined : { duration: 0.35, delay }}
      viewport={disableAnimation ? undefined : { once: true, amount: 0.2 }}
      onClick={() => navigate(`/coin/${coin.id}`)}
    >
      <Tooltip title="Coin Image">
        <td className="td-img">
          <img
            src={coin.image}
            className="coin-image coin-image-td"
            alt={coin.name}
            loading="lazy"
            decoding="async"
          />
        </td>
      </Tooltip>
      <Tooltip title="Coin Info" placement="bottom-start">
        <td className="td-info">
          <div className="info-flex">
            <p className="coin-symbol td-p">{coin.symbol}</p>
            <p className="coin-name td-p">{coin.name}</p>
          </div>
        </td>
      </Tooltip>
      <Tooltip title="Coin Price Percentage In 24hrs" placement="bottom-start">
        {priceChange >= 0 ? (
          <td>
            <div className="chip-flex">
              <div className="price-chip">
                {priceChange.toFixed(2)}%
              </div>
              <div className="chip-icon td-chip-icon">
                <TrendingUpRoundedIcon />
              </div>
            </div>
          </td>
        ) : (
          <td>
            <div className="chip-flex">
              <div className="price-chip red">
                {priceChange.toFixed(2)}%
              </div>
              <div className="chip-icon td-chip-icon red">
                <TrendingDownRoundedIcon />
              </div>
            </div>
          </td>
        )}
      </Tooltip>
      <Tooltip title="Coin Price In USD" placement="bottom-end">
        {priceChange >= 0 ? (
          <td className="current-price  td-current-price">
            ${currentPrice.toLocaleString()}
          </td>
        ) : (
          <td className="current-price-red td-current-price">
            ${currentPrice.toLocaleString()}
          </td>
        )}
      </Tooltip>
      <Tooltip title="Coin Total Volume" placement="bottom-end">
        <td className="coin-name td-totalVolume">
          {totalVolume.toLocaleString()}
        </td>
      </Tooltip>
      <Tooltip title="Coin Market Capital" placement="bottom-end">
        <td className="coin-name td-marketCap">
          ${marketCap.toLocaleString()}
        </td>
      </Tooltip>
      <td className="coin-name mobile">${convertNumber(marketCap)}</td>
      <td className="watchlist-cell">
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
      </td>
    </motion.tr>
  );
}

export default memo(List);
