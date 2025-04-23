import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export default function CustomerSegmentation() {
  const bubbleChartRef = useRef();
  const heatmapRef = useRef();
  const [selectedSegment, setSelectedSegment] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState([]);
  const [cohortGroupedData, setCohortGroupedData] = useState(new Map());

  useEffect(() => {
    d3.csv("/cohort_analysis_data2.csv").then((data) => {
      data.forEach(d => {
        d.final_customer_count = +d.final_customer_count;
        d.cohort_index = +d.cohort_index;
      });

      const categories = Array.from(new Set(data.map(d => d.l0_category)));
      const grouped = d3.group(data, d => d.l0_category);

      setCategories(["All", ...categories.filter(cat => cat !== "All")]);
      setCohortGroupedData(grouped);
    });
  }, []);

  const segmentData = [
    { segment: "Champions", count: 1115139, recency: 10.15, frequency: 8.2, monetary: 3577621000 },
    { segment: "Loyal", count: 361669, recency: 28.13, frequency: 3.9, monetary: 168031500 },
    { segment: "Potential Loyalist", count: 1441069, recency: 23.99, frequency: 3.4, monetary: 65513250 },
    { segment: "New Customers", count: 449701, recency: 23.53, frequency: 2.8, monetary: 12160360 },
    { segment: "Promising", count: 896355, recency: 18.61, frequency: 2.2, monetary: 223429900 },
    { segment: "Need Attention", count: 509149, recency: 28.11, frequency: 1.8, monetary: 79610850 },
    { segment: "About To Sleep", count: 435026, recency: 40.07, frequency: 1.6, monetary: 12667900 },
    { segment: "Hibernating customers", count: 1247367, recency: 51.54, frequency: 1.4, monetary: 53191600 },
    { segment: "At Risk", count: 1206999, recency: 58.89, frequency: 1.0, monetary: 274926300 },
    { segment: "Cannot Lose Them", count: 668758, recency: 66.44, frequency: 1.1, monetary: 263660100 },
    { segment: "Lost customers", count: 438160, recency: 71.85, frequency: 1.05, monetary: 8798432 }
  ];

  useEffect(() => {
    if (!bubbleChartRef.current) return;
  
    d3.select(bubbleChartRef.current).selectAll("*").remove();
  
    const margin = { top: 60, right: 220, bottom: 50, left: 60 };
    const width = 900 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;
  
    const svg = d3
      .select(bubbleChartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    const segmentColorMap = {
      "Potential Loyalist": "#1f77b4",
      "Hibernating customers": "#aec7e8",
      "At Risk": "#ff7f0e",
      "Champions": "#2ca02c",
      "Promising": "#c49c94",
      "Cannot Lose Them": "#d62728",
      "Need Attention": "#9467bd",
      "New Customers": "#8c564b",
      "Lost customers": "#e377c2",
      "About To Sleep": "#7f7f7f",
      "Loyal": "#17becf"
    };
  
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "#333")
      .style("color", "#fff")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("display", "none")
      .style("pointer-events", "none");
  
    const adjustedData = segmentData.map((d) => {
      return { ...d, Frequency: d.frequency };
    });
  
    const x = d3.scaleLinear()
      .domain([0, d3.max(adjustedData, (d) => d.Frequency) + 2])
      .range([0, width]);
  
    const y = d3.scaleLinear()
      .domain([0, d3.max(adjustedData, (d) => d.recency) + 10])
      .range([0, height]);
  
    const size = d3.scaleSqrt()
      .domain([0, d3.max(adjustedData, (d) => d.count)])
      .range([5, 30]);
  
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));
  
    svg.append("g")
      .call(d3.axisLeft(y));
  
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -30)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Customer Segments by Frequency and Recency");
  
    // X-axis label
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Frequency");
  
    // Y-axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Recency (days)");
  
    svg.selectAll("circle")
      .data(adjustedData)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.Frequency))
      .attr("cy", (d) => y(d.recency))
      .attr("r", (d) => size(d.count))
      .style("fill", (d) => segmentColorMap[d.segment] || "#ccc")
      .style("opacity", 0.8)
      .attr("stroke", "black")
      .on("mouseover", function (event, d) {
        tooltip
          .style("display", "block")
          .html(`<strong>${d.segment}</strong><br/>Customers: ${d.count}<br/>Recency: ${d.recency} days<br/>Frequency: ${d.frequency}<br/>Monetary: ₹${(d.monetary / 1e6).toFixed(2)}M`);
      })
      .on("mousemove", function (event) {
        tooltip.style("left", event.pageX + 10 + "px").style("top", event.pageY - 30 + "px");
      })
      .on("mouseout", function () {
        tooltip.style("display", "none");
      })
      .on("click", (event, d) => setSelectedSegment(d));
  
    // Legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width + 20}, 20)`);
  
    Object.entries(segmentColorMap).forEach(([segment, color], i) => {
      legend.append("circle")
        .attr("cx", 0)
        .attr("cy", i * 24)
        .attr("r", 6)
        .style("fill", color);
  
      legend.append("text")
        .attr("x", 15)
        .attr("y", i * 24 + 4)
        .text(segment)
        .attr("font-size", "12px")
        .attr("alignment-baseline", "middle");
    });
  
  }, []);
  

  useEffect(() => {
    if (!heatmapRef.current) return;
  
    d3.select(heatmapRef.current).selectAll("*").remove();
  
    const drawHeatmap = (data, isPreprocessed = false) => {
      const cohortWeeks = Array.from(new Set(data.map(d => d.cohort_week))).sort();
      const weekIndexes = Array.from(new Set(data.map(d => +d.cohort_index))).sort((a, b) => a - b);
  
      const cellSize = 38;
      const margin = { top: 50, right: 80, bottom: 50, left: 180 };
      const width = weekIndexes.length * cellSize;
      const height = cohortWeeks.length * cellSize;
  
      const svg = d3.select(heatmapRef.current)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
  
        const x = d3.scaleBand()
        .domain(weekIndexes)
        .range([0, width])
        .padding(0.09);  
      
  
      const y = d3.scaleBand()
        .domain(cohortWeeks)
        .range([0, height])
        .padding(0.09);
  
      const colorScale = d3.scaleLinear()
        .domain([0, 100])
        .range(["#f0f9e8", "#0868ac"]);
  
      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d => `Week ${d}`));
  
      svg.append("g")
        .call(d3.axisLeft(y));
  
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(`Cohort Retention Heatmap (Percentage) for Category: ${selectedCategory}`);
  
      svg.selectAll("rect.cell")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", d => x(+d.cohort_index))
        .attr("y", d => y(d.cohort_week))
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", d => colorScale(+d.percent))
        .style("stroke", "#fff");
  
      svg.selectAll("text.cell-label")
        .data(data)
        .enter()
        .append("text")
        .attr("x", d => x(+d.cohort_index) + x.bandwidth() / 2)
        .attr("y", d => y(d.cohort_week) + y.bandwidth() / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .style("font-size", "13px")
        .style("fill", d => +d.percent > 50 ? "#fff" : "#222")
        .text(d => +d.percent > 0 ? d.percent : "");
  
      // Color legend
      const defs = svg.append("defs");
      const linearGradient = defs.append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%").attr("x2", "0%")
        .attr("y1", "100%").attr("y2", "0%");
      linearGradient.append("stop").attr("offset", "0%").attr("stop-color", "#f0f9e8");
      linearGradient.append("stop").attr("offset", "100%").attr("stop-color", "#0868ac");
  
      const legendHeight = 200;
      const legendWidth = 15;
      svg.append("rect")
        .attr("x", width + 30)
        .attr("y", 10)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)");
  
      const legendScale = d3.scaleLinear().domain([0, 100]).range([legendHeight + 10, 10]);
      const legendAxis = d3.axisRight(legendScale).ticks(5).tickFormat(d => d + "%");
      svg.append("g")
        .attr("class", "legend axis")
        .attr("transform", `translate(${width + 30 + legendWidth},0)`)
        .call(legendAxis);
    };
  
    if (selectedCategory === "All") {
      d3.csv("/processed_all_cohort.csv").then(data => {
        data.forEach(d => {
          d.cohort_index = +d.cohort_index;
          d.percent = +d.percent;
        });
        drawHeatmap(data, true);
      });
    } else {
      const rawData = cohortGroupedData.get(selectedCategory) || [];
      const cohortSizeMap = {};
      rawData.forEach(d => {
        if (+d.cohort_index === 0) {
          cohortSizeMap[d.cohort_week] = +d.final_customer_count;
        }
      });
  
      const dataMap = new Map();
      rawData.forEach(d => {
        const key = `${d.cohort_week}-${+d.cohort_index}`;
        dataMap.set(key, +d.final_customer_count);
      });
  
      const cohortWeeks = Array.from(new Set(rawData.map(d => d.cohort_week))).sort();
      const weekIndexes = Array.from(new Set(rawData.map(d => +d.cohort_index))).sort((a, b) => a - b);
  
      const percentData = [];
      cohortWeeks.forEach(week => {
        weekIndexes.forEach(index => {
          const key = `${week}-${index}`;
          const count = dataMap.get(key) || 0;
          const base = cohortSizeMap[week] || 0;
          percentData.push({
            cohort_week: week,
            cohort_index: index,
            percent: base > 0 ? +(count / base * 100).toFixed(1) : 0.1
          });
        });
      });      
  
      drawHeatmap(percentData);
    }
  }, [selectedCategory, cohortGroupedData]);
  
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Customer Segmentation</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Customer Segment Analysis</h2>
        <p className="mb-4">
          This visualization shows customer segments based on recency,
          frequency, and monetary value (RFM).
        </p>
        <div ref={bubbleChartRef} className="overflow-x-auto"></div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Cohort Retention Analysis</h2>
        <p className="mb-4">
          This heatmap shows customer retention rates by cohort over time.
        </p>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="mb-4 px-3 py-2 border rounded"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <div ref={heatmapRef} className="overflow-x-auto"></div>
      </div>

      {selectedSegment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-md">
            <h3 className="text-lg font-bold mb-4">{selectedSegment.segment}</h3>
            <p><strong>Customers:</strong> {selectedSegment.count}</p>
            <p><strong>Frequency:</strong> {selectedSegment.frequency}</p>
            <p><strong>Recency:</strong> {selectedSegment.recency}</p>
            <p><strong>Monetary:</strong> ₹{(selectedSegment.monetary / 1e6).toFixed(2)}M</p>
            <button
              onClick={() => setSelectedSegment(null)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

