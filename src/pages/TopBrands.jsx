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
      .range([0, width - margin.left - margin.right]);

    const y = d3
      .scaleBand()
      .domain(filteredData.map(d => d.brand))
      .range([0, height - margin.top - margin.bottom])
      .padding(0.2);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("g")
      .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5));

    g.append("g").call(d3.axisLeft(y));

    g.selectAll(".bar")
      .data(filteredData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", d => y(d.brand))
      .attr("width", d => x(d.count))
      .attr("height", y.bandwidth())
      .attr("fill", "#10B981");

    g.selectAll(".label")
      .data(filteredData)
      .enter()
      .append("text")
      .text(d => d.count)
      .attr("x", d => x(d.count) - 5)
      .attr("y", d => y(d.brand) + y.bandwidth() / 2 + 5)
      .attr("text-anchor", "end")
      .style("fill", "white")
      .style("font-size", "12px");
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
    const arc = d3.arc().innerRadius(0).outerRadius(radius);
    const color = d3.scaleOrdinal(d3.schemeTableau10);

    const arcs = svg
      .selectAll("arc")
      .data(pie(filteredData))
      .enter()
      .append("g");

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.brand))
      .on("mouseover", function () {
        d3.select(this).transition().duration(200).attr("transform", "scale(1.05)");
      })
      .on("mouseout", function () {
        d3.select(this).transition().duration(200).attr("transform", "scale(1)");
      });

    arcs
      .append("text")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "#fff")
      .text(d =>
        d.data.brand.length > 10 ? d.data.brand.slice(0, 7) + "…" : d.data.brand
      );
  }, [filteredData]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Top Brands Dashboard</h1>

      <div className="flex items-center mb-4 gap-4">
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
