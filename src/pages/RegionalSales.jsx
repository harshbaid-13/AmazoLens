import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { DateRangePicker } from "../components/ui/DateRangePicker.jsx";

export default function RegionalSales() {
  const mapChartRef = useRef();
  const barChartRef = useRef();
  const [htmlContent, setHtmlContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data for regional sales
  const regionData = [
    {
      id: 1,
      region: "North America",
      sales: 1250000,
      growth: 12.5,
      color: "#1f77b4",
    },
    { id: 2, region: "Europe", sales: 980000, growth: 8.3, color: "#ff7f0e" },
    {
      id: 3,
      region: "Asia Pacific",
      sales: 1450000,
      growth: 15.2,
      color: "#2ca02c",
    },
    {
      id: 4,
      region: "Latin America",
      sales: 350000,
      growth: 6.7,
      color: "#d62728",
    },
    {
      id: 5,
      region: "Middle East & Africa",
      sales: 220000,
      growth: 9.4,
      color: "#9467bd",
    },
  ];

  // City-level sales data
  const cityData = [
    { city: "New York", sales: 320000, region: "North America" },
    { city: "Los Angeles", sales: 280000, region: "North America" },
    { city: "Chicago", sales: 180000, region: "North America" },
    { city: "Toronto", sales: 150000, region: "North America" },
    { city: "London", sales: 310000, region: "Europe" },
    { city: "Paris", sales: 220000, region: "Europe" },
    { city: "Berlin", sales: 180000, region: "Europe" },
    { city: "Madrid", sales: 120000, region: "Europe" },
    { city: "Tokyo", sales: 350000, region: "Asia Pacific" },
    { city: "Shanghai", sales: 320000, region: "Asia Pacific" },
    { city: "Mumbai", sales: 210000, region: "Asia Pacific" },
    { city: "Sydney", sales: 180000, region: "Asia Pacific" },
    { city: "São Paulo", sales: 120000, region: "Latin America" },
    { city: "Mexico City", sales: 95000, region: "Latin America" },
    { city: "Dubai", sales: 110000, region: "Middle East & Africa" },
    { city: "Johannesburg", sales: 75000, region: "Middle East & Africa" },
  ];

  // Create simplified world map visualization
  useEffect(() => {
    if (!mapChartRef.current) return;

    // Clear previous chart
    d3.select(mapChartRef.current).selectAll("*").remove();

    const width = 800;
    const height = 500;

    const svg = d3
      .select(mapChartRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g");

    // Since we can't load actual GeoJSON data in this example,
    // we'll create a simplified representation of regions

    // Draw simplified regions as rectangles
    const regionWidth = width / 5;
    const regionHeight = height / 2;

    regionData.forEach((region, i) => {
      // Create region rectangle
      svg
        .append("rect")
        .attr("x", i * regionWidth)
        .attr("y", height / 4)
        .attr("width", regionWidth - 10)
        .attr("height", regionHeight)
        .attr("fill", region.color)
        .attr("stroke", "#333")
        .attr("stroke-width", 1)
        .attr("opacity", 0.7);

      // Add region name
      svg
        .append("text")
        .attr("x", i * regionWidth + regionWidth / 2)
        .attr("y", height / 4 - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text(region.region);

      // Add sales value
      svg
        .append("text")
        .attr("x", i * regionWidth + regionWidth / 2)
        .attr("y", height / 4 + regionHeight / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("fill", "white")
        .text(`$${(region.sales / 1000000).toFixed(1)}M`);

      // Add growth rate
      svg
        .append("text")
        .attr("x", i * regionWidth + regionWidth / 2)
        .attr("y", height / 4 + regionHeight / 2 + 25)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "white")
        .text(`${region.growth}% growth`);
    });

    // Add title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .text("Regional Sales Distribution");

    // Add note about simplified visualization
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 20)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-style", "italic")
      .text(
        "Note: This is a simplified representation. A real implementation would use GeoJSON data."
      );
  }, []);

  // Create bar chart for top cities
  useEffect(() => {
    if (!barChartRef.current) return;

    // Clear previous chart
    d3.select(barChartRef.current).selectAll("*").remove();

    const margin = { top: 30, right: 30, bottom: 70, left: 80 };
    const width = 700 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Sort cities by sales
    const sortedCities = [...cityData]
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);

    const svg = d3
      .select(barChartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales
    const x = d3
      .scaleLinear()
      .domain([0, d3.max(sortedCities, (d) => d.sales)])
      .range([0, width]);

    const y = d3
      .scaleBand()
      .domain(sortedCities.map((d) => d.city))
      .range([0, height])
      .padding(0.2);

    // Create color scale based on region
    const colorScale = d3
      .scaleOrdinal()
      .domain(regionData.map((d) => d.region))
      .range(regionData.map((d) => d.color));

    // Add Y axis
    svg.append("g").call(d3.axisLeft(y));

    // Add X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(5)
          .tickFormat((d) => `$${d / 1000}k`)
      );

    // Add X axis label
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 10)
      .text("Sales Amount");

    // Add bars
    svg
      .selectAll(".bar")
      .data(sortedCities)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", (d) => y(d.city))
      .attr("x", 0)
      .attr("height", y.bandwidth())
      .attr("width", (d) => x(d.sales))
      .attr("fill", (d) => colorScale(d.region));

    // Add bar labels
    svg
      .selectAll(".label")
      .data(sortedCities)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("y", (d) => y(d.city) + y.bandwidth() / 2)
      .attr("x", (d) => x(d.sales) + 5)
      .attr("dy", ".35em")
      .text((d) => `$${(d.sales / 1000).toFixed(0)}k`);

    // Add title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Top 10 Cities by Sales");
  }, []);

  const fetchHtml = async (from_date, to_date) => {
    try {
      setLoading(true); // Set loading to true when the API request starts
      const response = await fetch(
        `http://127.0.0.1:8000/analytics/get-folium?from_date=${from_date}&to_date=${to_date}`
      );
      if (response.ok) {
        const data = await response.json();
        console.log(data); // Get HTML response
        setHtmlContent(data.map_html); // Set the HTML content
      } else {
        throw new Error("Failed to fetch HTML");
      }
    } catch (error) {
      setError(error.message); // Set error message if something goes wrong
    } finally {
      setLoading(false); // Set loading to false once the API request finishes
    }
  };
  useEffect(() => {
    fetchHtml("2022-04-02", "2022-04-02");
  }, []);
  const handleDateChange = (from = "2022-04-02", to = "2022-04-02") => {
    fetchHtml(from, to);
  };
  // Summary statistics
  const totalSales = regionData.reduce((sum, region) => sum + region.sales, 0);
  const avgGrowth =
    regionData.reduce((sum, region) => sum + region.growth, 0) /
    regionData.length;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Regional Sales Analysis</h1>

      {/* Summary Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm">Total Global Sales</h3>
          <p className="text-2xl font-bold">
            ${(totalSales / 1000000).toFixed(2)}M
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm">Average Growth Rate</h3>
          <p className="text-2xl font-bold">{avgGrowth.toFixed(1)}%</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm">Top Performing Region</h3>
          <p className="text-2xl font-bold">
            {regionData.sort((a, b) => b.sales - a.sales)[0].region}
          </p>
        </div>
      </div> */}
      {/* <div className="p-8">
        <DateRangePicker onDateChange={handleDateChange} />
      </div> */}
      {/* Render HTML content when fetched */}
      {!loading && !error && (
        <div>
          <h1>Fetched HTML Content:</h1>
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
      )}
      {/* World Map */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 overflow-x-auto">
        <h2 className="text-xl font-bold mb-4">Global Sales Distribution</h2>
        <div ref={mapChartRef}></div>
      </div>

      {/* Top Cities */}
      <div className="bg-white rounded-lg shadow p-6 overflow-x-auto">
        <h2 className="text-xl font-bold mb-4">Top Cities by Sales</h2>
        <div ref={barChartRef}></div>
      </div>
    </div>
  );
}
