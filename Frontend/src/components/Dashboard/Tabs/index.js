import * as React from "react";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import "./styles.css";
import Grid from "../Grid";
import List from "../List";
import Button from "../../Common/Button";

const EmptyDashboardState = ({ setSearch }) => (
  <div className="dashboard-empty-state">
    <h2>No coins found</h2>
    <p>Try a different name or symbol.</p>
    {setSearch && <Button text="Clear Search" onClick={() => setSearch("")} />}
  </div>
);

export default function TabsComponent({ coins, setSearch }) {
  const [value, setValue] = React.useState("grid");

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const style = {
    color: "var(--white)",
    "& .Mui-selected": {
      color: "var(--blue) !important",
    },
    fontFamily: "Inter,sans-serif",
    fontWeight: 600,
    textTransform: "capitalize",
  };

  return (
    <TabContext value={value}>
      <div className="dashboard-tabs-bar">
        <TabList onChange={handleChange} variant="fullWidth">
          <Tab label="Grid" value="grid" sx={style} />
          <Tab label="List" value="list" sx={style} />
        </TabList>
      </div>
      <TabPanel value="grid" sx={{ padding: "1rem 0" }}>
        <div className="grid-flex">
          {coins.length > 0 ? (
            coins.map((coin, i) => (
              <Grid coin={coin} key={coin.id} delay={(i % 4) * 0.04} />
            ))
          ) : (
            <EmptyDashboardState setSearch={setSearch} />
          )}
        </div>
      </TabPanel>
      <TabPanel value="list" sx={{ padding: "1rem 0" }}>
        {coins.length > 0 ? (
          <table className="list-flex">
            <tbody>
              {coins.map((coin, i) => (
                <List coin={coin} key={coin.id} delay={(i % 8) * 0.03} />
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyDashboardState setSearch={setSearch} />
        )}
      </TabPanel>
    </TabContext>
  );
}
