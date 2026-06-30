import { createTheme, ThemeProvider } from "@mui/material";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/Common/ProtectedRoute";
import Loader from "./components/Common/Loader";

const Alerts = lazy(() => import("./pages/Alerts"));
const Coin = lazy(() => import("./pages/Coin"));
const Compare = lazy(() => import("./pages/Compare"));
const Converter = lazy(() => import("./pages/Converter"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Discovery = lazy(() => import("./pages/Discovery"));
const Exchanges = lazy(() => import("./pages/Exchanges"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login/Login"));
const NftMarket = lazy(() => import("./pages/NftMarket"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Screener = lazy(() => import("./pages/Screener"));
const Signup = lazy(() => import("./pages/Signup/Signup"));
const SystemStatus = lazy(() => import("./pages/SystemStatus"));
const Watchlist = lazy(() => import("./pages/Watchlist"));

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#4f8cff",
    },
    background: {
      default: "#07090f",
      paper: "#101620",
    },
  },
  typography: {
    fontFamily: "Inter, sans-serif",
  },
});

function App() {
  return (
    <div className="App">
      <ToastContainer />
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<Loader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/discover" element={<Discovery />} />
                <Route path="/screener" element={<Screener />} />
                <Route path="/exchanges" element={<Exchanges />} />
                <Route path="/nfts" element={<NftMarket />} />
                <Route path="/converter" element={<Converter />} />
                <Route path="/coin/:id" element={<Coin />} />
                <Route path="/compare" element={<Compare />} />
                <Route
                  path="/watchlist"
                  element={
                    <ProtectedRoute>
                      <Watchlist />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portfolio"
                  element={
                    <ProtectedRoute>
                      <Portfolio />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/alerts"
                  element={
                    <ProtectedRoute>
                      <Alerts />
                    </ProtectedRoute>
                  }
                />
                <Route path="/status" element={<SystemStatus />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </div>
  );
}

export default App;
