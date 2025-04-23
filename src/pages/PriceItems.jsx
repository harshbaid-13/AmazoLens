import React, { useEffect, useRef, useState } from "react";
import CostliestItemsChart from "./CostliestItems";
import CheapestItemsChart from "./CheapestItems";
import * as d3 from "d3";

export default function TopItems() {
    const barRef = useRef();
    const pieRef = useRef();
    const [data, setData] = useState([]);
    const [topN, setTopN] = useState(10);
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        const fallback = [
            { product_name: "Fallback Product A", quantity: 120 },
            { product_name: "Fallback Product B", quantity: 110 },
            { product_name: "Fallback Product C", quantity: 100 },
        ];

        fetch("http://localhost:8000/analytics/quantity-items")
            .then(res => {
                if (!res.ok) throw new Error("Network response was not ok");
                return res.json();
            })
            .then(json => {
                const rawData = typeof json === "string" ? JSON.parse(json) : json;

                const cleaned = rawData
                    .map(d => ({
                        product_name: d.product_name?.trim(),
                        quantity: Number(d.total_quantity),
                    }))
                    .filter(
                        d =>
                            d.product_name &&
                            d.product_name !== "" &&
                            !isNaN(d.quantity) &&
                            d.quantity > 0
                    );

                if (cleaned.length > 0) {
                    setData(cleaned);
                } else {
                    console.warn("No valid data from JSON. Using fallback.");
                    setData(fallback);
                }
            })
            .catch(err => {
                console.error("Data fetch failed. Using fallback. Error:", err);
                setData(fallback);
            });
    }, []);

    const filteredData = [...data]
        .filter(d => d.quantity > 0 && !isNaN(d.quantity))
        .slice(0, topN);

    // Horizontal Bar Chart
    useEffect(() => {
        if (!barRef.current || filteredData.length === 0) return;

        const container = barRef.current;
        d3.select(container).selectAll("*").remove();

        const width = container.offsetWidth || 600;
        const height = 50 * filteredData.length + 50;
        const margin = { top: 20, right: 30, bottom: 30, left: 150 };

        const svg = d3
            .select(container)
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const x = d3
            .scaleLinear()
            .domain([0, d3.max(filteredData, d => d.quantity)])
            .nice()
            .range([margin.left, width - margin.right]);

        const y = d3
            .scaleBand()
            .domain(filteredData.map(d => d.product_name))
            .range([margin.top, height - margin.bottom])
            .padding(0.2);

        svg.append("g")
            .attr("transform", `translate(0,${margin.top})`)
            .call(d3.axisTop(x));

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y));

        svg.selectAll(".bar")
            .data(filteredData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", x(0))
            .attr("y", d => y(d.product_name))
            .attr("width", d => x(d.quantity) - x(0))
            .attr("height", y.bandwidth())
            .attr("fill", "#3B82F6");

        svg.selectAll(".label")
            .data(filteredData)
            .enter()
            .append("text")
            .text(d => d.quantity)
            .attr("x", d => x(d.quantity) - 5)
            .attr("y", d => y(d.product_name) + y.bandwidth() / 2 + 5)
            .attr("text-anchor", "end")
            .style("fill", "white")
            .style("font-size", "12px");
    }, [filteredData]);
      
      
      

    // Pie Chart
    useEffect(() => {
        if (!pieRef.current || filteredData.length === 0) return;
      
        d3.select(pieRef.current).selectAll("*").remove();
      
        const width = 300;
        const height = 300;
        const radius = Math.min(width, height) / 2;
        const innerRadius = 80; // much smaller hole
      
        const svg = d3
          .select(pieRef.current)
          .append("svg")
          .attr("width", width)
          .attr("height", height)
          .append("g")
          .attr("transform", `translate(${width / 2},${height / 2})`);
      
        const pie = d3.pie().value(d => d.quantity);
        const arc = d3.arc().innerRadius(innerRadius).outerRadius(radius);
        const arcExpanded = d3.arc().innerRadius(innerRadius).outerRadius(radius + 10);
        const color = d3.scaleOrdinal(d3.schemeCategory10);
      
        const total = d3.sum(filteredData, d => d.quantity);
      
        // Center text elements
        const centerName = svg
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
          .attr("fill", d => color(d.data.product_name))
          .transition()
          .duration(800)
          .attrTween("d", function(d) {
            const interp = d3.interpolate(
              { startAngle: d.startAngle, endAngle: d.startAngle },
              d
            );
            return t => arc(interp(t));
          });
      
        arcs.selectAll("path")
          .on("mouseover", function() {
            d3.select(this).transition().duration(200).attr("transform", "scale(1.05)");
          })
          .on("mouseout", function() {
            d3.select(this).transition().duration(200).attr("transform", "scale(1)");
          })
          .on("click", (event, d) => {
            const pct = ((d.data.quantity / total) * 100).toFixed(1);
            centerName
              .text(d.data.product_name.length > 20
                ? d.data.product_name.slice(0, 17) + "…"
                : d.data.product_name
              )
              .transition().duration(300).style("opacity", 1);
            centerPercent
              .text(`${pct}%`)
              .transition().duration(300).style("opacity", 1);
            event.stopPropagation();
          });
      
        arcs
          .append("text")
          .attr("transform", d => `translate(${arc.centroid(d)})`)
          .attr("text-anchor", "middle")
          .attr("font-size", "10px")
          .attr("fill", "#fff")
          .text(d =>
            d.data.product_name.length > 10
              ? d.data.product_name.slice(0, 7) + "…"
              : d.data.product_name
          )
          .style("opacity", 0)
          .transition().delay((_, i) => i * 100).duration(500).style("opacity", 1);
      
        // Clear center on background click
        d3.select(pieRef.current).select("svg")
          .on("click", () => {
            centerName.transition().duration(300).style("opacity", 0);
            centerPercent.transition().duration(300).style("opacity", 0);
          });
      }, [filteredData, selectedProduct]);
      
    
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Top Selling Items Dashboard</h1>

            <TopProductInfo topItem={data[0]} />

            <div className="flex items-center mb-4 gap-4">
                <label htmlFor="topN" className="font-medium text-gray-700">
                    Show Top Items:
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
                    <h2 className="text-xl font-bold mb-4">Top Sold Items</h2>
                    <div className="overflow-x-auto">
                        <div ref={barRef} className="w-full" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-4">Sales Share</h2>
                    <div>
                        <div ref={pieRef}></div>
                        {selectedProduct && (
                            <div className="mt-4 text-center text-sm text-gray-700">
                                <p>
                                    <strong>{selectedProduct.name}</strong>: {selectedProduct.quantity} units (
                                    {selectedProduct.ratio}% of total)
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mt-6">
                <CostliestItemsChart />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mt-6">
                <CheapestItemsChart />
            </div>

        </div>
    );
}

function TopProductInfo({ topItem }) {
    if (!topItem) return null;

    return (
        <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-green-800">Top Selling Product</h2>
            <p className="text-md text-green-700 mt-1">
                <strong>{topItem.product_name}</strong> sold <strong>{topItem.quantity}</strong> units
            </p>
        </div>
    );
}
