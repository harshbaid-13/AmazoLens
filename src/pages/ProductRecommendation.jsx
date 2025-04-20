import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import axios from "axios";

export default function ProductRecommendation() {
  const networkRef = useRef();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [affinityData, setAffinityData] = useState([]);
  const [similarityData, setSimilarityData] = useState([]);
  const [weightThreshold, setWeightThreshold] = useState(0.1);
  const [loading, setLoading] = useState(false);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/prod-recom/get-category");
        setCategories(response.data);
        if (response.data.length > 0) {
          setSelectedCategory(response.data[0]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch affinity data when category changes
  useEffect(() => {
    if (!selectedCategory) return;

    const fetchAffinityData = async () => {
      setLoading(true);
      try {
        const encodedCategory = encodeURIComponent(selectedCategory);
        const response = await axios.get(
          `http://127.0.0.1:8000/prod-recom/prod-recom/get-data?category=${encodedCategory}`
        );
        setAffinityData(response.data.affinity_data);
        setSimilarityData(response.data.similarity_data);
      } catch (error) {
        console.error("Error fetching affinity data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAffinityData();
  }, [selectedCategory]);

  // Create network graph
  useEffect(() => {
    if (!networkRef.current || !affinityData.length || loading) return;

    // Clear previous chart
    d3.select(networkRef.current).selectAll("*").remove();

    const width = 1000;
    const height = 600;

    // Create SVG with zoom capabilities
    const svg = d3
      .select(networkRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .call(
        d3.zoom()
          .scaleExtent([0.1, 5])
          .on("zoom", (event) => {
            g.attr("transform", event.transform);
          })
      );

    const g = svg.append("g");

    // Create nodes and links from affinity data
    const nodes = [];
    const nodeMap = new Map();
    
    // First pass to collect all unique nodes
    affinityData.forEach((link) => {
      if (!nodeMap.has(link.source)) {
        nodeMap.set(link.source, { id: link.source, name: link.source });
      }
      if (!nodeMap.has(link.target)) {
        nodeMap.set(link.target, { id: link.target, name: link.target });
      }
    });
    
    // Add nodes to array
    nodeMap.forEach((node) => {
      nodes.push(node);
    });

    // Create links array, filtering by weight threshold
    const links = affinityData
      .filter((link) => link.weight >= weightThreshold)
      .map((link) => ({
        source: link.source,
        target: link.target,
        value: link.weight,
      }));

    // Force simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance((d) => 150 - (d.value * 100)) // Closer nodes for higher weights
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40));

    // Define color scale for nodes
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Create arrow markers for links
    svg
      .append("defs")
      .selectAll("marker")
      .data(["end"])
      .enter()
      .append("marker")
      .attr("id", (d) => d)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#999");

    // Add links
    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("class", "link")
      .style("stroke", "#999")
      .style("stroke-width", (d) => Math.max(1, d.value * 10));

    // Add link labels (weight values)
    const linkText = g
      .append("g")
      .selectAll("text")
      .data(links)
      .enter()
      .append("text")
      .attr("font-size", 10)
      .attr("fill", "#666")
      .text((d) => d.value.toFixed(2));

    // Create node groups
    const node = g
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
      .attr("r", 15)
      .style("fill", (d, i) => color(i))
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
      .text((d) => `${d.name}`);

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      linkText
        .attr("x", (d) => (d.source.x + d.target.x) / 2)
        .attr("y", (d) => (d.source.y + d.target.y) / 2);

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
      .attr("transform", `translate(20, 20)`);

    legend
      .append("text")
      .attr("x", 0)
      .attr("y", 0)
      .text("Product Affinity Network")
      .style("font-size", "14px")
      .style("font-weight", "bold");

    legend
      .append("text")
      .attr("x", 0)
      .attr("y", 20)
      .text(`Category: ${selectedCategory}`)
      .style("font-size", "12px");

    legend
      .append("text")
      .attr("x", 0)
      .attr("y", 40)
      .text(`Weight Threshold: ${weightThreshold.toFixed(2)}`)
      .style("font-size", "12px");

  }, [selectedCategory, affinityData, weightThreshold, loading]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Product Affinity Visualization</h1>

      {/* Category Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Select Category:</h3>
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

      {/* Weight Threshold Slider */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">
          Edge Weight Threshold: {weightThreshold.toFixed(2)}
        </h3>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={weightThreshold}
          onChange={(e) => setWeightThreshold(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>0</span>
          <span>0.5</span>
          <span>1</span>
        </div>
      </div>

      {/* Network Graph */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div ref={networkRef} className="h-[600px] border border-gray-200"></div>
          </>
        )}
      </div>

      {/* Similarity Data Table */}
      {similarityData.length > 0 && (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Similarity Scores</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Top Similar Products
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {similarityData.slice(0, 10).map((item, index) => {
                const product = item.index;
                // Filter out self-mapping and low similarity scores
                const similarities = Object.entries(item)
                  .filter(([key, value]) => key !== "index" && key !== product && value > 0.1)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5); // Take top 5 most similar products

                // Only show rows that have at least one similar product
                if (similarities.length === 0) return null;

                return (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {product}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        {similarities.map(([prod, score], i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                            title={`Similarity score: ${score.toFixed(2)}`}
                          >
                            {prod} ({score.toFixed(2)})
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    )}
    </div>
  );
}