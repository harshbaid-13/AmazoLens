import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export default function SentimentAnalysis() {
  const gaugeChartRef = useRef();
  const trendChartRef = useRef();
  const categoryChartRef = useRef();
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Mock product categories
  const categories = ["All", "Electronics", "Clothing", "Books", "Home"];

  // Mock sentiment data
  const sentimentData = {
    overall: 73, // out of 100
    trendData: [
      { month: "Jan", sentiment: 65 },
      { month: "Feb", sentiment: 68 },
      { month: "Mar", sentiment: 72 },
      { month: "Apr", sentiment: 70 },
      { month: "May", sentiment: 75 },
      { month: "Jun", sentiment: 78 },
      { month: "Jul", sentiment: 76 },
      { month: "Aug", sentiment: 74 },
      { month: "Sep", sentiment: 73 },
      { month: "Oct", sentiment: 77 },
      { month: "Nov", sentiment: 75 },
      { month: "Dec", sentiment: 73 },
    ],
    categoryData: {
      Electronics: {
        sentiment: 76,
        positive: 68,
        neutral: 20,
        negative: 12,
      },
      Clothing: {
        sentiment: 81,
        positive: 72,
        neutral: 17,
        negative: 11,
      },
      Books: {
        sentiment: 85,
        positive: 78,
        neutral: 13,
        negative: 9,
      },
      Home: {
        sentiment: 70,
        positive: 60,
        neutral: 25,
        negative: 15,
      },
    },
    recentReviews: [
      {
        id: 1,
        product: "Smartphone X",
        category: "Electronics",
        text: "Love this phone! The battery life is amazing and the camera quality is stunning.",
        sentiment: "positive",
        date: "2023-12-10",
      },
      {
        id: 2,
        product: "Cotton T-Shirt",
        category: "Clothing",
        text: "Good quality fabric, but runs smaller than expected. Had to return for a larger size.",
        sentiment: "neutral",
        date: "2023-12-08",
      },
      {
        id: 3,
        product: "Mystery Novel",
        category: "Books",
        text: "Couldn't put it down! The twists were unexpected and the characters well developed.",
        sentiment: "positive",
        date: "2023-12-05",
      },
      {
        id: 4,
        product: "Coffee Table",
        category: "Home",
        text: "Assembly was a nightmare. Instructions were unclear and pieces didn't fit properly.",
        sentiment: "negative",
        date: "2023-12-03",
      },
      {
        id: 5,
        product: "Wireless Earbuds",
        category: "Electronics",
        text: "Sound quality is excellent for the price point. Comfortable fit for long periods.",
        sentiment: "positive",
        date: "2023-12-01",
      },
    ],
  };

  // Draw sentiment gauge
  useEffect(() => {
    if (!gaugeChartRef.current) return;

    // Clear previous chart
    d3.select(gaugeChartRef.current).selectAll("*").remove();

    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;

    const svg = d3
      .select(gaugeChartRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Get the sentiment value based on selected category
    const sentimentValue =
      selectedCategory === "All"
        ? sentimentData.overall
        : sentimentData.categoryData[selectedCategory].sentiment;

    // Create a scale for the gauge
    const scale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([-Math.PI / 2, Math.PI / 2]);

    // Background arc for gauge
    const backgroundArc = d3
      .arc()
      .innerRadius(radius - 40)
      .outerRadius(radius - 10)
      .startAngle(-Math.PI / 2)
      .endAngle(Math.PI / 2);

    // Value arc for gauge
    const valueArc = d3
      .arc()
      .innerRadius(radius - 40)
      .outerRadius(radius - 10)
      .startAngle(-Math.PI / 2)
      .endAngle(scale(sentimentValue));

    // Add background arc
    svg.append("path").attr("d", backgroundArc).style("fill", "#e6e6e6");

    // Add value arc with color based on sentiment
    const arcColor = d3
      .scaleLinear()
      .domain([0, 50, 100])
      .range(["#e74c3c", "#f39c12", "#2ecc71"]);

    svg
      .append("path")
      .attr("d", valueArc)
      .style("fill", arcColor(sentimentValue));

    // Add center text
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.5em")
      .style("font-size", "36px")
      .style("font-weight", "bold")
      .text(`${sentimentValue}%`);

    // Add label
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "3em")
      .style("font-size", "14px")
      .text("Positive Sentiment");

    // Add min and max labels
    svg
      .append("text")
      .attr("x", -radius + 10)
      .attr("y", 10)
      .style("font-size", "12px")
      .text("0%");

    svg
      .append("text")
      .attr("x", radius - 25)
      .attr("y", 10)
      .style("font-size", "12px")
      .text("100%");

    // Add ticks
    const ticks = [0, 25, 50, 75, 100];

    ticks.forEach((tick) => {
      const tickAngle = scale(tick);
      const x1 = (radius - 40) * Math.cos(tickAngle);
      const y1 = (radius - 40) * Math.sin(tickAngle);
      const x2 = (radius - 35) * Math.cos(tickAngle);
      const y2 = (radius - 35) * Math.sin(tickAngle);

      svg
        .append("line")
        .attr("x1", x1)
        .attr("y1", y1)
        .attr("x2", x2)
        .attr("y2", y2)
        .style("stroke", "#333")
        .style("stroke-width", 2);
    });
  }, [selectedCategory]);

  // Draw sentiment trend chart
  useEffect(() => {
    if (!trendChartRef.current) return;

    // Clear previous chart
    d3.select(trendChartRef.current).selectAll("*").remove();

    const margin = { top: 30, right: 30, bottom: 50, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3
      .select(trendChartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X scale
    const x = d3
      .scaleBand()
      .domain(sentimentData.trendData.map((d) => d.month))
      .range([0, width])
      .padding(0.1);

    // Y scale
    const y = d3.scaleLinear().domain([0, 100]).nice().range([height, 0]);

    // Color scale
    const color = d3
      .scaleLinear()
      .domain([0, 50, 100])
      .range(["#e74c3c", "#f39c12", "#2ecc71"]);

    // Add X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    // Add Y axis
    svg.append("g").call(
      d3
        .axisLeft(y)
        .ticks(5)
        .tickFormat((d) => `${d}%`)
    );

    // Add Y axis label
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr(
        "transform",
        `translate(${-margin.left / 1.5},${height / 2}) rotate(-90)`
      )
      .text("Sentiment Score");

    // Add the line
    svg
      .append("path")
      .datum(sentimentData.trendData)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2)
      .attr(
        "d",
        d3
          .line()
          .x((d) => x(d.month) + x.bandwidth() / 2)
          .y((d) => y(d.sentiment))
      );

    // Add the points
    svg
      .selectAll(".point")
      .data(sentimentData.trendData)
      .enter()
      .append("circle")
      .attr("class", "point")
      .attr("cx", (d) => x(d.month) + x.bandwidth() / 2)
      .attr("cy", (d) => y(d.sentiment))
      .attr("r", 5)
      .attr("fill", (d) => color(d.sentiment));

    // Add title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Sentiment Trend Over Time");
  }, []);

  // Draw category comparison chart
  useEffect(() => {
    if (!categoryChartRef.current) return;

    // Clear previous chart
    d3.select(categoryChartRef.current).selectAll("*").remove();

    const margin = { top: 30, right: 30, bottom: 50, left: 50 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3
      .select(categoryChartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Format data for stacked bar chart
    const stackData = Object.entries(sentimentData.categoryData).map(
      ([category, data]) => ({
        category,
        positive: data.positive,
        neutral: data.neutral,
        negative: data.negative,
      })
    );

    // X scale
    const x = d3
      .scaleBand()
      .domain(stackData.map((d) => d.category))
      .range([0, width])
      .padding(0.3);

    // Y scale
    const y = d3.scaleLinear().domain([0, 100]).nice().range([height, 0]);

    // Stack generator
    const stack = d3
      .stack()
      .keys(["positive", "neutral", "negative"])
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    const stackedData = stack(stackData);

    // Color scale
    const color = d3
      .scaleOrdinal()
      .domain(["positive", "neutral", "negative"])
      .range(["#2ecc71", "#f39c12", "#e74c3c"]);

    // Add X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    // Add Y axis
    svg.append("g").call(
      d3
        .axisLeft(y)
        .ticks(5)
        .tickFormat((d) => `${d}%`)
    );

    // Add Y axis label
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr(
        "transform",
        `translate(${-margin.left / 1.5},${height / 2}) rotate(-90)`
      )
      .text("Percentage");

    // Add the bars
    svg
      .append("g")
      .selectAll("g")
      .data(stackedData)
      .enter()
      .append("g")
      .attr("fill", (d) => color(d.key))
      .selectAll("rect")
      .data((d) => d)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.data.category))
      .attr("y", (d) => y(d[1]))
      .attr("height", (d) => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth());

    // Add title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Sentiment Distribution by Category");

    // Add legend
    const legend = svg
      .append("g")
      .attr("transform", `translate(${width - 120}, 0)`);

    const legendItems = [
      { key: "positive", label: "Positive" },
      { key: "neutral", label: "Neutral" },
      { key: "negative", label: "Negative" },
    ];

    legendItems.forEach((item, i) => {
      const legendRow = legend
        .append("g")
        .attr("transform", `translate(0, ${i * 20})`);

      legendRow
        .append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", color(item.key));

      legendRow
        .append("text")
        .attr("x", 20)
        .attr("y", 10)
        .text(item.label)
        .style("font-size", "12px");
    });
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Sentiment Analysis</h1>

      {/* Category Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Filter by Category:</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              className={`px-4 py-2 rounded ${
                selectedCategory === category
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Sentiment Gauge */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Overall Sentiment</h2>
          <div ref={gaugeChartRef} className="flex justify-center"></div>
        </div>

        {/* Category Comparison */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Sentiment by Category</h2>
          <div ref={categoryChartRef}></div>
        </div>

        {/* Top Sentiments */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recent Reviews</h2>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {sentimentData.recentReviews.map((review) => (
              <div key={review.id} className="border-b pb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold">{review.product}</span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      review.sentiment === "positive"
                        ? "bg-green-100 text-green-800"
                        : review.sentiment === "neutral"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {review.sentiment}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{review.text}</p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{review.category}</span>
                  <span>{review.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sentiment Trend */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Sentiment Trend</h2>
        <div ref={trendChartRef} className="overflow-x-auto"></div>
      </div>
    </div>
  );
}
