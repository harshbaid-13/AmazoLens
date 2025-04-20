import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function CustomerSegmentation() {
  const bubbleChartRef = useRef();
  const heatmapRef = useRef();

  // Mock data for customer segments
  const segmentData = [
    {
      id: 1,
      segment: "High Value",
      count: 1250,
      avgOrderValue: 120,
      frequency: 12,
      recency: 5,
    },
    {
      id: 2,
      segment: "Loyal",
      count: 3500,
      avgOrderValue: 75,
      frequency: 8,
      recency: 10,
    },
    {
      id: 3,
      segment: "Potential Loyalists",
      count: 4800,
      avgOrderValue: 60,
      frequency: 4,
      recency: 20,
    },
    {
      id: 4,
      segment: "New Customers",
      count: 6200,
      avgOrderValue: 45,
      frequency: 1,
      recency: 15,
    },
    {
      id: 5,
      segment: "Promising",
      count: 5100,
      avgOrderValue: 55,
      frequency: 2,
      recency: 25,
    },
    {
      id: 6,
      segment: "Need Attention",
      count: 2800,
      avgOrderValue: 65,
      frequency: 3,
      recency: 45,
    },
    {
      id: 7,
      segment: "About to Sleep",
      count: 2100,
      avgOrderValue: 50,
      frequency: 5,
      recency: 60,
    },
    {
      id: 8,
      segment: "At Risk",
      count: 1900,
      avgOrderValue: 80,
      frequency: 6,
      recency: 90,
    },
    {
      id: 9,
      segment: "Hibernating",
      count: 3200,
      avgOrderValue: 40,
      frequency: 2,
      recency: 120,
    },
    {
      id: 10,
      segment: "Lost",
      count: 4500,
      avgOrderValue: 30,
      frequency: 1,
      recency: 180,
    },
  ];

  // Cohort retention data
  const cohortData = [
    { month: "Jan", m0: 100, m1: 80, m2: 70, m3: 65, m4: 60, m5: 58 },
    { month: "Feb", m0: 100, m1: 82, m2: 72, m3: 68, m4: 62 },
    { month: "Mar", m0: 100, m1: 85, m2: 75, m3: 70 },
    { month: "Apr", m0: 100, m1: 83, m2: 73 },
    { month: "May", m0: 100, m1: 87 },
    { month: "Jun", m0: 100 },
  ];

  // Draw bubble chart
  useEffect(() => {
    if (!bubbleChartRef.current) return;

    // Clear previous chart
    d3.select(bubbleChartRef.current).selectAll("*").remove();

    const width = 700;
    const height = 500;

    const svg = d3
      .select(bubbleChartRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(0,0)`);

    // Scale for bubble size
    const size = d3
      .scaleLinear()
      .domain([0, d3.max(segmentData, (d) => d.count)])
      .range([20, 80]);

    // Scale for x-axis (frequency)
    const x = d3
      .scaleLinear()
      .domain([0, d3.max(segmentData, (d) => d.frequency) + 2])
      .range([50, width - 50]);

    // Scale for y-axis (recency, inverted so smaller values are on top)
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(segmentData, (d) => d.recency) + 10])
      .range([50, height - 50]);

    // Color scale based on average order value
    const color = d3
      .scaleSequential()
      .domain([
        d3.min(segmentData, (d) => d.avgOrderValue),
        d3.max(segmentData, (d) => d.avgOrderValue),
      ])
      .interpolator(d3.interpolateBlues);

    // Add X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height - 30})`)
      .call(d3.axisBottom(x).ticks(5));

    // Add X axis label
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height - 5)
      .text("Purchase Frequency");

    // Add Y axis
    svg
      .append("g")
      .attr("transform", `translate(30,0)`)
      .call(d3.axisLeft(y).ticks(5));

    // Add Y axis label
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(10,${height / 2}) rotate(-90)`)
      .text("Days Since Last Purchase");

    // Add bubbles
    svg
      .selectAll(".bubble")
      .data(segmentData)
      .enter()
      .append("circle")
      .attr("class", "bubble")
      .attr("cx", (d) => x(d.frequency))
      .attr("cy", (d) => y(d.recency))
      .attr("r", (d) => size(d.count) / 2)
      .style("fill", (d) => color(d.avgOrderValue))
      .style("opacity", 0.7)
      .attr("stroke", "black")
      .style("stroke-width", 1);

    // Add labels to bubbles
    svg
      .selectAll(".label")
      .data(segmentData)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", (d) => x(d.frequency))
      .attr("y", (d) => y(d.recency))
      .text((d) => d.segment)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("pointer-events", "none");

    // Add title
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", 20)
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Customer Segments by Frequency and Recency");

    // Add legend for bubble size
    svg
      .append("text")
      .attr("x", 50)
      .attr("y", 60)
      .style("font-size", "12px")
      .text("Bubble size: Number of customers");

    // Add legend for color
    svg
      .append("text")
      .attr("x", 50)
      .attr("y", 80)
      .style("font-size", "12px")
      .text("Color intensity: Average Order Value");
  }, []);

  // Draw cohort heatmap
  useEffect(() => {
    if (!heatmapRef.current) return;

    // Clear previous chart
    d3.select(heatmapRef.current).selectAll("*").remove();

    const margin = { top: 50, right: 30, bottom: 50, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3
      .select(heatmapRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Get all cohort months (rows)
    const cohortMonths = cohortData.map((d) => d.month);

    // Get all retention months (columns)
    const retentionMonths = Object.keys(cohortData[0])
      .filter((key) => key.startsWith("m"))
      .sort();

    // Create scales
    const x = d3
      .scaleBand()
      .range([0, width])
      .domain(retentionMonths)
      .padding(0.05);

    const y = d3
      .scaleBand()
      .range([0, height])
      .domain(cohortMonths)
      .padding(0.05);

    // Build color scale
    const colorScale = d3
      .scaleSequential()
      .interpolator(d3.interpolateGreens)
      .domain([0, 100]);

    // Add X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat((d) => `Month ${d.slice(1)}`));

    // Add Y axis
    svg.append("g").call(d3.axisLeft(y));

    // Add title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Cohort Retention Analysis (%)");

    // Create the heatmap cells
    cohortData.forEach((d) => {
      retentionMonths.forEach((month) => {
        if (d[month] !== undefined) {
          svg
            .append("rect")
            .attr("x", x(month))
            .attr("y", y(d.month))
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", colorScale(d[month]))
            .style("stroke", "white")
            .style("stroke-width", 1);

          svg
            .append("text")
            .attr("x", x(month) + x.bandwidth() / 2)
            .attr("y", y(d.month) + y.bandwidth() / 2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .style("font-size", "11px")
            .style("fill", d[month] > 50 ? "white" : "black")
            .text(`${d[month]}%`);
        }
      });
    });
  }, []);

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
        <div ref={heatmapRef} className="overflow-x-auto"></div>
      </div>
    </div>
  );
}
