import { useEffect, useRef, useState } from "react";
import axios from "axios";
import cloud from "d3-cloud";
import * as d3 from "d3";
import TSNEPlot from "../components/tsneplot";
export default function TopicMining() {
  const wordCloudRef = useRef();
  const topicGraphRef = useRef();
  const topicTrendsRef = useRef();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState([]);
  const [topicData, setTopicData] = useState({});
  const [topicTrends, setTopicTrends] = useState([]);
  const [tsneData, setTsneData] = useState([]);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          "http://127.0.0.1:8000/topic-sentiment/topics",
          { timeout: 10000 }
        );
        const { categories, topicData, topicTrends } = response.data;
        setCategories(categories);
        setTopicData(topicData);
        setTopicTrends(topicTrends);
        // if (Object.keys(response?.data).length > 0) {
        // setSelectedCategory("categories");

        console.log("topicData", topicData);
        console.log("Keys in topicData", Object.keys(topicData));
        console.log("topicData['All']", topicData["All"]);
        // }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);
  const generateMockTSNEData = () => {
    // Generate 100 random data points for t-SNE (x, y)
    let mockData = [];
    for (let i = 0; i < 100; i++) {
      mockData.push({
        x: Math.random() * 500, // Random x value between 0 and 500
        y: Math.random() * 400, // Random y value between 0 and 400
      });
    }
    setTsneData(mockData);
  };


  // Draw word cloud
  useEffect(() => {
    generateMockTSNEData();
    if (!wordCloudRef.current) return;
    if (Object.keys(topicData).length === 0) return;
    

    // Clear previous chart
    d3.select(wordCloudRef.current).selectAll("*").remove();

    // Get words based on selected category
    const categoryTopics =
      topicData[selectedCategory] || topicData["All"] || [];

    // Combine all words from all topics for the selected category
    const words = categoryTopics?.flatMap((topic) => topic.words);

    const width = 500;
    const height = 400;

    // Prepare data for d3-cloud
    const wordEntries = words.map((word) => ({
      text: word.text,
      size: word.size,
    }));

    // Configure the layout
    cloud()
      .size([width, height])
      .words(wordEntries)
      .padding(0)
      .rotate(() => [0, 90, -45, 45][Math.floor(Math.random() * 4)])
      .font("Impact")
      .fontSize((d) =>
        d3
          .scaleSqrt()
          .domain([0, d3.max(words, (d) => d.size)])
          .range([10, 50])(d.size)
      )
      .on("end", draw)
      .start();

    function draw(words) {
      const svg = d3
        .select(wordCloudRef.current)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

      const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

      svg
        .selectAll("text")
        .data(words)
        .enter()
        .append("text")
        .style("font-size", (d) => `${d.size}px`)
        .style("fill", (d, i) => colorScale(i % 10))
        .attr("text-anchor", "middle")
        .attr("transform", (d) => `translate(${d.x},${d.y})rotate(${d.rotate})`)
        .text((d) => d.text);
    }
  }, [topicData, selectedCategory]);

  // Draw topic graph
  useEffect(() => {
    if (!topicGraphRef.current) return;
    if (Object.keys(topicData).length === 0) return;

    // Clear previous chart
    d3.select(topicGraphRef.current).selectAll("*").remove();

    // Get topics based on selected category
    const categoryTopics =
      topicData[selectedCategory] || topicData["All"] || [];

    const margin = { top: 30, right: 30, bottom: 100, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3
      .select(topicGraphRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Prepare data
    const graphData = categoryTopics?.map((topic) => ({
      name: topic.topic,
      value: d3.sum(topic.words, (d) => d.size), // Sum of word sizes as topic importance
    }));

    // Sort by value
    graphData.sort((a, b) => b.value - a.value);

    // X scale
    const x = d3
      .scaleBand()
      .domain(graphData.map((d) => d.name))
      .range([0, width])
      .padding(0.1);

    // Y scale
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(graphData, (d) => d.value)])
      .nice()
      .range([height, 0]);

    // Color scale
    const color = d3
      .scaleOrdinal()
      .domain(graphData.map((d) => d.name))
      .range(d3.schemeCategory10);

    // Add X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");

    // Add Y axis
    svg.append("g").call(d3.axisLeft(y).ticks(5));

    // Add Y axis label
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr(
        "transform",
        `translate(${-margin.left / 1.5},${height / 2}) rotate(-90)`
      )
      .text("Mention Frequency");

    // Add bars
    svg
      .selectAll(".bar")
      .data(graphData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.name))
      .attr("width", x.bandwidth())
      .attr("y", (d) => y(d.value))
      .attr("height", (d) => height - y(d.value))
      .attr("fill", (d) => color(d.name));

    // Add title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(`Topic Distribution: ${selectedCategory}`);
  }, [topicData, selectedCategory]);

  // Draw topic trends (log scale + legend)
  useEffect(() => {
    if (!topicTrendsRef.current) return;

    d3.select(topicTrendsRef.current).selectAll("*").remove();

    const margin = { top: 30, right: 160, bottom: 50, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3
      .select(topicTrendsRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const months = topicTrends?.[0]?.data?.map((d) => d.month) || [];

    const x = d3.scaleBand().domain(months).range([0, width]).padding(0.1);

    // Prepare all Y values, replacing 0 with 1 for log scale
    const allYValues = topicTrends.flatMap((topic) =>
      topic.data.map((d) => (d.value > 0 ? d.value : 1))
    );
    const yMin = Math.max(1, d3.min(allYValues));
    const yMax = d3.max(allYValues);

    const y = d3.scaleLog().domain([yMin, yMax]).range([height, 0]).nice();

    const color = d3
      .scaleOrdinal()
      .domain(topicTrends.map((d) => d.topic))
      .range(d3.schemeCategory10);

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr(
        "transform",
        `translate(${width / 2},${height + margin.bottom - 10})`
      )
      .text("Month");

    svg.append("g").call(d3.axisLeft(y).ticks(5, "~s"));

    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr(
        "transform",
        `translate(${-margin.left / 1.5},${height / 2}) rotate(-90)`
      )
      .text("Mention Frequency (log scale)");

    // Draw lines
    topicTrends.forEach((topic) => {
      svg
        .append("path")
        .datum(
          topic.data.map((d) => ({
            ...d,
            value: d.value > 0 ? d.value : 1, // ensure no zero for log scale
          }))
        )
        .attr("fill", "none")
        .attr("stroke", color(topic.topic))
        .attr("stroke-width", 2)
        .attr(
          "d",
          d3
            .line()
            .x((d) => x(d.month) + x.bandwidth() / 2)
            .y((d) => y(d.value))
        );
    });

    // Add legend box (right side)
    const legend = svg
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width + 30}, 20)`);

    topicTrends.forEach((topic, i) => {
      const legendRow = legend
        .append("g")
        .attr("transform", `translate(0, ${i * 24})`);

      legendRow
        .append("rect")
        .attr("width", 18)
        .attr("height", 6)
        .attr("y", -5)
        .attr("fill", color(topic.topic));

      legendRow
        .append("text")
        .attr("x", 26)
        .attr("y", 0)
        .attr("dy", "0.32em")
        .style("font-size", "14px")
        .text(topic.topic);
    });

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Topic Trends Over Time");
  }, [topicTrends]);
  //
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Topic Mining</h1>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Word Cloud */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Common Words in Reviews</h2>
          <div
            ref={wordCloudRef}
            className="flex justify-center"
            style={{ width: "100%", minHeight: 400, height: 400 }}
          ></div>
        </div>

        {/* Topic Graph */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Topic Distribution</h2>
          <div ref={topicGraphRef}></div>
        </div>
      </div>

      <div style={{ width: "100%", minHeight: 600 }}>
        <iframe
          src="/count_lda_approach.html"
          title="LDA Visualization"
          width="100%"
          height={900}
          style={{ border: "none" }}
        />
      </div>
      {/* t-SNE Plot */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">t-SNE Visualization of Reviews</h2>
        <TSNEPlot selectedCategory={selectedCategory}  />
      </div>

      {/* Topic Trends */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Topic Trends Over Time</h2>
        <div ref={topicTrendsRef} className="overflow-x-auto"></div>
      </div>

      {/* Topic Explanations */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-xl font-bold mb-4">Topic Definitions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border rounded p-4">
            <h3 className="font-semibold text-lg mb-2">Average Review</h3>
            <p className="text-gray-700">
              General reviews that provide an overall assessment or summary of
              the product without focusing on specific features or issues.
            </p>
          </div>

          <div className="border rounded p-4">
            <h3 className="font-semibold text-lg mb-2">Battery Related</h3>
            <p className="text-gray-700">
              Comments discussing battery performance, battery life, charging
              speed, and issues or satisfaction with battery usage.
            </p>
          </div>

          <div className="border rounded p-4">
            <h3 className="font-semibold text-lg mb-2">Boat Related</h3>
            <p className="text-gray-700">
              Reviews about Boat (earphone brand) product or Boat accessories,
              including quality, usability, and experiences with sound quality.
            </p>
          </div>

          <div className="border rounded p-4">
            <h3 className="font-semibold text-lg mb-2">
              Computer Accessories Related
            </h3>
            <p className="text-gray-700">
              Feedback on computer peripherals and accessories such as
              keyboards, mice, cables, and other related hardware.
            </p>
          </div>

          <div className="border rounded p-4">
            <h3 className="font-semibold text-lg mb-2">
              Electronics-Charging Related
            </h3>
            <p className="text-gray-700">
              Reviews focused on electronic devices' charging capabilities,
              charging speed, compatibility, and charging accessories.
            </p>
          </div>

          <div className="border rounded p-4">
            <h3 className="font-semibold text-lg mb-2">General Review</h3>
            <p className="text-gray-700">
              Broad comments that cover multiple aspects of the product,
              offering overall impressions and satisfaction levels.
            </p>
          </div>

          <div className="border rounded p-4">
            <h3 className="font-semibold text-lg mb-2">Good Review</h3>
            <p className="text-gray-700">
              Positive reviews highlighting satisfaction, high quality, or
              favorable experiences with the product.
            </p>
          </div>

          <div className="border rounded p-4">
            <h3 className="font-semibold text-lg mb-2">Lighting Related</h3>
            <p className="text-gray-700">
              Feedback about lighting products, brightness, energy efficiency,
              installation, and user experience with lighting solutions.
            </p>
          </div>

          <div className="border rounded p-4">
            <h3 className="font-semibold text-lg mb-2">
              Product Quality Related
            </h3>
            <p className="text-gray-700">
              Reviews discussing the build quality, durability, reliability, and
              craftsmanship of the product.
            </p>
          </div>

          <div className="border rounded p-4">
            <h3 className="font-semibold text-lg mb-2">
              Smart Devices Related
            </h3>
            <p className="text-gray-700">
              Comments on smart devices such as smart home products, wearables,
              and IoT devices, including features, compatibility, and usability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
