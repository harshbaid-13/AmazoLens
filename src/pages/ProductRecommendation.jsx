import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export default function ProductRecommendation() {
  const networkRef = useRef();
  const barChartRef = useRef();
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Mock product data
  const products = [
    {
      id: 1,
      name: "Laptop Pro",
      category: "Electronics",
      sales: 3200,
      affinity: ["Mouse", "Laptop Stand", "Backpack"],
    },
    {
      id: 2,
      name: "Smartphone X",
      category: "Electronics",
      sales: 5400,
      affinity: ["Phone Case", "Screen Protector", "Wireless Earbuds"],
    },
    {
      id: 3,
      name: "Wireless Earbuds",
      category: "Electronics",
      sales: 4100,
      affinity: ["Smartphone X", "Charging Case"],
    },
    {
      id: 4,
      name: "4K Smart TV",
      category: "Electronics",
      sales: 2700,
      affinity: ["HDMI Cable", "Streaming Device", "Wall Mount"],
    },
    {
      id: 5,
      name: "Digital Camera",
      category: "Electronics",
      sales: 1800,
      affinity: ["Camera Lens", "Memory Card", "Camera Bag"],
    },
    {
      id: 6,
      name: "Cotton T-Shirt",
      category: "Clothing",
      sales: 6200,
      affinity: ["Jeans", "Hoodie"],
    },
    {
      id: 7,
      name: "Jeans",
      category: "Clothing",
      sales: 4800,
      affinity: ["Cotton T-Shirt", "Belt"],
    },
    {
      id: 8,
      name: "Running Shoes",
      category: "Clothing",
      sales: 3600,
      affinity: ["Sports Socks", "Fitness Tracker"],
    },
    {
      id: 9,
      name: "Mystery Novel",
      category: "Books",
      sales: 2900,
      affinity: ["Thriller Novel", "Book Light"],
    },
    {
      id: 10,
      name: "Cookbook",
      category: "Books",
      sales: 2200,
      affinity: ["Kitchen Utensils", "Food Processor"],
    },
    {
      id: 11,
      name: "Coffee Table",
      category: "Home",
      sales: 1500,
      affinity: ["Area Rug", "Throw Pillows"],
    },
    {
      id: 12,
      name: "Bedding Set",
      category: "Home",
      sales: 3800,
      affinity: ["Pillows", "Bed Frame"],
    },
  ];

  // Product categories
  const categories = [
    "All",
    ...new Set(products.map((product) => product.category)),
  ];

  // Create network graph
  useEffect(() => {
    if (!networkRef.current) return;

    // Clear previous chart
    d3.select(networkRef.current).selectAll("*").remove();

    const width = 800;
    const height = 600;

    const svg = d3
      .select(networkRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Filter products by selected category
    const filteredProducts =
      selectedCategory === "All"
        ? products
        : products.filter((p) => p.category === selectedCategory);

    // Create nodes array
    const nodes = [...filteredProducts];

    // Create links array
    const links = [];
    filteredProducts.forEach((product) => {
      product.affinity.forEach((affItem) => {
        // Find the target product
        const targetProduct = filteredProducts.find((p) => p.name === affItem);
        if (targetProduct) {
          links.push({
            source: product.id,
            target: targetProduct.id,
            value: 1,
          });
        }
      });
    });

    // Force simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(0, 0))
      .force("collision", d3.forceCollide().radius(50));

    // Define color scale
    const color = d3
      .scaleOrdinal()
      .domain(categories.filter((c) => c !== "All"))
      .range(d3.schemeCategory10);

    // Add links
    const link = svg
      .append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .style("stroke", "#999")
      .style("stroke-width", 1);

    // Create node groups
    const node = svg
      .append("g")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

    // Add circles for nodes
    node
      .append("circle")
      .attr("r", (d) => Math.sqrt(d.sales) / 5 + 10)
      .style("fill", (d) => color(d.category))
      .style("stroke", "#fff")
      .style("stroke-width", 1.5);

    // Add labels to nodes
    node
      .append("text")
      .text((d) => d.name)
      .attr("text-anchor", "middle")
      .attr("dy", 4)
      .style("font-size", "10px")
      .style("pointer-events", "none");

    // Add title for tooltip
    node
      .append("title")
      .text((d) => `${d.name}\nCategory: ${d.category}\nSales: ${d.sales}`);

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Add legend
    const legend = svg
      .append("g")
      .attr("transform", `translate(${width / 2 - 120}, ${-height / 2 + 30})`);

    categories
      .filter((c) => c !== "All")
      .forEach((category, i) => {
        const legendRow = legend
          .append("g")
          .attr("transform", `translate(0, ${i * 20})`);

        legendRow
          .append("rect")
          .attr("width", 10)
          .attr("height", 10)
          .attr("fill", color(category));

        legendRow
          .append("text")
          .attr("x", 20)
          .attr("y", 10)
          .text(category)
          .style("font-size", "12px");
      });
  }, [selectedCategory]);

  // Create bar chart for top products by sales
  useEffect(() => {
    if (!barChartRef.current) return;

    // Clear previous chart
    d3.select(barChartRef.current).selectAll("*").remove();

    const margin = { top: 30, right: 30, bottom: 70, left: 120 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Filter products by selected category
    const filteredProducts =
      selectedCategory === "All"
        ? products
        : products.filter((p) => p.category === selectedCategory);

    // Sort products by sales
    const sortedProducts = [...filteredProducts]
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);

    const svg = d3
      .select(barChartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales
    const x = d3
      .scaleLinear()
      .domain([0, d3.max(sortedProducts, (d) => d.sales)])
      .range([0, width]);

    const y = d3
      .scaleBand()
      .domain(sortedProducts.map((d) => d.name))
      .range([0, height])
      .padding(0.2);

    // Create color scale
    const color = d3
      .scaleOrdinal()
      .domain(categories.filter((c) => c !== "All"))
      .range(d3.schemeCategory10);

    // Add Y axis
    svg.append("g").call(d3.axisLeft(y));

    // Add X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5));

    // Add X axis label
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 10)
      .text("Sales Volume");

    // Add bars
    svg
      .selectAll(".bar")
      .data(sortedProducts)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", (d) => y(d.name))
      .attr("height", y.bandwidth())
      .attr("x", 0)
      .attr("width", (d) => x(d.sales))
      .attr("fill", (d) => color(d.category));

    // Add title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(
        `Top Products${
          selectedCategory !== "All" ? ` in ${selectedCategory}` : ""
        }`
      );
  }, [selectedCategory]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Product Recommendation</h1>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Graph */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6 overflow-x-auto">
          <h2 className="text-xl font-bold mb-4">Product Affinity Network</h2>
          <p className="mb-4">
            This graph shows product relationships based on co-purchasing
            patterns. Connected products are frequently bought together.
          </p>
          <div ref={networkRef} className="h-[600px]"></div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Top Products by Sales</h2>
          <div ref={barChartRef}></div>
        </div>
      </div>
    </div>
  );
}
