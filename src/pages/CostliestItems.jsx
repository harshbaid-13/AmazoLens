import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export default function CostliestItemsChart() {
    const chartRef = useRef();
    const [data, setData] = useState([]);
    const [topN, setTopN] = useState(10);

    useEffect(() => {
        const fallback = [
            { product_name: "Expensive A", highest_unit_selling_price: 900 },
            { product_name: "Expensive B", highest_unit_selling_price: 850 },
            { product_name: "Expensive C", highest_unit_selling_price: 800 },
        ];

        fetch("http://localhost:8000/analytics/costliest-items")
            .then(res => {
                if (!res.ok) throw new Error("Network response not ok");
                return res.json();
            })
            .then(json => {
                const rawData = typeof json === "string" ? JSON.parse(json) : json;

                const cleaned = rawData
                    .map(d => ({
                        product_name: d.product_name?.trim(),
                        highest_unit_selling_price: Number(d.highest_unit_selling_price),
                    }))
                    .filter(
                        d =>
                            d.product_name &&
                            d.product_name !== "" &&
                            !isNaN(d.highest_unit_selling_price) &&
                            d.highest_unit_selling_price > 0
                    )
                    .sort((a, b) => b.highest_unit_selling_price - a.highest_unit_selling_price);

                if (cleaned.length > 0) {
                    setData(cleaned);
                } else {
                    setData(fallback);
                }
            })
            .catch(err => {
                console.error("Costliest items fetch failed:", err);
                setData(fallback);
            });
    }, []);

    const filtered = data.slice(0, topN);

    useEffect(() => {
        if (!chartRef.current || filtered.length === 0) return;
      
        // 1. Filter out any invalid entries
        const validData = filtered.filter(
          d =>
            typeof d.highest_unit_selling_price === "number" &&
            !isNaN(d.highest_unit_selling_price)
        );
        if (validData.length === 0) {
          d3.select(chartRef.current).selectAll("*").remove();
          return;
        }
      
        const container = chartRef.current;
        d3.select(container).selectAll("*").remove();
      
        const width = container.offsetWidth || 600;
        const height = 400;
        const margin = { top: 20, right: 20, bottom: 50, left: 150 };
      
        const svg = d3
          .select(container)
          .append("svg")
          .attr("width", width)
          .attr("height", height);
      
        // 2. Scales: x is linear, y is band
        const x = d3
          .scaleLinear()
          .domain([0, d3.max(validData, d => d.highest_unit_selling_price)])
          .nice()
          .range([margin.left, width - margin.right]);
      
        const y = d3
          .scaleBand()
          .domain(validData.map(d => d.product_name))
          .range([margin.top, height - margin.bottom])
          .padding(0.2);
      
        // 3. Axes
        svg
          .append("g")
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(d3.axisBottom(x).ticks(5).tickFormat(d => `₹${d}`))
          .selectAll("text")
          .style("font-size", "12px");
      
        svg
          .append("g")
          .attr("transform", `translate(${margin.left},0)`)
          .call(d3.axisLeft(y))
          .selectAll("text")
          .style("font-size", "12px");
      
        // 4. Bars (start at zero width)
        const bars = svg
          .selectAll(".bar")
          .data(validData)
          .enter()
          .append("rect")
          .attr("class", "bar")
          .attr("x", margin.left)
          .attr("y", d => y(d.product_name))
          .attr("height", y.bandwidth())
          .attr("width", 0)
          .attr("fill", "#EF4444")
          .on("mouseover", function () {
            d3.select(this)
              .transition()
              .duration(200)
              .attr("fill", "#DC2626")
              .attr("x", margin.left - 5)
              .attr("width", d => x(d.highest_unit_selling_price) - margin.left + 10);
          })
          .on("mouseout", function () {
            d3.select(this)
              .transition()
              .duration(200)
              .attr("fill", "#EF4444")
              .attr("x", margin.left)
              .attr("width", d => x(d.highest_unit_selling_price) - margin.left);
          })
          .on("click", (event, d) => {
            alert(
              `Product: ${d.product_name}\nPrice: ₹${d.highest_unit_selling_price.toFixed(
                2
              )}`
            );
          });
      
        // 5. Animate bars growing
        bars
          .transition()
          .duration(800)
          .delay((_, i) => i * 50)
          .ease(d3.easeCubicOut)
          .attr("width", d => x(d.highest_unit_selling_price) - margin.left);
      
        // 6. Labels (fade in and slide)
        svg
          .selectAll(".label")
          .data(validData)
          .enter()
          .append("text")
          .attr("class", "label")
          .text(d => `₹${d.highest_unit_selling_price.toFixed(2)}`)
          .attr("x", margin.left)
          .attr("y", d => y(d.product_name) + y.bandwidth() / 2)
          .attr("dy", "0.35em")
          .attr("text-anchor", "end")
          .style("fill", "#fff")
          .style("font-size", "12px")
          .style("opacity", 0)
          .transition()
          .duration(600)
          .delay((_, i) => 300 + i * 50)
          .ease(d3.easeCubicOut)
          .attr("x", d => x(d.highest_unit_selling_price) - 5)
          .style("opacity", 1);
      
        // 7. Light grid lines
        svg
          .append("g")
          .attr("class", "grid")
          .attr("transform", `translate(0,${margin.top})`)
          .call(
            d3
              .axisTop(x)
              .ticks(5)
              .tickSize(-height + margin.top + margin.bottom)
              .tickFormat("")
          )
          .selectAll("line")
          .attr("stroke", "#eee")
          .attr("stroke-dasharray", "2,2");
      }, [filtered]);
      

    return (
        <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Costliest Products</h2>
            <p className="mb-4">
          Click on the bars for product information.
        </p>

            <div className="flex items-center mb-4 gap-4">
                <label htmlFor="costliestTopN" className="font-medium text-gray-700">
                    Show Top Items:
                </label>
                <input
                    id="costliestTopN"
                    type="range"
                    min="5"
                    max="20"
                    value={topN}
                    onChange={e => setTopN(+e.target.value)}
                    className="w-64"
                />
                <span className="text-sm text-gray-600">{topN}</span>
            </div>

            <div className="overflow-x-auto">
                <div ref={chartRef} className="w-full" />
            </div>
        </div>
    );
}
