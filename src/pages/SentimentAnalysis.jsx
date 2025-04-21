import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import axios from "axios";

export default function SentimentAnalysis() {
  const gaugeChartRef = useRef();
  const trendChartRef = useRef();
  const categoryChartRef = useRef();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [overallSentiment, setOverallSentiment] = useState(0);
  const [trendData, setTrendData] = useState([]);
  const [categoryData, setCategoryData] = useState({});
  const [recentReviews, setRecentReviews] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, overallRes, trendRes, categoryRes, reviewsRes] =
          await Promise.all([
            axios.get("http://127.0.0.1:8000/sentiment/get-categories"),
            axios.get("http://127.0.0.1:8000/sentiment/overall"),
            // axios.get("http://127.0.0.1:8000/sentiment/trend"),
            // axios.get("http://127.0.0.1:8000/sentiment/by-category"),
            // axios.get("http://127.0.0.1:8000/sentiment/reviews"),
          ]);

        setCategories(["All", ...catRes.data]);
        setOverallSentiment(Math.round(overallRes.data.sentiment * 100));
        setTrendData(trendRes.data);
        setCategoryData(categoryRes.data);
        setRecentReviews(reviewsRes.data);
      } catch (error) {
        console.error("Error fetching sentiment data:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!gaugeChartRef.current) return;
    d3.select(gaugeChartRef.current).selectAll("*").remove();

    const width = 300,
      height = 300;
    const radius = Math.min(width, height) / 2;

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

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Sentiment Analysis</h1>

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
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Overall Sentiment</h2>
          <div ref={gaugeChartRef} className="flex justify-center"></div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Sentiment by Category</h2>
          <div ref={categoryChartRef}></div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recent Reviews</h2>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {recentReviews.map((review, idx) => (
              <div key={idx} className="border-b pb-3">
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

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Sentiment Trend</h2>
        <div ref={trendChartRef} className="overflow-x-auto"></div>
      </div>
    </div>
  );
}
