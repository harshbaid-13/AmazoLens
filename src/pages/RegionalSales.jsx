import { useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import { DatePickerWithRange } from "../components/ui/DateRangePicker";

export default function RegionalSales() {
  const barChartRef = useRef();
  const [htmlContent, setHtmlContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stateData, setStateData] = useState([]);

  // Create bar chart for top States
  useEffect(() => {
    if (!barChartRef.current) return;

    // Clear previous chart
    d3.select(barChartRef.current).selectAll("*").remove();

    const margin = { top: 30, right: 90, bottom: 70, left: 120 };
    const width = 800 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // Sort States by sales
    const sortedStates = [...stateData]
      .sort((a, b) => b.total_price - a.total_price)
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
      .domain([0, d3.max(sortedStates, (d) => d.total_price)])
      .range([0, width]);

    const y = d3
      .scaleBand()
      .domain(sortedStates.map((d) => d.state_ut))
      .range([0, height])
      .padding(0.2);

    // Add Y axis with larger font size
    svg
      .append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("font-size", "14px");

    // Add X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(5)
          .tickFormat((d) => `₹${d / 1000000}M`)
      );

    // Add X axis label
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 10)
      .text("Sales Amount");

    // Add bars with gray color
    svg
      .selectAll(".bar")
      .data(sortedStates)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", (d) => y(d.state_ut))
      .attr("x", 0)
      .attr("height", y.bandwidth())
      .attr("width", (d) => x(d.total_price))
      .attr("fill", "#808080")
      .on("mouseover", function () {
        d3.select(this).attr("fill", "#606060");
      })
      .on("mouseout", function () {
        d3.select(this).attr("fill", "#808080");
      });

    // Add bar labels
    svg
      .selectAll(".label")
      .data(sortedStates)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("y", (d) => y(d.state_ut) + y.bandwidth() / 2)
      .attr("x", (d) => x(d.total_price) + 5)
      .attr("dy", ".35em")
      .text((d) => `₹${(d.total_price / 1000000).toFixed(2)}M`);

    // Add title
    // svg
    //   .append("text")
    //   .attr("x", width / 2)
    //   .attr("y", -10)
    //   .attr("text-anchor", "middle")
    //   .style("font-size", "16px")
    //   .style("font-weight", "bold")
    //   .text("Top 10 States by Sales");
  }, [stateData]);

  const fetchHtml = async (from_date, to_date) => {
    try {
      const isDefault = from_date === "2022-04-02" && to_date === "2022-04-02";
      const url = isDefault
        ? "/basic.html"
        : `http://127.0.0.1:8000/analytics/get-folium?from_date=${from_date}&to_date=${to_date}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch map data");

      const html = isDefault
        ? await response.text()
        : (await response.json()).map_html;

      setHtmlContent(html);
    } catch (err) {
      setError(err.message);
    }
  };
  const fetchStateData = async (from_date, to_date) => {
    try {
      const url = `http://127.0.0.1:8000/analytics/get-top-cities?from_date=${from_date}&to_date=${to_date}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch state data");
      const data = await response.json();
      console.log(data);

      setStateData(data);
    } catch (error) {
      console.error("Error fetching state data:", error);
      setError("Failed to fetch state data");
    }
  };
  // useEffect(() => {
  //   fetchHtml("2022-04-02", "2022-04-02");
  // }, []);

  const handleDateChange = (from, to) => {
    setLoading(true);
    setError(null);
    console.log(from, to);

    // Call both fetch functions and handle loading state properly
    Promise.all([
      fetchStateData(from, to),
      fetchHtml("2022-04-02", "2022-04-02"),
    ]).finally(() => {
      setLoading(false);
    });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Regional Sales Analysis</h1>
      <div className="flex items-center gap-2 mb-2 px-4">
        <p>Select Timeline:</p>
        <DatePickerWithRange onDateChange={handleDateChange} />
      </div>

      {loading && (
        <div className="flex justify-center items-center py-10 w-[60%] h-[500px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-3 text-lg">Loading map data...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error: {error}</p>
        </div>
      )}

      {!loading && !error && htmlContent && (
        <div>
          <div className="bg-white rounded-lg shadow p-6 overflow-x-auto mb-4">
            <h2 className="text-xl font-bold mb-2">Sales Distribution Map</h2>

            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </div>
          <div className="bg-white rounded-lg shadow p-6 overflow-x-auto">
            <h2 className="text-xl font-bold mb-4">Top 10 States by Sales</h2>
            <div ref={barChartRef}></div>
          </div>
        </div>
      )}
    </div>
  );
}
