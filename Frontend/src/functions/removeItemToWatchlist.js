import { toast } from "react-toastify";
import { getJsonStorageValue, setJsonStorageValue } from "./storage";

export const removeItemToWatchlist = (e, id, setIsCoinAdded) => {
  e.preventDefault();
  e.stopPropagation();
  if (window.confirm("Are you sure you want to remove this coin?")) {
    let watchlist = getJsonStorageValue("watchlist", []);

    if (!Array.isArray(watchlist)) {
      watchlist = [];
    }

    const newList = watchlist.filter((coin) => coin !== id);
    setIsCoinAdded(false);
    setJsonStorageValue("watchlist", newList);
    toast.success(
      `${
        id.substring(0, 1).toUpperCase() + id.substring(1)
      } - has been removed!`
    );
  } else {
    toast.error(
      `${
        id.substring(0, 1).toUpperCase() + id.substring(1)
      } - could not be removed!`
    );
    setIsCoinAdded(true);
  }
};
