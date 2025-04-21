import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export default function CheapestItemsChart() {
    const chartRef = useRef();
    const [data, setData] = useState([]);
    const [topN, setTopN] = useState(10);

    useEffect(() => {
        const fallback = [
            { product_name: "Cheap A", lowest_unit_selling_price: 0.99 },
            { product_name: "Cheap B", lowest_unit_selling_price: 1.25 },
            { product_name: "Cheap C", lowest_unit_selling_price: 2.10 },
        ];

        fetch("http://localhost:8000/analytics/cheapest-items")
            .then(res => {
                if (!res.ok) throw new Error("Network response not ok");
                return res.json();
            })
            .then(json => {
                const rawData = typeof json === "string" ? JSON.parse(json) : json;

                const cleaned = rawData
                    .map(d => ({
                        product_name: d.product_name?.trim(),
                        lowest_unit_selling_price: Number(d.lowest_unit_selling_price),
                    }))
                    .filter(
                        d =>
                            d.product_name &&
                            d.product_name !== "" &&
                            !isNaN(d.lowest_unit_selling_price) &&
                            d.lowest_unit_selling_price > 0
                    );

                if (cleaned.length > 0) {
                    setData(cleaned);
                } else {
                    setData(fallback);
                }
            })
            .catch(err => {
                console.error("Cheapest items fetch failed:", err);
                setData(fallback);
            });
    }, []);

    const filtered = data.slice(0, topN);

    useEffect(() => {
        if (!chartRef.current || filtered.length === 0) return;

        const container = chartRef.current;
        d3.select(container).selectAll("*").remove();

        const width = container.offsetWidth || 600;
        const height = 400;
        const margin = { top: 20, right: 20, bottom: 80, left: 60 };

        const svg = d3
            .select(container)
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const x = d3
            .scaleBand()
            .domain(filtered.map(d => d.product_name))
            .range([margin.left, width - margin.right])
            .padding(0.2);

        const y = d3
            .scaleLinear()
            .domain([0, d3.max(filtered, d => d.lowest_unit_selling_price)])
            .nice()
            .range([height - margin.bottom, margin.top]);

        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y));

        svg.selectAll(".bar")
            .data(filtered)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.product_name))
            .attr("y", d => y(d.lowest_unit_selling_price))
            .attr("width", x.bandwidth())
            .attr("height", d => height - margin.bottom - y(d.lowest_unit_selling_price))
            .attr("fill", "#10B981");

        svg.selectAll(".label")
            .data(filtered)
            .enter()
            .append("text")
            .text(d => d.lowest_unit_selling_price.toFixed(2))
            .attr("x", d => x(d.product_name) + x.bandwidth() / 2)
            .attr("y", d => y(d.lowest_unit_selling_price) - 5)
            .attr("text-anchor", "middle")
            .style("font-size", "11px")
            .style("fill", "#333");
    }, [filtered]);

    return (
        <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Cheapest Products (Column Chart)</h2>

            <div className="flex items-center mb-4 gap-4">
                <label htmlFor="cheapestTopN" className="font-medium text-gray-700">
                    Show Top Items:
                </label>
                <input
                    id="cheapestTopN"
                    type="range"
                    min="5"
                    max="100"
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
