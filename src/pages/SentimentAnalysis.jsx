import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import axios from "axios";
import Papa from "papaparse";

export default function SentimentAnalysis() {
  const gaugeChartRef = useRef();
  const trendChartRef = useRef();
  const categoryChartRef = useRef();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [overallSentiment, setOverallSentiment] = useState(0);
  const [trendData, setTrendData] = useState([]);
  const [categoryData, setCategoryData] = useState({});
  const [allReviews, setAllReviews] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);

  useEffect(() => {
    Papa.parse("/static_reviews_for_display_pos_neg_avg.csv", {
      header: true,
      download: true,
      complete: (result) => {
        setAllReviews(result.data);
      },
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await axios.get(
          "http://127.0.0.1:8000/sentiment/get-categories"
        );
        setCategories(["All", ...catRes.data]);

        const overallRes = await axios.get(
          "http://127.0.0.1:8000/sentiment/overall"
        );
        const score = Math.round(overallRes?.data?.sentiment * 100);
        setOverallSentiment(score);

        const trendRes = await axios.get(
          "http://127.0.0.1:8000/sentiment/trend",
          {
            params:
              selectedCategory === "All" ? {} : { category: selectedCategory },
          }
        );
        const trendProcessed = trendRes.data.map((item) => ({
          week: item.week,
          sentiment: +item.sentiment,
        }));
        setTrendData(trendProcessed);

        const categoryRes = await axios.get(
          "http://127.0.0.1:8000/sentiment/by-category"
        );
        setCategoryData(categoryRes.data);
      } catch (error) {
        console.error("Error fetching sentiment data:", error);
      }
    };
    fetchData();
  }, [selectedCategory]);

  useEffect(() => {
    const filtered =
      selectedCategory === "All"
        ? allReviews.slice(0, 4)
        : allReviews
            .filter((r) => r.split_2_category === selectedCategory)
            .slice(0, 4);
    setRecentReviews(filtered);
  }, [selectedCategory, allReviews]);

  useEffect(() => {
    if (!gaugeChartRef.current) return;
    d3.select(gaugeChartRef.current).selectAll("*").remove();
    const width = 300,
      height = 300,
      radius = Math.min(width, height) / 2;
    const svg = d3
      .select(gaugeChartRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);
    const sentimentValue =
      selectedCategory === "All"
        ? overallSentiment
        : categoryData[selectedCategory]?.positive || 0;
    const scale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([-Math.PI / 2, Math.PI / 2]);
    const arcColor = d3
      .scaleLinear()
      .domain([0, 50, 100])
      .range(["#e74c3c", "#f39c12", "#2ecc71"]);
    const backgroundArc = d3
      .arc()
      .innerRadius(radius - 40)
      .outerRadius(radius - 10)
      .startAngle(-Math.PI / 2)
      .endAngle(Math.PI / 2);
    const valueArc = d3
      .arc()
      .innerRadius(radius - 40)
      .outerRadius(radius - 10)
      .startAngle(-Math.PI / 2)
      .endAngle(scale(sentimentValue));
    svg.append("path").attr("d", backgroundArc).style("fill", "#e6e6e6");
    svg
      .append("path")
      .attr("d", valueArc)
      .style("fill", arcColor(sentimentValue));
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.5em")
      .style("font-size", "36px")
      .text(`${sentimentValue}%`);
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "3em")
      .style("font-size", "14px")
      .text("Positive Sentiment");
  }, [selectedCategory, overallSentiment, categoryData]);

  useEffect(() => {
    if (!categoryChartRef.current || Object.keys(categoryData).length === 0)
      return;
    d3.select(categoryChartRef.current).selectAll("*").remove();
    let current;
    if (selectedCategory === "All") {
      let total = { positive: 0, neutral: 0, negative: 0 };
      const n = Object.keys(categoryData).length;
      for (const values of Object.values(categoryData)) {
        total.positive += values.positive;
        total.neutral += values.neutral;
        total.negative += values.negative;
      }
      current = {
        category: "All",
        positive: +(total.positive / n).toFixed(1),
        neutral: +(total.neutral / n).toFixed(1),
        negative: +(total.negative / n).toFixed(1),
      };
    } else {
      current = {
        category: selectedCategory,
        ...categoryData[selectedCategory],
      };
    }
    const keys = ["positive", "neutral", "negative"];
    const color = d3
      .scaleOrdinal()
      .domain(keys)
      .range(["#2ecc71", "#f1c40f", "#e74c3c"]);
    const containerWidth = Math.max(
      categoryChartRef.current.clientWidth || 500,
      400
    );
    const margin = { top: 20, right: 30, bottom: 60, left: 50 };
    const width = containerWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    const svg = d3
      .select(categoryChartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    const x = d3.scaleBand().domain(keys).range([0, width]).padding(0.4);
    const y = d3.scaleLinear().domain([0, 100]).nice().range([height, 0]);
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));
    svg.append("g").call(d3.axisLeft(y));
    svg
      .selectAll("bars")
      .data(keys)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d))
      .attr("y", (d) => y(current[d]))
      .attr("width", x.bandwidth())
      .attr("height", (d) => height - y(current[d]))
      .attr("fill", (d) => color(d));
    svg
      .selectAll("text.bar")
      .data(keys)
      .enter()
      .append("text")
      .attr("class", "bar")
      .attr("x", (d) => x(d) + x.bandwidth() / 2)
      .attr("y", (d) => y(current[d]) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text((d) => `${current[d]}%`);
  }, [selectedCategory, categoryData]);

  useEffect(() => {
    if (!trendChartRef.current || trendData.length === 0) return;
    d3.select(trendChartRef.current).selectAll("*").remove();
    const margin = { top: 20, right: 30, bottom: 50, left: 50 };
    const containerWidth = trendChartRef.current.clientWidth || 600;
    const width = containerWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    const svg = d3
      .select(trendChartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    const x = d3
      .scalePoint()
      .domain(trendData.map((d) => d.week))
      .range([0, width])
      .padding(0.5);
    const y = d3.scaleLinear().domain([0.4, 0.91]).range([height, 0]);
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat((d) => (d ? d.slice(5) : "")))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");
    svg.append("g").call(d3.axisLeft(y));
    const line = d3
      .line()
      .x((d) => x(d.week))
      .y((d) => y(d.sentiment))
      .curve(d3.curveMonotoneX);
    svg
      .append("path")
      .datum(trendData)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2)
      .attr("d", line);
    svg
      .selectAll("circle")
      .data(trendData)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.week))
      .attr("cy", (d) => y(d.sentiment))
      .attr("r", 4)
      .attr("fill", "#3b82f6");
  }, [trendData]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Sentiment Analysis</h1>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Filter by Category:</h3>
        <div className="flex flex-wrap gap-2">
          {categories?.map((category) => (
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Overall Sentiment</h2>
          <div ref={gaugeChartRef} className="flex justify-center"></div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 overflow-hidden">
          <h2 className="text-xl font-bold mb-4">Sentiment by Category</h2>
          <div
            ref={categoryChartRef}
            className="w-full overflow-x-auto"
            style={{
              maxWidth: "100%",
              minHeight: "250px",
              paddingRight: "12px",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Recent Reviews</h2>
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {recentReviews?.map((review, idx) => (
            <div key={idx} className="border-b pb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold">{review.review_title}</span>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    review.updated_sentiment === "pos"
                      ? "bg-green-100 text-green-800"
                      : review.updated_sentiment === "avg"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {review.updated_sentiment}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                {review.product_name}
              </p>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{review.split_2_category}</span>
                <span>{review.date_of_review}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Sentiment Trend</h2>
        <div ref={trendChartRef} className="overflow-x-auto"></div>
      </div>
    </div>
  );
}
