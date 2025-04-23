import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Heatmap from "../components/HeatMap";
import SliderFilter from "../components/SliderFilter";
import RaceBarChart from "../components/RaceBarChart";
import "../styles/regionalsales.css";


export default function Dashboard() {
  const salesChartRef = useRef();
  const pieChartRef = useRef();

  // --- Key metrics data ---
  const keyMetrics = [
    { name: "Total Sales", value: "$4.25M", change: "+15%", icon: "📈" },
    { name: "Total Orders", value: "124,500", change: "+8%", icon: "📦" },
    { name: "Avg. Order Value", value: "$34.20", change: "+5%", icon: "💰" },
    { name: "Active Customers", value: "56,700", change: "+12%", icon: "👥" },
  ];

  // --- Bar chart data ---
  const monthlySales = [
    { month: "Jan", sales: 12000 },
    { month: "Feb", sales: 15000 },
    { month: "Mar", sales: 18000 },
    { month: "Apr", sales: 16000 },
    { month: "May", sales: 21000 },
    { month: "Jun", sales: 19000 },
    { month: "Jul", sales: 22000 },
    { month: "Aug", sales: 25000 },
    { month: "Sep", sales: 23000 },
    { month: "Oct", sales: 27000 },
    { month: "Nov", sales: 30000 },
    { month: "Dec", sales: 35000 },
  ];

  // --- Pie chart data ---
  const categoryData = [
    { category: "Electronics", percentage: 30 },
    { category: "Clothing", percentage: 25 },
    { category: "Books", percentage: 15 },
    { category: "Home", percentage: 20 },
    { category: "Other", percentage: 10 },
  ];

  // --- Heatmap state ---
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dayOffset, setDayOffset] = useState(0);

  const allStates = [
    "andhra pradesh", "arunachal pradesh", "assam", "bihar", "chhattisgarh",
    "goa", "gujarat", "haryana", "himachal pradesh", "jammu and kashmir",
    "jharkhand", "karnataka", "kerala", "madhya pradesh", "maharashtra",
    "manipur", "meghalaya", "mizoram", "nagaland", "odisha", "punjab",
    "rajasthan", "sikkim", "tamil nadu", "telangana", "tripura",
    "uttar pradesh", "uttarakhand", "west bengal", "andaman and nicobar",
    "chandigarh", "dadra and nagar haveli and daman and diu", "delhi",
    "lakshadweep", "puducherry"
  ];

  // --- Bar Chart ---
  useEffect(() => {
    if (!salesChartRef.current) return;

    d3.select(salesChartRef.current).selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3
      .select(salesChartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(monthlySales.map((d) => d.month))
      .range([0, width])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(monthlySales, (d) => d.sales)])
      .nice()
      .range([height, 0]);

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append("g").call(
      d3
        .axisLeft(y)
        .ticks(5)
        .tickFormat((d) => `$${d / 1000}k`)
    );

    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr(
        "transform",
        `translate(${-margin.left / 1.5},${height / 2}) rotate(-90)`
      )
      .text("Sales ($)");

    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr(
        "transform",
        `translate(${width / 2},${height + margin.bottom - 5})`
      )
      .text("Month");

    svg
      .selectAll(".bar")
      .data(monthlySales)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.month))
      .attr("y", (d) => y(d.sales))
      .attr("width", x.bandwidth())
      .attr("height", (d) => height - y(d.sales))
      .attr("fill", "#3b82f6");
  }, []);

  // --- Pie Chart ---
  useEffect(() => {
    if (!pieChartRef.current) return;

    d3.select(pieChartRef.current).selectAll("*").remove();

    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;

    const svg = d3
      .select(pieChartRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const color = d3
      .scaleOrdinal()
      .domain(categoryData.map((d) => d.category))
      .range(d3.schemeCategory10);

    const pie = d3
      .pie()
      .value((d) => d.percentage)
      .sort(null);

    const arc = d3
      .arc()
      .innerRadius(0)
      .outerRadius(radius - 20);

    const labelArc = d3
      .arc()
      .innerRadius(radius - 60)
      .outerRadius(radius - 60);

    const g = svg
      .selectAll(".arc")
      .data(pie(categoryData))
      .enter()
      .append("g")
      .attr("class", "arc");

    g.append("path")
      .attr("d", arc)
      .attr("fill", (d) => color(d.data.category));

    g.append("text")
      .attr("transform", (d) => `translate(${labelArc.centroid(d)})`)
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .text((d) => d.data.category);

    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(0,${-radius - 10})`)
      .text("Sales by Category");
  }, []);

  // --- Heatmap Data Fetch ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (dayOffset === 0) {
        const zeroData = allStates.map((state) => ({ state, value: 0 }));
        setSalesData(zeroData);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`http://127.0.0.1:8000/dashboard/heatmap-data?until_days=${dayOffset}`);
        const rawData = await res.json();
        console.log(rawData);

        const formatted = rawData.map(([state, value]) => {
          const normalized = state.trim().toLowerCase()
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
      setLoading(false);
    };

    fetchData();
    // eslint-disable-next-line
  }, [dayOffset]);

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
                <h3 className="text-gray-500 text-sm">{metric.name}</h3>
                <div className="flex items-center">
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <span
                    className={`ml-2 text-sm ${
                      metric.change.startsWith("+")
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {metric.change}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Monthly Sales</h2>
          <div ref={salesChartRef} className="overflow-x-auto"></div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Sales by Category</h2>
          <div ref={pieChartRef}></div>
        </div>
      </div>

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
                  <span className="sales-value">{item.value.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Race Bar Chart Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        {/* <h2 className="text-xl font-bold mb-4">Top 10 Weekly Selling Products</h2> */}
        <RaceBarChart />
      </div>
    </div>
  );
}
