import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/Common/Header";
import Loader from "../components/Common/Loader";
import Search from "../components/Dashboard/Search";
import TabsComponent from "../components/Dashboard/Tabs";

import PaginationComponent from "../components/Dashboard/Pagination";
import TopButton from "../components/Common/TopButton";
import Footer from "../components/Common/Footer/footer";
import ErrorState from "../components/Common/ErrorState";
import { get100Coins } from "../functions/get100Coins";
import { getApiErrorMessage } from "../functions/api";

function Dashboard() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let isActive = true;
    getData(() => isActive);

    return () => {
      isActive = false;
    };
  }, []);

  const getData = async (isActive = () => true) => {
    setLoading(true);
    setError("");

    try {
      const response = await get100Coins();

      if (!isActive()) return;

      setCoins(Array.isArray(response) ? response : []);
      setPage(1);
    } catch (err) {
      if (!isActive()) return;
      setError(getApiErrorMessage(err));
      setCoins([]);
    } finally {
      if (isActive()) {
        setLoading(false);
      }
    }
  };

  const handleChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const filteredCoins = useMemo(
    () =>
      coins.filter(
        (coin) =>
          coin.name.toLowerCase().includes(search.trim().toLowerCase()) ||
          coin.symbol.toLowerCase().includes(search.trim().toLowerCase())
      ),
    [coins, search]
  );

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const pageCount = Math.max(1, Math.ceil(coins.length / 10));
  const initialCount = (page - 1) * 10;
  const paginatedCoins = coins.slice(initialCount, initialCount + 10);
  const visibleCoins = search ? filteredCoins : paginatedCoins;

  return (
    <>
      <Header />
      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorState
          title="Crypto data could not be loaded"
          message={error}
          onAction={() => getData()}
        />
      ) : (
        <>
          <Search search={search} handleChange={handleChange} />
          <TabsComponent
            coins={visibleCoins}
            setSearch={setSearch}
          />
          {!search && (
            <PaginationComponent
              page={page}
              count={pageCount}
              handlePageChange={handlePageChange}
            />
          )}
        </>
      )}
      <TopButton />
      <Footer />
    </>
  );
}

export default Dashboard;

// coins == 100 coins

// PaginatedCoins -> Page 1 - coins.slice(0,10)
// PaginatedCoins -> Page 2 = coins.slice(10,20)
// PaginatedCoins -> Page 3 = coins.slice(20,30)
// .
// .
// PaginatedCoins -> Page 10 = coins.slice(90,100)

// PaginatedCoins -> Page X , then initial Count = (X-1)*10
// coins.slice(initialCount,initialCount+10)
