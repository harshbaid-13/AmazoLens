import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export default function CheapestItemsChart() {
    const donutRef = useRef();
    const barRef = useRef();
const tooltipRef = useRef(null);

    const [data, setData] = useState([]);
    const [topN, setTopN] = useState(10);

    useEffect(() => {
        const fallback = [
            { product_name: "Cheap A", lowest_unit_selling_price: 0.99, sales_count: 10 },
            { product_name: "Cheap B", lowest_unit_selling_price: 1.25, sales_count: 7 },
            { product_name: "Cheap C", lowest_unit_selling_price: 2.10, sales_count: 4 },
        ];

        fetch("http://localhost:8000/analytics/cheapest-items")
            .then(res => res.ok ? res.json() : Promise.reject("Fetch failed"))
            .then(json => {
                const parsed = typeof json === "string" ? JSON.parse(json) : json;
                const cleaned = parsed
                    .map(d => ({
                        product_name: d.product_name?.trim(),
                        lowest_unit_selling_price: Number(d.lowest_unit_selling_price),
                        sales_count: Number(d.sales_count) || 0,
                    }))
                    .filter(d => d.product_name && d.lowest_unit_selling_price > 0);

                setData(cleaned.length ? cleaned : fallback);
            })
            .catch(err => {
                console.error("Data fetch error:", err);
                setData(fallback);
            });
    }, []);

    const filtered = data.slice(0, topN);

    useEffect(() => {
        if (!donutRef.current || filtered.length === 0) return;
    
        const container = donutRef.current;
        d3.select(container).selectAll("*").remove();
    
        const width = 400, height = 400;
        const radius = Math.min(width, height) / 2;
    
        const svg = d3.select(container)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`);
    
        const arc = d3.arc().innerRadius(80).outerRadius(radius - 10);
        const arcLabel = d3.arc().innerRadius(radius * 0.8).outerRadius(radius * 0.8);
        const color = d3.scaleOrdinal(d3.schemeTableau10);
    
        const priceMap = d3.rollups(
            filtered,
            v => v.length,
            d => d.lowest_unit_selling_price
        ).map(([price, count]) => ({
            price,
            count,
            label: `₹${price.toFixed(2)}`
        }));
    
        const pie = d3.pie()
            .sort(null)
            .value(d => d.count);
    
        const dataReady = pie(priceMap);
    
        svg.selectAll("path")
            .data(dataReady)
            .enter()
            .append("path")
            .attr("fill", d => color(d.data.label))
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .transition()
            .duration(1000)
            .attrTween("d", function (d) {
                const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
                return t => arc(i(t));
            });
    
        svg.selectAll("path")
            .data(dataReady)
            .on("click", (event, d) => {
                const items = filtered.filter(i => i.lowest_unit_selling_price === d.data.price);
                const detailedData = items.map(i => ({ ...i, key: i.product_name }));
    
                const updatedPie = d3.pie()
                    .sort(null)
                    .value(d => d.sales_count)(detailedData);
    
                svg.selectAll("*").remove();
    
                svg.selectAll("path")
                    .data(updatedPie)
                    .enter()
                    .append("path")
                    .attr("fill", d => color(d.data.key))
                    .attr("stroke", "white")
                    .attr("stroke-width", 2)
                    .transition()
                    .duration(1000)
                    .attrTween("d", function (d) {
                        const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
                        return t => arc(i(t));
                    });
    
                svg.selectAll("path")
                    .data(updatedPie)
                    .on("click", (event, d) => {
                        alert(`Product: ${d.data.product_name}\nPrice: ₹${d.data.lowest_unit_selling_price}\nSales: ${d.data.sales_count}`);
                    });
    
                svg.selectAll("text")
                    .data(updatedPie)
                    .enter()
                    .append("text")
                    .text(d => {
                        const name = d.data.product_name;
                        if (name.length <= 12) return name;
                        const words = name.split(" ");
                        let short = words[0];
                        for (let i = 1; i < words.length && (short + " " + words[i]).length <= 8; i++) {
                            short += " " + words[i];
                        }
                        return short + "…";
                    })
                    .attr("transform", d => `translate(${arcLabel.centroid(d)})`)
                    .attr("text-anchor", "middle")
                    .style("opacity", 0)
                    .style("font-size", "11px")
                    .style("font-weight", "bold")
                    .style("font-family", "sans-serif")
                    .transition()
                    .delay(800)
                    .duration(500)
                    .style("opacity", 1);
    
                // Add title (tooltip) for full product name
                svg.selectAll("text")
                    .data(updatedPie)
                    .append("title")
                    .text(d => d.data.product_name);
            });
    
        svg.selectAll("text")
            .data(dataReady)
            .enter()
            .append("text")
            .text(d => d.data.label)
            .attr("transform", d => `translate(${arcLabel.centroid(d)})`)
            .attr("text-anchor", "middle")
            .style("opacity", 0)
            .style("font-size", "11px")
            .style("font-weight", "bold")
            .style("font-family", "sans-serif")
            .transition()
            .delay(800)
            .duration(500)
            .style("opacity", 1);
    }, [filtered]);
    
    

    useEffect(() => {
        if (!barRef.current || filtered.length === 0) return;
    
        const margin = { top: 20, right: 20, bottom: 60, left: 60 };
        const width = 500 - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;
    
        d3.select(barRef.current).selectAll("*").remove();
    
        const svg = d3.select(barRef.current)
            .append("svg")
            .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    
        const drawGroupedBars = () => {
            svg.selectAll("*").remove();
    
            const groupedData = d3.rollups(
                filtered,
                v => d3.sum(v, d => d.sales_count),
                d => d.lowest_unit_selling_price
            ).map(([price, totalSales]) => ({
                price,
                totalSales,
                label: `₹${price.toFixed(2)}`
            }));
    
            const x = d3.scaleBand()
                .domain(groupedData.map(d => d.label))
                .range([0, width])
                .padding(0.2);
    
            const y = d3.scaleLinear()
                .domain([0, d3.max(groupedData, d => d.totalSales)])
                .nice()
                .range([height, 0]);
    
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x))
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("transform", "rotate(-30)")
                .style("font-size", "10px");
    
            svg.append("g").call(d3.axisLeft(y));
    
            svg.selectAll(".bar")
                .data(groupedData)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", d => x(d.label))
                .attr("width", x.bandwidth())
                .attr("y", height)
                .attr("height", 0)
                .attr("fill", "#60A5FA")
                .style("cursor", "pointer")
                .transition()
                .duration(800)
                .attr("y", d => y(d.totalSales))
                .attr("height", d => height - y(d.totalSales));
    
            svg.selectAll(".bar")
                .on("click", (event, d) => {
                    const priceVal = parseFloat(d.label.replace("₹", ""));
                    const products = filtered.filter(item => item.lowest_unit_selling_price === priceVal);
                    drawProductBars(products, `₹${priceVal.toFixed(2)}`);
                });
        };
    
        const drawProductBars = (products, label) => {
            svg.selectAll("*").remove();
    
            const x = d3.scaleBand()
                .domain(products.map(d => d.product_name))
                .range([0, width])
                .padding(0.2);
    
            const y = d3.scaleLinear()
                .domain([0, d3.max(products, d => d.sales_count)])
                .nice()
                .range([height, 0]);
    
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x))
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("transform", "rotate(-30)")
                .style("font-size", "10px");
    
            svg.append("g").call(d3.axisLeft(y));
    
            svg.selectAll(".bar")
                .data(products)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", d => x(d.product_name))
                .attr("width", x.bandwidth())
                .attr("y", height)
                .attr("height", 0)
                .attr("fill", "#34D399") // green
                .transition()
                .duration(800)
                .attr("y", d => y(d.sales_count))
                .attr("height", d => height - y(d.sales_count));
    
            svg.selectAll(".bar")
                .on("click", (event, d) => {
                    alert(`Product: ${d.product_name}\nPrice: ₹${d.lowest_unit_selling_price}\nSales: ${d.sales_count}`);
                });
    
            svg.append("text")
                .text(`← Back to Prices`)
                .attr("x", 0)
                .attr("y", -5)
                .attr("fill", "#2563EB")
                .style("cursor", "pointer")
                .style("font-size", "12px")
                .on("click", () => drawGroupedBars());
        };
    
        drawGroupedBars();
    }, [filtered]);
    

    return (
        <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Cheapest Products</h2>
            <p className="mb-4">Click on slices or bars for more details.</p>

            <div className="flex items-center mb-4 gap-4">
                <label htmlFor="cheapestTopN" className="font-medium text-gray-700">Top Items:</label>
                <input
                    id="cheapestTopN"
                    type="range"
                    min="5"
                    max="200"
                    value={topN}
                    onChange={e => setTopN(+e.target.value)}
                    className="w-64"
                />
                <span className="text-sm text-gray-600">{topN}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div ref={donutRef} className="w-full" />
                <div ref={barRef} className="w-full" />
            </div>
        </div>
    );
}
