import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export default function TopicMining() {
  const wordCloudRef = useRef();
  const topicGraphRef = useRef();
  const topicTrendsRef = useRef();
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Mock product categories
  const categories = ["All", "Electronics", "Clothing", "Books", "Home"];

  // Mock topic data with words and their frequencies
  const topicData = {
    All: [
      {
        topic: "Quality",
        words: [
          { text: "quality", size: 100 },
          { text: "excellent", size: 70 },
          { text: "good", size: 65 },
          { text: "poor", size: 50 },
          { text: "durability", size: 45 },
          { text: "material", size: 40 },
          { text: "solid", size: 35 },
          { text: "cheap", size: 30 },
          { text: "construction", size: 25 },
          { text: "craftsmanship", size: 20 },
        ],
      },
      {
        topic: "Pricing",
        words: [
          { text: "price", size: 95 },
          { text: "value", size: 75 },
          { text: "expensive", size: 60 },
          { text: "affordable", size: 55 },
          { text: "worth", size: 40 },
          { text: "overpriced", size: 35 },
          { text: "bargain", size: 30 },
          { text: "deal", size: 25 },
          { text: "cost", size: 20 },
          { text: "budget", size: 15 },
        ],
      },
      {
        topic: "Customer Service",
        words: [
          { text: "service", size: 90 },
          { text: "helpful", size: 65 },
          { text: "response", size: 60 },
          { text: "return", size: 55 },
          { text: "refund", size: 45 },
          { text: "support", size: 40 },
          { text: "complaint", size: 35 },
          { text: "resolution", size: 30 },
          { text: "delivery", size: 25 },
          { text: "shipping", size: 20 },
        ],
      },
      {
        topic: "User Experience",
        words: [
          { text: "easy", size: 85 },
          { text: "difficult", size: 60 },
          { text: "intuitive", size: 55 },
          { text: "comfortable", size: 50 },
          { text: "convenient", size: 45 },
          { text: "simple", size: 40 },
          { text: "complicated", size: 35 },
          { text: "usability", size: 30 },
          { text: "confusing", size: 25 },
          { text: "straightforward", size: 20 },
        ],
      },
      {
        topic: "Features",
        words: [
          { text: "features", size: 80 },
          { text: "functionality", size: 60 },
          { text: "options", size: 55 },
          { text: "capabilities", size: 45 },
          { text: "versatile", size: 40 },
          { text: "limited", size: 35 },
          { text: "practical", size: 30 },
          { text: "innovative", size: 25 },
          { text: "advanced", size: 20 },
          { text: "basic", size: 15 },
        ],
      },
    ],
    Electronics: [
      {
        topic: "Performance",
        words: [
          { text: "performance", size: 100 },
          { text: "fast", size: 80 },
          { text: "slow", size: 70 },
          { text: "speed", size: 65 },
          { text: "powerful", size: 55 },
          { text: "responsive", size: 45 },
          { text: "laggy", size: 40 },
          { text: "efficient", size: 35 },
          { text: "processing", size: 30 },
          { text: "smooth", size: 25 },
        ],
      },
      {
        topic: "Battery Life",
        words: [
          { text: "battery", size: 95 },
          { text: "life", size: 85 },
          { text: "lasting", size: 65 },
          { text: "charging", size: 60 },
          { text: "drain", size: 55 },
          { text: "power", size: 45 },
          { text: "hours", size: 40 },
          { text: "capacity", size: 35 },
          { text: "recharge", size: 25 },
          { text: "backup", size: 20 },
        ],
      },
      {
        topic: "Display Quality",
        words: [
          { text: "screen", size: 90 },
          { text: "display", size: 85 },
          { text: "resolution", size: 70 },
          { text: "bright", size: 60 },
          { text: "colors", size: 55 },
          { text: "sharp", size: 45 },
          { text: "crisp", size: 40 },
          { text: "clarity", size: 35 },
          { text: "viewing", size: 30 },
          { text: "angle", size: 25 },
        ],
      },
    ],
    Clothing: [
      {
        topic: "Fit",
        words: [
          { text: "fit", size: 100 },
          { text: "size", size: 90 },
          { text: "true", size: 75 },
          { text: "small", size: 70 },
          { text: "large", size: 65 },
          { text: "tight", size: 55 },
          { text: "loose", size: 45 },
          { text: "comfortable", size: 40 },
          { text: "measurements", size: 35 },
          { text: "sizing", size: 30 },
        ],
      },
      {
        topic: "Material",
        words: [
          { text: "material", size: 95 },
          { text: "fabric", size: 85 },
          { text: "cotton", size: 70 },
          { text: "soft", size: 65 },
          { text: "synthetic", size: 55 },
          { text: "quality", size: 50 },
          { text: "breathable", size: 45 },
          { text: "texture", size: 35 },
          { text: "feel", size: 30 },
          { text: "lightweight", size: 25 },
        ],
      },
      {
        topic: "Style",
        words: [
          { text: "style", size: 90 },
          { text: "design", size: 75 },
          { text: "fashionable", size: 65 },
          { text: "trendy", size: 60 },
          { text: "look", size: 55 },
          { text: "outdated", size: 45 },
          { text: "classic", size: 40 },
          { text: "modern", size: 35 },
          { text: "attractive", size: 30 },
          { text: "color", size: 25 },
        ],
      },
    ],
    Books: [
      {
        topic: "Plot",
        words: [
          { text: "story", size: 100 },
          { text: "plot", size: 90 },
          { text: "engaging", size: 75 },
          { text: "boring", size: 65 },
          { text: "predictable", size: 60 },
          { text: "twist", size: 55 },
          { text: "suspense", size: 50 },
          { text: "pace", size: 45 },
          { text: "ending", size: 40 },
          { text: "gripping", size: 35 },
        ],
      },
      {
        topic: "Characters",
        words: [
          { text: "characters", size: 95 },
          { text: "development", size: 75 },
          { text: "protagonist", size: 65 },
          { text: "relatable", size: 60 },
          { text: "depth", size: 55 },
          { text: "believable", size: 45 },
          { text: "compelling", size: 40 },
          { text: "flat", size: 35 },
          { text: "realistic", size: 30 },
          { text: "dynamic", size: 25 },
        ],
      },
      {
        topic: "Writing Style",
        words: [
          { text: "writing", size: 90 },
          { text: "prose", size: 70 },
          { text: "style", size: 65 },
          { text: "descriptive", size: 60 },
          { text: "eloquent", size: 55 },
          { text: "simplistic", size: 45 },
          { text: "dialogue", size: 40 },
          { text: "narrative", size: 35 },
          { text: "pacing", size: 30 },
          { text: "clarity", size: 25 },
        ],
      },
    ],
    Home: [
      {
        topic: "Functionality",
        words: [
          { text: "functional", size: 95 },
          { text: "practical", size: 85 },
          { text: "useful", size: 75 },
          { text: "versatile", size: 65 },
          { text: "purpose", size: 55 },
          { text: "convenient", size: 50 },
          { text: "space", size: 45 },
          { text: "storage", size: 40 },
          { text: "design", size: 35 },
          { text: "decorative", size: 30 },
        ],
      },
      {
        topic: "Assembly",
        words: [
          { text: "assembly", size: 90 },
          { text: "instructions", size: 80 },
          { text: "easy", size: 70 },
          { text: "difficult", size: 65 },
          { text: "parts", size: 55 },
          { text: "tools", size: 45 },
          { text: "time", size: 40 },
          { text: "setup", size: 35 },
          { text: "manual", size: 30 },
          { text: "missing", size: 25 },
        ],
      },
      {
        topic: "Durability",
        words: [
          { text: "durable", size: 95 },
          { text: "sturdy", size: 85 },
          { text: "construction", size: 70 },
          { text: "solid", size: 65 },
          { text: "flimsy", size: 60 },
          { text: "quality", size: 55 },
          { text: "wobbly", size: 45 },
          { text: "material", size: 40 },
          { text: "break", size: 35 },
          { text: "stable", size: 30 },
        ],
      },
    ],
  };

  // Topic trends data
  const topicTrends = [
    {
      topic: "Quality",
      data: [
        { month: "Jan", value: 45 },
        { month: "Feb", value: 48 },
        { month: "Mar", value: 52 },
        { month: "Apr", value: 49 },
        { month: "May", value: 55 },
        { month: "Jun", value: 59 },
        { month: "Jul", value: 62 },
        { month: "Aug", value: 60 },
        { month: "Sep", value: 58 },
        { month: "Oct", value: 63 },
        { month: "Nov", value: 65 },
        { month: "Dec", value: 68 },
      ],
    },
    {
      topic: "Pricing",
      data: [
        { month: "Jan", value: 60 },
        { month: "Feb", value: 58 },
        { month: "Mar", value: 55 },
        { month: "Apr", value: 62 },
        { month: "May", value: 65 },
        { month: "Jun", value: 60 },
        { month: "Jul", value: 58 },
        { month: "Aug", value: 57 },
        { month: "Sep", value: 62 },
        { month: "Oct", value: 65 },
        { month: "Nov", value: 68 },
        { month: "Dec", value: 72 },
      ],
    },
    {
      topic: "Customer Service",
      data: [
        { month: "Jan", value: 40 },
        { month: "Feb", value: 42 },
        { month: "Mar", value: 45 },
        { month: "Apr", value: 48 },
        { month: "May", value: 52 },
        { month: "Jun", value: 55 },
        { month: "Jul", value: 50 },
        { month: "Aug", value: 48 },
        { month: "Sep", value: 52 },
        { month: "Oct", value: 55 },
        { month: "Nov", value: 58 },
        { month: "Dec", value: 60 },
      ],
    },
    {
      topic: "User Experience",
      data: [
        { month: "Jan", value: 55 },
        { month: "Feb", value: 58 },
        { month: "Mar", value: 62 },
        { month: "Apr", value: 59 },
        { month: "May", value: 57 },
        { month: "Jun", value: 60 },
        { month: "Jul", value: 63 },
        { month: "Aug", value: 65 },
        { month: "Sep", value: 68 },
        { month: "Oct", value: 70 },
        { month: "Nov", value: 72 },
        { month: "Dec", value: 75 },
      ],
    },
    {
      topic: "Features",
      data: [
        { month: "Jan", value: 50 },
        { month: "Feb", value: 52 },
        { month: "Mar", value: 55 },
        { month: "Apr", value: 58 },
        { month: "May", value: 60 },
        { month: "Jun", value: 62 },
        { month: "Jul", value: 65 },
        { month: "Aug", value: 68 },
        { month: "Sep", value: 65 },
        { month: "Oct", value: 63 },
        { month: "Nov", value: 67 },
        { month: "Dec", value: 70 },
      ],
    },
  ];

  // Draw word cloud
  useEffect(() => {
    if (!wordCloudRef.current) return;

    // Clear previous chart
    d3.select(wordCloudRef.current).selectAll("*").remove();

    // Get words based on selected category
    const categoryTopics = topicData[selectedCategory] || topicData["All"];

    // Combine all words from all topics for the selected category
    const words = categoryTopics.flatMap((topic) => topic.words);

    const width = 700;
    const height = 400;

    const svg = d3
      .select(wordCloudRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Simple word cloud layout
    // In a real app, you would use d3-cloud or another library
    // Here we'll create a simplified version

    // Scale for font size
    const fontScale = d3
      .scaleSqrt()
      .domain([0, d3.max(words, (d) => d.size)])
      .range([10, 50]);

    // Color scale
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Position words in a circular layout
    const angleStep = (2 * Math.PI) / words.length;

    words.forEach((word, i) => {
      const angle = i * angleStep;
      const radius = Math.random() * (height / 3) + 20;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);

      svg
        .append("text")
        .attr("x", x)
        .attr("y", y)
        .style("font-size", `${fontScale(word.size)}px`)
        .style("fill", colorScale(i % 10))
        .attr("text-anchor", "middle")
        .attr("transform", `rotate(${Math.random() * 30 - 15}, ${x}, ${y})`)
        .text(word.text);
    });

    // Add title
    svg
      .append("text")
      .attr("x", 0)
      .attr("y", -height / 2 + 20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(`Key Words in Reviews: ${selectedCategory}`);
  }, [selectedCategory]);

  // Draw topic graph
  useEffect(() => {
    if (!topicGraphRef.current) return;

    // Clear previous chart
    d3.select(topicGraphRef.current).selectAll("*").remove();

    // Get topics based on selected category
    const categoryTopics = topicData[selectedCategory] || topicData["All"];

    const margin = { top: 30, right: 30, bottom: 70, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3
      .select(topicGraphRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Prepare data
    const graphData = categoryTopics.map((topic) => ({
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
  }, [selectedCategory]);

  // Draw topic trends
  useEffect(() => {
    if (!topicTrendsRef.current) return;

    // Clear previous chart
    d3.select(topicTrendsRef.current).selectAll("*").remove();

    const margin = { top: 30, right: 100, bottom: 50, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3
      .select(topicTrendsRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X scale
    const x = d3
      .scaleBand()
      .domain(topicTrends[0].data.map((d) => d.month))
      .range([0, width])
      .padding(0.1);

    // Y scale
    const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

    // Color scale
    const color = d3
      .scaleOrdinal()
      .domain(topicTrends.map((d) => d.topic))
      .range(d3.schemeCategory10);

    // Add X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    // Add X axis label
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr(
        "transform",
        `translate(${width / 2},${height + margin.bottom - 10})`
      )
      .text("Month");

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
      .text("Mention Frequency");

    // Draw lines
    topicTrends.forEach((topic) => {
      svg
        .append("path")
        .datum(topic.data)
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

      // Add topic name at the end of each line
      const lastPoint = topic.data[topic.data.length - 1];

      svg
        .append("text")
        .attr("x", x(lastPoint.month) + x.bandwidth() / 2 + 10)
        .attr("y", y(lastPoint.value))
        .attr("dy", "0.35em")
        .style("font-size", "12px")
        .style("fill", color(topic.topic))
        .text(topic.topic);
    });

    // Add title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Topic Trends Over Time");
  }, []);

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
          <div ref={wordCloudRef} className="flex justify-center"></div>
        </div>

        {/* Topic Graph */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Topic Distribution</h2>
          <div ref={topicGraphRef}></div>
        </div>
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
            <h3 className="font-semibold text-lg mb-2">Quality</h3>
            <p className="text-gray-700">
              Reviews discussing the overall quality, durability, and
              craftsmanship of products.
            </p>
          </div>

          <div className="border rounded p-4">
            <h3 className="font-semibold text-lg mb-2">Pricing</h3>
            <p className="text-gray-700">
              Comments about product prices, value for money, and affordability.
            </p>
          </div>

          <div className="border rounded p-4">
            <h3 className="font-semibold text-lg mb-2">Customer Service</h3>
            <p className="text-gray-700">
              Feedback regarding customer support, returns, and overall service
              experience.
            </p>
          </div>

          <div className="border rounded p-4">
            <h3 className="font-semibold text-lg mb-2">User Experience</h3>
            <p className="text-gray-700">
              Reviews about ease of use, convenience, and general user
              satisfaction.
            </p>
          </div>

          <div className="border rounded p-4">
            <h3 className="font-semibold text-lg mb-2">Features</h3>
            <p className="text-gray-700">
              Comments on product functionality, features, and capabilities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
