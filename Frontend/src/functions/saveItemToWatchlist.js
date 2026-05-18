import { toast } from "react-toastify";
import { getJsonStorageValue, setJsonStorageValue } from "./storage";

export const saveItemToWatchlist = (e, id) => {
  e.preventDefault();
  e.stopPropagation();
  let watchlist = getJsonStorageValue("watchlist", []);

  if (!Array.isArray(watchlist)) {
    watchlist = [];
  }

  if (!watchlist.includes(id)) {
    watchlist.push(id);
    toast.success(
      `${
        id.substring(0, 1).toUpperCase() + id.substring(1)
      } - added to the watchlist`
    );
  } else {
    toast.error(
      `${
        id.substring(0, 1).toUpperCase() + id.substring(1)
      } - is already added to the watchlist!`
    );
  }

  setJsonStorageValue("watchlist", watchlist);
};
