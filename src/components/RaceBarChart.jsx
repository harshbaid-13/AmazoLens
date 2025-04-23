import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export default function RaceBarChart() {
  const chartRef = useRef();
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("http://127.0.0.1:8000/dashboard/racing-bar");
      const rawData = await res.json();

      const dataMap = new Map();
      rawData.forEach(([week, product_name, quantity]) => {
        if (!dataMap.has(week)) dataMap.set(week, []);
        dataMap.get(week).push({ product_name, quantity });
      });

      const frames = Array.from(dataMap.entries()).sort(
        ([a], [b]) => new Date(a) - new Date(b)
      );

      const margin = { top: 20, right: 100, bottom: 40, left: 150 };
      const width = 900 - margin.left - margin.right;
      const height = 500 - margin.top - margin.bottom;

      const svg = d3
        .select(chartRef.current)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3.scaleLinear().range([0, width]);
      const y = d3.scaleBand().range([0, height]).padding(0.1);
      const color = d3.scaleOrdinal(d3.schemeTableau10);

      svg.append("g").attr("class", "x-axis").attr("transform", `translate(0, ${height})`);
      svg.append("g").attr("class", "y-axis");

      const dateText = svg
        .append("text")
        .attr("class", "date-text")
        .attr("x", width)
        .attr("y", height - 10)
        .attr("text-anchor", "end")
        .style("font-size", "16px");

      function update(frame) {
        const week = frame[0];
        const bars = frame[1]
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 10);

        x.domain([0, d3.max(bars, (d) => d.quantity)]);
        y.domain(bars.map((d) => d.product_name));

        svg.select(".x-axis").transition().duration(500).call(d3.axisBottom(x).ticks(5));
        svg.select(".y-axis").transition().duration(500).call(d3.axisLeft(y));

        const rects = svg.selectAll(".bar").data(bars, (d) => d.product_name);

        rects
          .join(
            (enter) =>
              enter
                .append("rect")
                .attr("class", "bar")
                .attr("x", 0)
                .attr("y", (d) => y(d.product_name))
                .attr("height", y.bandwidth())
                .attr("width", 0)
                .attr("fill", (d) => color(d.product_name))
                .transition()
                .duration(500)
                .attr("width", (d) => x(d.quantity)),
            (update) =>
              update
                .transition()
                .duration(500)
                .attr("y", (d) => y(d.product_name))
                .attr("width", (d) => x(d.quantity))
          );

        const labels = svg.selectAll(".label").data(bars, (d) => d.product_name);

        labels
          .join(
            (enter) =>
              enter
                .append("text")
                .attr("class", "label")
                .attr("x", 0)
                .attr("y", (d) => y(d.product_name) + y.bandwidth() / 2)
                .attr("dy", ".35em")
                .style("font-size", "12px")
                .text((d) => d.quantity)
                .transition()
                .duration(500)
                .attr("x", (d) => x(d.quantity) + 10),
            (update) =>
              update
                .transition()
                .duration(500)
                .attr("x", (d) => x(d.quantity) + 10)
                .attr("y", (d) => y(d.product_name) + y.bandwidth() / 2)
                .text((d) => d.quantity)
          );

        dateText.text(`Week of ${week}`);
      }

      let i = 0;
      function animate() {
        if (i >= frames.length) return;
        update(frames[i]);
        i++;
        setTimeout(animate, 2000); // 2 second pause
      }

      animate();
    };

    d3.select(chartRef.current).selectAll("*").remove();
    fetchData();
  }, [replayKey]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Top 10 Products - Weekly Sales Race</h2>
      <button
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => setReplayKey((prev) => prev + 1)}
      >
        Restart Race
      </button>
      <div ref={chartRef}></div>
    </div>
  );
}
