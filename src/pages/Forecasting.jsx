import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import axios from "axios";

export default function Forecasting() {
  const svgRef = useRef();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [productName, setProductName] = useState("");
  const [granularity, setGranularity] = useState("daily");
  const [daysAhead, setDaysAhead] = useState(30);
  const [forecastData, setForecastData] = useState([]);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/forecast/top-products").then((res) => {
      setProducts(res.data.slice(0, 50));
    });
  }, []);

  const fetchForecast = async () => {
    if (!selectedProduct) return;
    const res = await axios.get("http://127.0.0.1:8000/forecast/predict", {
      params: {
        product_id: selectedProduct,
        granularity,
        days: daysAhead,
      },
    });

    if (res.data?.length > 0) {
      setForecastData(res.data);
      setProductName(res.data[0].product_name || "Selected Product");
    }
  };

  useEffect(() => {
    if (!forecastData.length) return;
    drawGraph(forecastData);
  }, [forecastData]);

  const drawGraph = (rawData) => {
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current);
    const margin = { top: 40, right: 40, bottom: 40, left: 70 };
    const width = 1000 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Flexible date parser
    const parseDate =
      d3.utcParse("%Y-%m-%d %H:%M:%S") || d3.utcParse("%Y-%m-%d");
    const formatDate = d3.timeFormat("%b %d, %Y");

    const data = rawData
      .map((d) => ({
        ...d,
        date: d.date.includes(":")
          ? d3.utcParse("%Y-%m-%d %H:%M:%S")(d.date)
          : d3.utcParse("%Y-%m-%d")(d.date),
        value: +d.value,
        upper: d.upper !== undefined ? +d.upper : null,
        lower: d.lower !== undefined ? +d.lower : null,
      }))
      .filter((d) => d.date && !isNaN(d.value));

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date))
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.upper || d.value)])
      .nice()
      .range([height, 0]);

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(8).tickFormat(d3.timeFormat("%b %d")));

    g.append("g").call(d3.axisLeft(y).ticks(6).tickFormat(d3.format(",")));

    const line = d3
      .line()
      .x((d) => x(d.date))
      .y((d) => y(d.value));
    const area = d3
      .area()
      .x((d) => x(d.date))
      .y0((d) => y(d.lower))
      .y1((d) => y(d.upper));

    const actualData = data.filter((d) => d.type === "actual");
    const forecastData = data.filter((d) => d.type === "forecast");

    // Confidence band
    if (forecastData.length > 0) {
      g.append("path")
        .datum(forecastData)
        .attr("fill", "rgba(0,128,0,0.1)")
        .attr("d", area);
    }
    g.append("path")
      .datum(forecastData)
      .attr("fill", "none")
      .attr("stroke", "green")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "5,5")
      .attr(
        "d",
        d3
          .line()
          .x((d) => x(d.date))
          .y((d) => y(d.upper))
      );

    // Lower Bound Line (dashed)
    g.append("path")
      .datum(forecastData)
      .attr("fill", "none")
      .attr("stroke", "green")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "5,5")
      .attr(
        "d",
        d3
          .line()
          .x((d) => x(d.date))
          .y((d) => y(d.lower))
      );

    // Forecast line
    g.append("path")
      .datum(forecastData)
      .attr("fill", "none")
      .attr("stroke", "green")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Actual line
    g.append("path")
      .datum(actualData)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "#fff")
      .style("padding", "8px 12px")
      .style("border", "1px solid #ccc")
      .style("border-radius", "5px")
      .style("pointer-events", "none")
      .style("display", "none");

    g.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.date))
      .attr("cy", (d) => y(d.value))
      .attr("r", 4)
      .attr("fill", (d) => (d.type === "actual" ? "black" : "green"))
      .on("mouseover", (event, d) => {
        tooltip.style("display", "block").html(`
            <strong>${d.type.toUpperCase()}</strong><br/>
            ${formatDate(d.date)}<br/>
            Value: ${d3.format(",")(d.value)}<br/>
            ${
              d.upper
                ? `Range: ${d3.format(",")(d.lower)} - ${d3.format(",")(
                    d.upper
                  )}`
                : ""
            }
          `);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("top", event.pageY + 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseout", () => {
        tooltip.style("display", "none");
      });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">🔮 Product Forecasting</h1>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            className="p-2 border rounded"
            onChange={(e) => setSelectedProduct(e.target.value)}
          >
            <option value="">Select Product</option>
            {products.map((p) => (
              <option key={p.product_id} value={p.product_id}>
                {p.product_name}
              </option>
            ))}
          </select>

          <select
            className="p-2 border rounded"
            onChange={(e) => setGranularity(e.target.value)}
            value={granularity}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>

          <input
            type="number"
            className="p-2 border rounded"
            placeholder="Days Ahead"
            value={daysAhead}
            onChange={(e) => setDaysAhead(parseInt(e.target.value))}
          />

          <button
            onClick={fetchForecast}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Generate Forecast
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-bold mb-4">
          📈 Forecast for: {productName}
        </h2>
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
}
