import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./styles.css";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import { motion } from "framer-motion";
import StarOutlineIcon from "@mui/icons-material/StarOutline";
import { saveItemToWatchlist } from "../../../functions/saveItemToWatchlist";
import StarIcon from "@mui/icons-material/Star";
import { removeItemToWatchlist } from "../../../functions/removeItemToWatchlist";
import { getJsonStorageValue } from "../../../functions/storage";

function Grid({ coin, delay }) {
  const watchlist = getJsonStorageValue("watchlist", []);
  const [isCoinAdded, setIsCoinAdded] = useState(watchlist?.includes(coin.id));
  const priceChange = coin.price_change_percentage_24h || 0;
  const currentPrice = coin.current_price || 0;
  const totalVolume = coin.total_volume || 0;
  const marketCap = coin.market_cap || 0;

  return (
    <Link to={`/coin/${coin.id}`}>
      <motion.div
        className={`grid ${priceChange < 0 && "grid-red"}`}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: delay }}
      >
        <div className="img-flex">
          <img src={coin.image} className="coin-image" alt={coin.name} />
          <div className="icon-flex">
            <div className="info-flex">
              <p className="coin-symbol">{coin.symbol}</p>
              <p className="coin-name">{coin.name}</p>
            </div>
            <div
              className={`watchlist-icon ${
                priceChange < 0 && "watchlist-icon-red"
              }`}
              onClick={(e) => {
                if (isCoinAdded) {
                  // remove coin

                  removeItemToWatchlist(e, coin.id, setIsCoinAdded);
                } else {
                  setIsCoinAdded(true);
                  saveItemToWatchlist(e, coin.id);
                }
              }}
            >
              {isCoinAdded ? <StarIcon /> : <StarOutlineIcon />}
            </div>
          </div>
        </div>
        {priceChange >= 0 ? (
          <div className="chip-flex">
            <div className="price-chip">
              {priceChange.toFixed(2)}%
            </div>
            <div className="chip-icon">
              <TrendingUpRoundedIcon />
            </div>
          </div>
        ) : (
          <div className="chip-flex">
            <div className="price-chip red">
              {priceChange.toFixed(2)}%
            </div>
            <div className="chip-icon red">
              <TrendingDownRoundedIcon />
            </div>
          </div>
        )}
        {priceChange >= 0 ? (
          <p className="current-price">
            ${currentPrice.toLocaleString()}
          </p>
        ) : (
          <p className="current-price-red">
            ${currentPrice.toLocaleString()}
          </p>
        )}
        <p className="coin-name">
          Total Volume : {totalVolume.toLocaleString()}
        </p>
        <p className="coin-name">
          Market Capital : ${marketCap.toLocaleString()}
        </p>
      </motion.div>
    </Link>
  );
}

export default Grid;
