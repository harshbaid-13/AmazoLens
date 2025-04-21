import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Plot from "react-plotly.js";
import { tree } from "d3-hierarchy";

export default function MarketBasketAnalysis() {
  const frequentItemsetsRef = useRef();
  const networkGraphRef = useRef();
  const fpTreeRef = useRef();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [associationRules, setAssociationRules] = useState([]);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  const [isLoading, setIsLoading] = useState(false);
  const [numBars, setNumBars] = useState(5);
  const [frequentItemsetsData, setFrequentItemsetsData] = useState([]);
  const [strongestAssociation, setStrongestAssociation] = useState({
    antecedent: "",
    consequent: "",
    confidence: 0
  });

  const [heatmapData, setHeatmapData] = useState({
    products: [],
    values: []
  });
  const [sankeyData, setSankeyData] = useState({
    nodes: [],
    links: []
  });
  const [containerSize, setContainerSize] = useState({ width: 1000, height: 800 });





  const [fpTreeData, setFpTreeData] = useState(null);

  useEffect(() => {
    if (!selectedCategory) return;
    const fetchFpTreeData = async () => {
      try {
        const encodedCategory = encodeURIComponent(selectedCategory);
        const response = await fetch(
          `http://127.0.0.1:8000/market-basket/get-fp-Data?category=${encodedCategory}`
        );
        const data = await response.json();
        setFpTreeData(data);
      } catch (error) {
        console.error("Error fetching FP-Tree data:", error);
        // Optionally set fallback/mock data here
        setFpTreeData(null);
      }
    };
    fetchFpTreeData();
  }, [selectedCategory]);

  // Fetch categories on component mount
  useEffect(() => {
  const fetchCategories = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/market-basket/get-category");
      const data = await response.json();
      setCategories(data);
      if (data.length > 0) {
        setSelectedCategory(data[0]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Fallback to mock categories if API fails
      setCategories([
        "Instant & Frozen Food",
        "Chicken, Meat & Fish",
        "Dairy & Breakfast",
        "Dry Fruits, Masala & Oil",
        "Specials",
        "Sauces & Spreads",
        "Cleaning Essentials",
        "Baby Care",
        "Bakery & Biscuits",
        "Sweet Tooth",
        "Home & Office",
        "Munchies",
        "Cold Drinks & Juices",
        "Pharma & Wellness",
        "Tea, Coffee & Health Drinks",
        "Vegetables & Fruits",
        "Paan Corner",
        "Personal Care",
        "Organic & Premium",
        "Atta, Rice & Dal",
        "Pet Care"
      ]);
    }
  };

  fetchCategories();
  }, []);

  // Update container size on window resize
  useEffect(() => {
  const updateSize = () => {
    const container = document.getElementById('heatmap-container');
    if (container) {
      setContainerSize({
        width: container.offsetWidth,
        height: Math.min(container.offsetWidth * 0.8, 800)
      });
    }
  };

  updateSize();
  window.addEventListener('resize', updateSize);
  return () => window.removeEventListener('resize', updateSize);
  }, []);

  //Fetch heatmap data when category changes
  useEffect(() => {
  if (!selectedCategory) return;

  const fetchHeatmapData = async () => {
    try {
      const encodedCategory = encodeURIComponent(selectedCategory);
      const response = await fetch(
        `http://127.0.0.1:8000/market-basket/get-heatmap?category=${encodedCategory}`
      );
      const data = await response.json();
      setHeatmapData(data);
    } catch (error) {
      console.error("Error fetching heatmap data:", error);
      // Fallback to mock data if API fails
      setHeatmapData({
        products: ["Smartphone", "Phone Case", "Laptop", "Laptop Bag", "Headphones"],
        values: [
          [0, 850, 120, 50, 600],
          [850, 0, 30, 20, 450],
          [120, 30, 0, 720, 80],
          [50, 20, 720, 0, 60],
          [600, 450, 80, 60, 0],
        ],
      });
    }
  };

  fetchHeatmapData();
  }, [selectedCategory]);
  // Fetch Sankey data when category changes
  useEffect(() => {
  if (!selectedCategory) return;

  const fetchSankeyData = async () => {
    try {
      const encodedCategory = encodeURIComponent(selectedCategory);
      const response = await fetch(
        `http://127.0.0.1:8000/market-basket/get-sankey-Data?category=${encodedCategory}`
      );
      const data = await response.json();
      setSankeyData(data);
    } catch (error) {
      console.error("Error fetching Sankey data:", error);
      // Fallback to mock data if API fails
      setSankeyData({
        nodes: [
          { name: "Smartphone" },
          { name: "Phone Case" },
          { name: "Laptop" },
          { name: "Laptop Bag" },
          { name: "Headphones" },
          { name: "Earphone Case" },
        ],
        links: [
          { source: 0, target: 1, value: 850 },
          { source: 2, target: 3, value: 720 },
          { source: 4, target: 0, value: 600 },
          { source: 4, target: 1, value: 450 },
          { source: 4, target: 5, value: 380 },
        ],
      });
    }
  };

  fetchSankeyData();
  }, [selectedCategory]);

  useEffect(() => {
  if (!selectedCategory) return;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const encodedCategory = encodeURIComponent(selectedCategory);
      
      // First fetch frequent itemsets
      let frequentItemsetsResponse;
      try {
        frequentItemsetsResponse = await fetch(
          `http://127.0.0.1:8000/market-basket/frequent-itemsets?category=${encodedCategory}`
        );
        if (!frequentItemsetsResponse.ok) {
          throw new Error(`Frequent itemsets API returned ${frequentItemsetsResponse.status}`);
        }
        const frequentItemsetsData = await frequentItemsetsResponse.json();
        setFrequentItemsetsData(frequentItemsetsData);
      } catch (frequentItemsetsError) {
        console.error("Error fetching frequent itemsets:", frequentItemsetsError);
        // Fallback to mock data
        setFrequentItemsetsData([
          { items: ["Smartphone", "Phone Case"], support: 0.85, support_count: 850 },
          { items: ["Laptop", "Laptop Bag"], support: 0.72, support_count: 720 },
          // ... other mock data
        ]);
      }

      // Then fetch association rules
      let associationRulesResponse;
      try {
        associationRulesResponse = await fetch(
          `http://127.0.0.1:8000/market-basket/get-product-association-rules?category=${encodedCategory}`
        );
        if (!associationRulesResponse.ok) {
          throw new Error(`Association rules API returned ${associationRulesResponse.status}`);
        }
        const associationRulesData = await associationRulesResponse.json();
        setAssociationRules(associationRulesData);
        
        // Find the rule with highest confidence
        if (associationRulesData.length > 0) {
          const strongest = associationRulesData.reduce((max, rule) => 
            rule.confidence > max.confidence ? rule : max, 
            {confidence: 0}
          );
          setStrongestAssociation({
            antecedent: strongest.antecedent.join(", "),
            consequent: strongest.consequent.join(", "),
            confidence: strongest.confidence
          });
        } else {
          setStrongestAssociation({
            antecedent: "No data",
            consequent: "",
            confidence: 0
          });
        }
      } catch (associationRulesError) {
        console.error("Error fetching association rules:", associationRulesError);
        // Fallback to mock data
        const mockRules = [
          { antecedent: ["Smartphone"], consequent: ["Phone Case"], confidence: 0.85 },
          { antecedent: ["Laptop"], consequent: ["Laptop Bag"], confidence: 0.78 },
          // ... other mock data
        ];
        setAssociationRules(mockRules);
        
        const strongest = mockRules.reduce((max, rule) => 
          rule.confidence > max.confidence ? rule : max, 
          {confidence: 0}
        );
        setStrongestAssociation({
          antecedent: strongest.antecedent.join(", "),
          consequent: strongest.consequent.join(", "),
          confidence: strongest.confidence
        });
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
  }, [selectedCategory]);

  // Create frequent itemsets bar chart
  useEffect(() => {
  if (!frequentItemsetsRef.current || frequentItemsetsData.length === 0) return;

  // Clear previous chart
  d3.select(frequentItemsetsRef.current).selectAll("*").remove();

  const margin = { top: 30, right: 80, bottom: 70, left: 180 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3
    .select(frequentItemsetsRef.current)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Sort by support and limit to numBars
  const sortedData = [...frequentItemsetsData]
    .sort((a, b) => b.support - a.support)
    .slice(0, numBars);

  // Create scales
  const x = d3
    .scaleLinear()
    .domain([0, d3.max(sortedData, (d) => d.support)])
    .range([0, width]);

  const y = d3
    .scaleBand()
    .domain(sortedData.map((d) => d.items.join(" + ")))
    .range([0, height])
    .padding(0.2);

  // Add Y axis
  svg.append("g").call(d3.axisLeft(y));

  // Add X axis
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format(".0%"))); // Format as percentage

  // Add bars
  svg
    .selectAll(".bar")
    .data(sortedData)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("y", (d) => y(d.items.join(" + ")))
    .attr("x", 0)
    .attr("height", y.bandwidth())
    .attr("width", (d) => x(d.support))
    .attr("fill", "#4e79a7");

  // Add bar labels
  svg
    .selectAll(".label")
    .data(sortedData)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("y", (d) => y(d.items.join(" + ")) + y.bandwidth() / 2)
    .attr("x", (d) => x(d.support) + 5)
    .attr("dy", ".35em")
    .text((d) => `${(d.support * 100).toFixed(1)}%`);

  // Add title
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Frequently Bought Together");
  }, [frequentItemsetsData, numBars]);

  // Create network graph
  useEffect(() => {
  if (!networkGraphRef.current) return;

  // Clear previous chart
  d3.select(networkGraphRef.current).selectAll("*").remove();

  const width = 1000;
  const height = 500;

  // Check if associationRules is empty
  if (associationRules.length === 0) {
    // Display message when no rules are available
    d3.select(networkGraphRef.current)
      .append("div")
      .style("text-align", "center")
      .style("padding", "20px")
      .html(`<p>No association rules found for this category</p>`);
    return;
  }

  // Filter rules by confidence threshold
  const filteredRules = associationRules.filter(rule => rule.confidence >= confidenceThreshold);

  if (filteredRules.length === 0) {
    // Display message when no rules meet the confidence threshold
    d3.select(networkGraphRef.current)
      .append("div")
      .style("text-align", "center")
      .style("padding", "20px")
      .html(`<p>No association rules found with confidence ≥ ${confidenceThreshold.toFixed(2)}</p>
            <p>Try lowering the confidence threshold.</p>`);
    return;
  }

  // Rest of your network graph code...
  // Prepare nodes and links for network graph
  const allProducts = Array.from(
    new Set(filteredRules.flatMap((rule) => [...rule.antecedent, ...rule.consequent]))
  );

  const nodes = allProducts.map((product, i) => ({
    id: i,
    name: product,
    group: 1,
  }));

  const links = filteredRules.map((rule) => ({
    source: nodes.find((n) => n.name === rule.antecedent[0]).id,
    target: nodes.find((n) => n.name === rule.consequent[0]).id,
    value: rule.confidence * 10, // Scale for visualization
    confidence: rule.confidence,
  }));

  const svg = d3
    .select(networkGraphRef.current)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;")
    .call(d3.zoom()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        svg.attr("transform", event.transform);
      }))
    .append("g");

  // Create simulation
  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3.forceLink(links).id((d) => d.id).distance(100)
    )
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2));

  // Draw links
  const link = svg
    .append("g")
    .selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .attr("stroke-width", (d) => d.value)
    .attr("stroke", "#999");

  // Draw nodes
  const node = svg
    .append("g")
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("r", 10)
    .attr("fill", "#e15759");

  // Add node labels
  const label = svg
    .append("g")
    .selectAll("text")
    .data(nodes)
    .enter()
    .append("text")
    .attr("dy", -15)
    .attr("text-anchor", "middle")
    .text((d) => d.name)
    .style("font-size", "12px")
    .style("pointer-events", "none");

  // Add confidence labels on links
  const linkLabels = svg
    .append("g")
    .selectAll("text")
    .data(links)
    .enter()
    .append("text")
    .attr("font-size", 10)
    .attr("fill", "#333")
    .text(d => d.confidence.toFixed(2));

  // Update positions on each tick
  simulation.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

    label.attr("x", (d) => d.x).attr("y", (d) => d.y);

    linkLabels
      .attr("x", d => (d.source.x + d.target.x) / 2)
      .attr("y", d => (d.source.y + d.target.y) / 2);
  });

  // Add title
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold");
  }, [associationRules, confidenceThreshold, selectedCategory]);

  useEffect(() => {
    if (!fpTreeRef.current || !fpTreeData) return;
  
    d3.select(fpTreeRef.current).selectAll("*").remove();
  
    const width = 1000;
    const height = 600;
    const margin = { top: 50, right: 120, bottom: 50, left: 120 };
  
    const svg = d3
      .select(fpTreeRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .call(
        d3.zoom()
          .scaleExtent([0.2, 2])
          .on("zoom", (event) => {
            g.attr("transform", event.transform);
          })
      );
  
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  
    // Build the tree layout
    const root = tree().size([width - margin.left - margin.right, height - margin.top - margin.bottom])(
      d3.hierarchy(fpTreeData)
    );
  
    // Dodge algorithm for label overlap
    const labelPadding = 18;
    const yByDepth = {};
    root.descendants().forEach(d => {
      if (!yByDepth[d.depth]) yByDepth[d.depth] = [];
      let y = d.y;
      while (yByDepth[d.depth].some(existingY => Math.abs(existingY - y) < labelPadding)) {
        y += labelPadding;
      }
      yByDepth[d.depth].push(y);
      d.yDodge = y;
    });
  
    // Draw links: use adjusted positions!
    g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", d => {
        // Use the adjusted y position (yDodge) for both source and target
        const source = { x: d.source.x, y: d.source.yDodge };
        const target = { x: d.target.x, y: d.target.yDodge };
        return d3.linkVertical()
          .x(d => d.x)
          .y(d => d.y)({ source, target });
      })
      .attr("stroke", "#999")
      .attr("fill", "none");
  
    // Draw nodes at adjusted positions
    const node = g
      .selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.x},${d.yDodge})`);
  
    node
      .append("circle")
      .attr("r", 10)
      .attr("fill", d => d.depth === 0 ? "#fff" : "#69b3a2")
      .attr("stroke", "#999");
  
    // Add labels, with word wrap for long names
    node
      .append("text")
      .attr("dy", ".35em")
      .attr("x", d => d.children ? -15 : 15)
      .style("text-anchor", d => d.children ? "end" : "start")
      .style("font-size", "14px")
      .style("user-select", "none")
      .selectAll("tspan")
      .data(d => wrapText(d.data.name, 16)) // 16 chars per line, adjust as needed
      .enter()
      .append("tspan")
      .attr("x", d => d.parent ? -15 : 15)
      .attr("dy", (d, i) => i === 0 ? 0 : "1.2em")
      .text(d => d);
  
    // Add title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("FP-Tree Visualization");
  
    // Helper: word wrap for SVG text
    function wrapText(text, maxLen) {
      if (!text) return [""];
      const words = text.split(" ");
      const lines = [];
      let line = "";
      for (let word of words) {
        if ((line + word).length > maxLen) {
          lines.push(line.trim());
          line = "";
        }
        line += word + " ";
      }
      if (line) lines.push(line.trim());
      return lines;
    }
  }, [fpTreeData]);
  
  

return (
<div className="p-6">
  <h1 className="text-3xl font-bold mb-6">Market Basket Analysis</h1>

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

  {/* Summary Cards */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
  <div className="bg-white rounded-lg shadow p-6">
    <h3 className="text-gray-500 text-sm">Total Products Analyzed</h3>
    <p className="text-2xl font-bold">{heatmapData.products.length}</p>
  </div>

  <div className="bg-white rounded-lg shadow p-6">
    <h3 className="text-gray-500 text-sm">Strongest Association</h3>
    {strongestAssociation.confidence > 0 ? (
      <>
        <p className="text-lg font-semibold truncate" title={`${strongestAssociation.antecedent} → ${strongestAssociation.consequent}`}>
          {strongestAssociation.antecedent} → {strongestAssociation.consequent}
        </p>
        <p className="text-2xl font-bold text-blue-600">
          {(strongestAssociation.confidence * 100).toFixed(1)}%
        </p>
      </>
    ) : (
      <p className="text-lg font-semibold">No associations found</p>
    )}
  </div>
</div>

  {/* Frequent Itemsets */}
  <div className="bg-white rounded-lg shadow p-6 mb-6">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
    <h2 className="text-xl font-bold mb-2 md:mb-0">Frequently Bought Together</h2>
    <div className="w-full md:w-64">
      <label htmlFor="numBars" className="block text-sm font-medium text-gray-700 mb-1">
        Number of Items to Show: {numBars}
      </label>
      <input
        id="numBars"
        type="range"
        min="1"
        max={Math.min(10, frequentItemsetsData.length)}
        step="1"
        value={numBars}
        onChange={(e) => setNumBars(parseInt(e.target.value))}
        className="w-full"
      />
    </div>
  </div>
  <div ref={frequentItemsetsRef}></div>
</div>

  {/* Product Associations with Confidence Filter */}
  <div className="bg-white rounded-lg shadow p-6 mb-6">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
      <h2 className="text-xl font-bold mb-2 md:mb-0">Product Associations</h2>
      <div className="w-full md:w-64">
        <label htmlFor="confidence" className="block text-sm font-medium text-gray-700 mb-1">
          Min Confidence: {confidenceThreshold.toFixed(2)}
        </label>
        <input
          id="confidence"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={confidenceThreshold}
          onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
    {isLoading ? (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    ) : (
      <div ref={networkGraphRef}></div>
    )}
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
    <div className="bg-white rounded-lg shadow p-6" id="heatmap-container">
      <h2 className="text-xl font-bold mb-4">Product Co-Occurrence Heatmap ({selectedCategory})</h2>
      <Plot
        data={[
          {
            z: heatmapData.values,
            x: heatmapData.products,
            y: heatmapData.products,
            type: "heatmap",
            colorscale: "Viridis",
          },
        ]}
        layout={{
          width: containerSize.width,
          height: containerSize.height,
          xaxis: { 
            title: "Product",
            tickangle: -45,
            automargin: true
          },
          yaxis: { 
            title: "Product",
            automargin: true
          },
          margin: { l: 150, r: 50, b: 150, t: 50 },
        }}
        config={{
          scrollZoom: true,
          displayModeBar: true,
          modeBarButtonsToAdd: [
            {
              name: 'Zoom in',
              icon: Plotly.Icons.zoom_in,
              click: function(gd) {
                Plotly.relayout(gd, {
                  'xaxis.range[0]': gd.layout.xaxis.range[0] * 0.8,
                  'xaxis.range[1]': gd.layout.xaxis.range[1] * 0.8,
                  'yaxis.range[0]': gd.layout.yaxis.range[0] * 0.8,
                  'yaxis.range[1]': gd.layout.yaxis.range[1] * 0.8
                });
              }
            },
            {
              name: 'Zoom out',
              icon: Plotly.Icons.zoom_out,
              click: function(gd) {
                Plotly.relayout(gd, {
                  'xaxis.range[0]': gd.layout.xaxis.range[0] * 1.2,
                  'xaxis.range[1]': gd.layout.xaxis.range[1] * 1.2,
                  'yaxis.range[0]': gd.layout.yaxis.range[0] * 1.2,
                  'yaxis.range[1]': gd.layout.yaxis.range[1] * 1.2
                });
              }
            },
            {
              name: 'Reset zoom',
              icon: Plotly.Icons.home,
              click: function(gd) {
                Plotly.relayout(gd, {
                  'xaxis.autorange': true,
                  'yaxis.autorange': true
                });
              }
            }
          ]
        }}
      />
    </div>
  </div>

   {/* Sankey Diagram */}
   <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-xl font-bold mb-4">Purchase Flows</h2>
    {sankeyData.nodes.length > 0 ? (
      <Plot
        data={[
          {
            type: "sankey",
            orientation: "h",
            node: {
              pad: 15,
              thickness: 30,
              line: { color: "black", width: 0.5 },
              label: sankeyData.nodes.map((node) => node.name),
              color: sankeyData.nodes.map((_, i) => 
                d3.interpolateRainbow(i / sankeyData.nodes.length)
              ),
            },
            link: {
              source: sankeyData.links.map((link) => link.source),
              target: sankeyData.links.map((link) => link.target),
              value: sankeyData.links.map((link) => link.value),
              color: sankeyData.links.map(() => "rgba(150, 150, 150, 0.3)"),
            },
          },
        ]}
        layout={{
          width: 1000,
          height: 600,
          title: `Product Purchase Paths (${selectedCategory})`,
          font: {
            size: 10
          }
        }}
        config={{
          responsive: true
        }}
      />
    ) : (
      <div className="text-center py-10">
        <p>No purchase flow data available for this category</p>
      </div>
    )}
  </div>
  <div className="bg-white rounded-lg shadow p-6 mt-6">
    <h2 className="text-xl font-bold mb-4">FP-Tree Visualization</h2>
    {fpTreeData ? (
      <div ref={fpTreeRef}></div>
    ) : (
      <div className="text-center py-10">Loading FP-Tree...</div>
    )}
  </div>

</div>
);
}