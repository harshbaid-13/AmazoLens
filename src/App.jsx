import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import CustomerSegmentation from "./pages/CustomerSegmentation";
import RegionalSales from "./pages/RegionalSales";
import ProductRecommendation from "./pages/ProductRecommendation";
import MarketBasket from "./pages/MarketBasket";
import SentimentAnalysis from "./pages/SentimentAnalysis";
import TopicMining from "./pages/TopicMining";
import TopBrands from "./pages/TopBrands";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar/Navbar */}
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container px-6 py-8 mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route
              path="/customer-segmentation"
              element={<CustomerSegmentation />}
            />
            <Route
              path="/market-basket"
              element={<MarketBasket />}
            />
            <Route path="/regional-sales" element={<RegionalSales />} />
            <Route
              path="/product-recommendation"
              element={<ProductRecommendation />}
            />
            <Route path="/sentiment-analysis" element={<SentimentAnalysis />} />
            <Route path="/topic-mining" element={<TopicMining />} />
            <Route path="/top-brands" element={<TopBrands />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
