import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export default function TopBrands() {
  const barRef = useRef();
  const pieRef = useRef();
  const [data, setData] = useState([]);
  const [topN, setTopN] = useState(10);

  // Load data from backend
  useEffect(() => {
    const fallback = [
      { brand: "FallbackBrand A", count: 120 },
      { brand: "FallbackBrand B", count: 110 },
      { brand: "FallbackBrand C", count: 100 },
      { brand: "FallbackBrand D", count: 90 },
      { brand: "FallbackBrand E", count: 80 },
      { brand: "FallbackBrand F", count: 70 },
      { brand: "FallbackBrand G", count: 60 },
      { brand: "FallbackBrand H", count: 50 },
      { brand: "FallbackBrand I", count: 40 },
      { brand: "FallbackBrand J", count: 30 },
    ];

    fetch("http://localhost:8000/analytics/top-brands")
      .then(res => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then(jsonData => {
        // Handle if backend returns JSON as a string
        const parsedData = typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData;

        // Remove rows with empty or whitespace-only brand_name
        const filteredData = parsedData.filter(
          d => d.brand_name && d.brand_name.trim() !== ""
        );

        const grouped = {};

        filteredData.forEach(d => {
          const brand = d.brand_name.trim();
          if (!grouped[brand]) {
            grouped[brand] = 0;
          }
          grouped[brand] += +d.product_count;
        });

        const aggregated = Object.entries(grouped).map(([brand, count]) => ({
          brand,
          count,
        }));

        setData(aggregated.length > 0 ? aggregated : fallback);
      })
      .catch(err => {
        console.error("Failed to fetch data:", err);
        setData(fallback);
      });

  }, []);





  const filteredData = [...data].slice(0, topN);
  const [selectedBrand, setSelectedBrand] = useState(null);

  // Bar chart
  useEffect(() => {
    if (!barRef.current || filteredData.length === 0) return;

    d3.select(barRef.current).selectAll("*").remove();

    const width = 500;
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 30, left: 150 };

    const svg = d3
      .select(barRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(filteredData, d => d.count)])
      .nice()
      .range([0, width - margin.left - margin.right]);

    const y = d3
      .scaleBand()
      .domain(filteredData.map(d => d.brand))
      .range([0, height - margin.top - margin.bottom])
      .padding(0.2);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5));

    g.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("font-size", "12px")
      .style("font-weight", "500");

    // Bars with animation
    const bars = g.selectAll(".bar")
      .data(filteredData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", d => y(d.brand))
      .attr("height", y.bandwidth())
      .attr("x", 0)
      .attr("width", 0)
      .attr("fill", "#10B981")
      .on("mouseover", function () {
        d3.select(this).transition().duration(200).attr("fill", "#059669");
      })
      .on("mouseout", function () {
        d3.select(this).transition().duration(200).attr("fill", "#10B981");
      })
      .on("click", (_, d) => {
        setSelectedBrand(d); // <- This sets selected brand on click
      });


    bars
      .transition()
      .duration(800)
      .delay((_, i) => i * 50)
      .attr("width", d => x(d.count));

    // Value Labels with fade-in
    g.selectAll(".label")
      .data(filteredData)
      .enter()
      .append("text")
      .text(d => d.count)
      .attr("x", 0)
      .attr("y", d => y(d.brand) + y.bandwidth() / 2 + 5)
      .attr("text-anchor", "start")
      .style("fill", "#fff")
      .style("font-size", "12px")
      .style("opacity", 0)
      .transition()
      .duration(500)
      .delay((_, i) => 200 + i * 50)
      .attr("x", d => x(d.count) - 8)
      .style("opacity", 1);

  }, [filteredData]);

  // Pie chart
  useEffect(() => {
    if (!pieRef.current || filteredData.length === 0) return;

    d3.select(pieRef.current).selectAll("*").remove();

    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;

    const svg = d3
      .select(pieRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const pie = d3.pie().value(d => d.count);
    const arc = d3.arc().innerRadius(70).outerRadius(radius); // donut shape
    const color = d3.scaleOrdinal(d3.schemeTableau10);

    const total = d3.sum(filteredData, d => d.count);

    // Center text elements with initial opacity 0 (fade-in on click)
    const centerBrand = svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", -10)
      .attr("font-size", "14px")
      .attr("fill", "#333")
      .style("font-weight", "bold")
      .style("opacity", 0);

    const centerPercent = svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", 12)
      .attr("font-size", "14px")
      .attr("fill", "#666")
      .style("opacity", 0);

    const arcs = svg
      .selectAll("arc")
      .data(pie(filteredData))
      .enter()
      .append("g")
      .attr("class", "arc");

    arcs
      .append("path")
      .attr("fill", d => color(d.data.brand))
      .transition()
      .duration(800)
      .attrTween("d", function (d) {
        const i = d3.interpolate(
          { startAngle: d.startAngle, endAngle: d.startAngle },
          d
        );
        return function (t) {
          return arc(i(t));
        };
      });

    // Interactivity
    arcs
      .selectAll("path")
      .on("mouseover", function () {
        d3.select(this).transition().duration(200).attr("transform", "scale(1.05)");
      })
      .on("mouseout", function () {
        d3.select(this).transition().duration(200).attr("transform", "scale(1)");
      })
      .on("click", function (event, d) {
        const percentage = ((d.data.count / total) * 100).toFixed(1);

        centerBrand
          .text(
            d.data.brand.length > 20 ? d.data.brand.slice(0, 17) + "…" : d.data.brand
          )
          .transition()
          .duration(300)
          .style("opacity", 1);

        centerPercent
          .text(`${percentage}%`)
          .transition()
          .duration(300)
          .style("opacity", 1);

        event.stopPropagation();
      });

    // Slice labels
    arcs
      .append("text")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "#fff")
      .text(d =>
        d.data.brand.length > 10 ? d.data.brand.slice(0, 7) + "…" : d.data.brand
      )
      .style("opacity", 0)
      .transition()
      .delay((_, i) => i * 100)
      .duration(500)
      .style("opacity", 1);

    // Clear center on background click
    d3.select(pieRef.current)
      .select("svg")
      .on("click", () => {
        centerBrand.transition().duration(300).style("opacity", 0);
        centerPercent.transition().duration(300).style("opacity", 0);
      });
  }, [filteredData]);




  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Top Brands Dashboard</h1>

      <div className="flex items-center mb-4 gap-4">
        {selectedBrand && (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-emerald-800">Selected Brand</h3>
            <p className="text-gray-700">Brand: <strong>{selectedBrand.brand}</strong></p>
            <p className="text-gray-700">Count: <strong>{selectedBrand.count}</strong></p>
          </div>
        )}

        <label htmlFor="topN" className="font-medium text-gray-700">
          Top Brands:
        </label>
        <input
          id="topN"
          type="range"
          min="5"
          max="20"
          value={topN}
          onChange={e => setTopN(+e.target.value)}
          className="w-64"
        />
        <span className="text-sm text-gray-600">{topN}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Brands with Most Products</h2>
          <div ref={barRef}></div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Product Count Share</h2>
          <div ref={pieRef}></div>
        </div>
      </div>
    </div>
  );
}
