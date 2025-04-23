import { useEffect, useState } from "react";
import Heatmap from "../components/HeatMap";
import SliderFilter from "../components/SliderFilter";
import RaceBarChart from "../components/RaceBarChart";
import "../styles/regionalsales.css";
import DrillDownPie from "../components/DashboardPieChart";
import WeeklySalesBarChart from "../components/DashboardBarChart";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  function formatMoney(val) {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(2)}k`;
    return `$${val.toFixed(2)}`;
  }

  function formatNumber(val) {
    return Intl.NumberFormat("en-US").format(val);
  }

  const [keyMetrics, setKeyMetrics] = useState([]);
  const getData = async () => {
    setLoading(true);
    const res = await fetch(`http://127.0.0.1:8000/dashboard/get-data`);
    const data = await res.json();
    setKeyMetrics([
      {
        name: "Total Sales",
        value: formatMoney(data.total_sales),
        icon: "📈",
      },
      {
        name: "Total Orders",
        value: formatNumber(data.total_qty_sold),
        icon: "📦",
      },
      {
        name: "Avg. Order Value",
        value: formatMoney(data.avg_order_value),
        icon: "💰",
      },
      {
        name: "Active Customers",
        value: formatNumber(data.total_customers),
        icon: "👥",
      },
    ]);
    setLoading(false);
  };

  useEffect(() => {
    getData();
  }, []);

  // --- Heatmap state ---
  const [salesData, setSalesData] = useState([]);
  const [dayOffset, setDayOffset] = useState(0);

  const allStates = [
    "andhra pradesh",
    "arunachal pradesh",
    "assam",
    "bihar",
    "chhattisgarh",
    "goa",
    "gujarat",
    "haryana",
    "himachal pradesh",
    "jammu and kashmir",
    "jharkhand",
    "karnataka",
    "kerala",
    "madhya pradesh",
    "maharashtra",
    "manipur",
    "meghalaya",
    "mizoram",
    "nagaland",
    "odisha",
    "punjab",
    "rajasthan",
    "sikkim",
    "tamil nadu",
    "telangana",
    "tripura",
    "uttar pradesh",
    "uttarakhand",
    "west bengal",
    "andaman and nicobar",
    "chandigarh",
    "dadra and nagar haveli and daman and diu",
    "delhi",
    "lakshadweep",
    "puducherry",
  ];

  // --- Heatmap Data Fetch ---
  useEffect(() => {
    const fetchData = async () => {
      if (dayOffset === 0) {
        const zeroData = allStates.map((state) => ({ state, value: 0 }));
        setSalesData(zeroData);
        return;
      }

      try {
        const res = await fetch(
          `http://127.0.0.1:8000/dashboard/heatmap-data?until_days=${dayOffset}`
        );
        const rawData = await res.json();
        console.log(rawData);

        const formatted = rawData.map(([state, value]) => {
          const normalized = state
            .trim()
            .toLowerCase()
            .replace(/&/g, "and")
            .replace(/\s+/g, " ")
            .replace("andaman and nicobar islands", "andaman and nicobar")
            .replace("jammu & kashmir", "jammu and kashmir");
          return { state: normalized, value };
        });
        setSalesData(formatted.sort((a, b) => b.value - a.value));
      } catch (err) {
        console.error("Error fetching heatmap data:", err);
      }
    };

    fetchData();
    // eslint-disable-next-line
  }, [dayOffset]);
  if (loading)
    return (
      <div className="flex justify-center items-center py-10 w-[100%] h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-lg">Loading...</p>
      </div>
    );
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {keyMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">{metric.icon}</div>
              <div>
                <h3 className="text-gray-500 text-lg">{metric.name}</h3>
                <div className="flex flex-col">
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <span className={`text-sm text-green-500`}>
                    {"Last Month"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="mb-4">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Last 3 Week Sales</h2>
          <WeeklySalesBarChart />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h2 className="text-xl font-bold mb-4">Sales by Category</h2>
        <div>
          <DrillDownPie />
        </div>
      </div>
      {/* <DrillDownPie /> */}

      {/* Heatmap Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">📍 India Sales Heatmap</h2>
        <div className="regional-slider mb-4">
          <SliderFilter dayOffset={dayOffset} setDayOffset={setDayOffset} />
        </div>
        <div className="regional-layout">
          <div className="heatmap-wrapper">
            {loading ? (
              <div className="loading-text">Loading India map...</div>
            ) : (
              <Heatmap data={salesData} />
            )}
          </div>
          <div className="stats-panel">
            <h3 className="stats-heading">📊 Sales by State / UT</h3>
            <ul className="stats-list">
              {salesData.map((item) => (
                <li key={item.state} className="stats-item">
                  <span className="state-name">{item.state}</span>
                  <span className="sales-value">
                    {item.value.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Race Bar Chart Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        {/* <h2 className="text-xl font-bold mb-4">
          Top 10 Weekly Selling Products
        </h2> */}
        <RaceBarChart />
      </div>
    </div>
  );
}
