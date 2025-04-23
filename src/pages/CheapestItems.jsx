import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export default function CheapestItemsChart() {
    const donutRef = useRef();
    const barRef = useRef();

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
        if (!donutRef.current || filtered.length === 0) return;

        const container = donutRef.current;
        d3.select(container).selectAll("*").remove();

        const width = 400;
        const height = 400;
        const radius = Math.min(width, height) / 2;

        const svg = d3.select(container)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`);

        const arc = d3.arc()
            .innerRadius(80)
            .outerRadius(radius - 10);

        const pie = d3.pie()
            .sort(null)
            .value(d => d.count ?? 1);

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

        const drawDonut = (data, labelFn, keyFn, clickHandler) => {
            const arcs = pie(data);

            const paths = svg.selectAll("path")
                .data(arcs, d => keyFn(d.data));

            paths.enter()
                .append("path")
                .attr("fill", d => color(keyFn(d.data)))
                .attr("stroke", "#fff")
                .attr("stroke-width", 1.5)
                .transition()
                .duration(600)
                .attrTween("d", function(d) {
                    const i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
                    return t => arc({ ...d, endAngle: i(t) });
                });

            paths.transition()
                .duration(600)
                .attr("d", arc);

            paths.exit().remove();

            svg.selectAll(".label").remove();

            svg.selectAll(".label")
                .data(arcs)
                .enter()
                .append("text")
                .attr("class", "label")
                .attr("transform", d => `translate(${arc.centroid(d)})`)
                .attr("text-anchor", "middle")
                .attr("dy", "0.35em")
                .text(labelFn)
                .style("fill", "#111")
                .style("font-size", "10px")
                .style("pointer-events", "none");

            svg.selectAll("path")
                .on("click", (event, d) => clickHandler(d.data));
        };

        const showItemsForPrice = (price) => {
            const sameItems = filtered
                .filter(item => item.lowest_unit_selling_price === price)
                .map(item => ({
                    ...item,
                    key: item.product_name
                }));

            drawDonut(
                sameItems,
                d => d.data.product_name.length > 12
                    ? d.data.product_name.slice(0, 10) + "…"
                    : d.data.product_name,
                d => d.key,
                (data) => {
                    alert(`Product: ${data.product_name}\nPrice: ₹${data.lowest_unit_selling_price.toFixed(2)}`);
                }
            );
        };

        drawDonut(
            priceMap,
            d => d.data.label,
            d => d.label,
            (data) => showItemsForPrice(data.price)
        );
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
    
        // Group items by price
        const groupedData = d3.rollups(
            filtered,
            v => v,
            d => d.lowest_unit_selling_price
        ).map(([price, items]) => ({
            price,
            count: items.length,
            items,
            label: `₹${price.toFixed(2)}`
        }));
    
        const x = d3.scaleBand()
            .domain(groupedData.map(d => d.label))
            .range([0, width])
            .padding(0.2);
    
        const y = d3.scaleLinear()
            .domain([0, d3.max(groupedData, d => d.count)])
            .nice()
            .range([height, 0]);
    
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("transform", "rotate(-30)")
            .style("font-size", "10px");
    
        svg.append("g")
            .call(d3.axisLeft(y));
    
        const bars = svg.selectAll(".bar")
            .data(groupedData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.label))
            .attr("width", x.bandwidth())
            .attr("y", height)
            .attr("height", 0)
            .attr("fill", "#60A5FA")
            .on("click", (event, d) => {
                drawExpandedBars(d.items, d.label);
            });
    
        bars.transition()
            .duration(800)
            .delay((d, i) => i * 100)
            .attr("y", d => y(d.count))
            .attr("height", d => height - y(d.count));
    
        function drawExpandedBars(items, label) {
            const itemX = d3.scaleBand()
                .domain(items.map(d => d.product_name))
                .range([0, width])
                .padding(0.3);
    
            const itemY = d3.scaleLinear()
                .domain([0, d3.max(items, d => d.lowest_unit_selling_price)])
                .nice()
                .range([height, 0]);
    
            svg.selectAll("*").remove();
    
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(itemX))
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("transform", "rotate(-30)")
                .style("font-size", "10px");
    
            svg.append("g")
                .call(d3.axisLeft(itemY));
    
            svg.selectAll(".bar-expanded")
                .data(items)
                .enter()
                .append("rect")
                .attr("class", "bar-expanded")
                .attr("x", d => itemX(d.product_name))
                .attr("width", itemX.bandwidth())
                .attr("y", height)
                .attr("height", 0)
                .attr("fill", "#FBBF24")
                .on("click", (event, d) => {
                    alert(`Product: ${d.product_name}\nPrice: ₹${d.lowest_unit_selling_price.toFixed(2)}`);
                })
                .transition()
                .duration(800)
                .attr("y", d => itemY(d.lowest_unit_selling_price))
                .attr("height", d => height - itemY(d.lowest_unit_selling_price));
    
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .text(`Items with price ${label}`);
        }
    }, [filtered]);
    

    return (
        <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Cheapest Products</h2>
            <p className="mb-4">
          Click on the slices or bars for more information.
        </p>

            <div className="flex items-center mb-4 gap-4">
                <label htmlFor="cheapestTopN" className="font-medium text-gray-700">
                    Show Top Items:
                </label>
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
