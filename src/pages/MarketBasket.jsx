import { useEffect, useRef } from "react";
import * as d3 from "d3";
import Plot from "react-plotly.js";
import { tree } from "d3-hierarchy";

export default function MarketBasketAnalysis() {
  const frequentItemsetsRef = useRef();
  const networkGraphRef = useRef();
  const fpTreeRef = useRef();


  // Mock data for market basket analysis
  const transactionData = [
    { items: ["Smartphone", "Phone Case", "Screen Protector"] },
    { items: ["Laptop", "Laptop Bag", "Wireless Mouse"] },
    { items: ["Smartphone", "Phone Case"] },
    { items: ["Headphones", "Smartphone", "Charger"] },
    { items: ["Tablet", "Tablet Case", "Stylus"] },
    { items: ["Smartwatch", "Charger", "Screen Protector"] },
    { items: ["Laptop", "Laptop Bag"] },
    { items: ["Smartphone", "Phone Case", "Charger"] },
    { items: ["Headphones", "Earphone Case"] },
    { items: ["Camera", "Memory Card", "Tripod"] },
  ];

  // Generate frequent itemsets (simplified for demo)
  const frequentItemsets = [
    { items: ["Smartphone", "Phone Case"], support: 850 },
    { items: ["Laptop", "Laptop Bag"], support: 720 },
    { items: ["Headphones", "Smartphone"], support: 600 },
    { items: ["Headphones", "Earphone Case"], support: 450 },
    { items: ["Camera", "Memory Card"], support: 490 },
  ];

  // Generate association rules (simplified for demo)
  const associationRules = [
    { antecedent: ["Smartphone"], consequent: ["Phone Case"], confidence: 0.85 },
    { antecedent: ["Laptop"], consequent: ["Laptop Bag"], confidence: 0.78 },
    { antecedent: ["Headphones"], consequent: ["Smartphone"], confidence: 0.65 },
    { antecedent: ["Camera"], consequent: ["Memory Card"], confidence: 0.72 },
  ];

  // Prepare data for heatmap
  const heatmapData = {
    products: ["Smartphone", "Phone Case", "Laptop", "Laptop Bag", "Headphones"],
    values: [
      [0, 850, 120, 50, 600],
      [850, 0, 30, 20, 450],
      [120, 30, 0, 720, 80],
      [50, 20, 720, 0, 60],
      [600, 450, 80, 60, 0],
    ],
  };

  // Prepare data for Sankey diagram
  const sankeyData = {
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
  };

  // Sample FP-Tree data (simplified for visualization)
  const fpTreeData = {
    name: "null",
    children: [
      {
        name: "Smartphone:5",
        children: [
          {
            name: "Phone Case:4",
            children: [
              { name: "Charger:2" },
              { name: "Screen Protector:1" }
            ]
          },
          { name: "Headphones:1" }
        ]
      },
      {
        name: "Laptop:3",
        children: [
          { name: "Laptop Bag:2" }
        ]
      },
      {
        name: "Headphones:2",
        children: [
          { name: "Earphone Case:1" }
        ]
      }
    ]
  };

  // Create frequent itemsets bar chart
  useEffect(() => {
    if (!frequentItemsetsRef.current) return;

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

    // Sort by support
    const sortedData = [...frequentItemsets].sort((a, b) => b.support - a.support);

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
      .call(d3.axisBottom(x));

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
      .text((d) => d.support);

    // Add title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold");
  }, []);

  // Create network graph
  useEffect(() => {
    if (!networkGraphRef.current) return;

    // Clear previous chart
    d3.select(networkGraphRef.current).selectAll("*").remove();

    const width = 1000;
    const height = 800;

    // Prepare nodes and links for network graph
    const allProducts = Array.from(
      new Set(associationRules.flatMap((rule) => [...rule.antecedent, ...rule.consequent]))
    );

    const nodes = allProducts.map((product, i) => ({
      id: i,
      name: product,
      group: 1,
    }));

    const links = associationRules.map((rule) => ({
      source: nodes.find((n) => n.name === rule.antecedent[0]).id,
      target: nodes.find((n) => n.name === rule.consequent[0]).id,
      value: rule.confidence * 10, // Scale for visualization
    }));

    const svg = d3
      .select(networkGraphRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
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
      .style("font-size", "12px");

    // Update positions on each tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

      label.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });

    // Add title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold");
  }, []);

  useEffect(() => {
    if (!fpTreeRef.current) return;
  
    // Clear previous chart
    d3.select(fpTreeRef.current).selectAll("*").remove();
  
    
  
    const width = 1000;
    const height = 600;
    const margin = { top: 50, right: 120, bottom: 50, left: 120 };
  
    const svg = d3
      .select(fpTreeRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    // Create the tree layout
    const root = tree().size([width - margin.left - margin.right, height - margin.top - margin.bottom])(
      d3.hierarchy(fpTreeData)
    );
  
    // Draw links
    svg
      .selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", d3.linkVertical()
        .x(d => d.x)
        .y(d => d.y))
      .attr("stroke", "#999")
      .attr("fill", "none");
  
    // Draw nodes
    const node = svg
      .selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.x},${d.y})`);
  
    // Add circles
    node
      .append("circle")
      .attr("r", 10)
      .attr("fill", d => d.depth === 0 ? "#fff" : "#69b3a2")
      .attr("stroke", "#999");
  
    // Add labels
    node
      .append("text")
      .attr("dy", ".35em")
      .attr("x", d => d.children ? -15 : 15)
      .style("text-anchor", d => d.children ? "end" : "start")
      .text(d => d.data.name);
  
    // Add title
    svg
      .append("text")
      .attr("x", (width - margin.left - margin.right) / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("FP-Tree Visualization");
  }, []);



  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Market Basket Analysis</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm">Total Products Analyzed</h3>
          <p className="text-2xl font-bold">24</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm">Total Transactions</h3>
          <p className="text-2xl font-bold">{transactionData.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm">Strongest Association</h3>
          <p className="text-2xl font-bold">Smartphone → Phone Case (85%)</p>
        </div>
      </div>

      {/* Frequent Itemsets */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Frequently Bought Together</h2>
        <div ref={frequentItemsetsRef}></div>
      </div>
     <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
       <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Product Associations</h2>
          <div ref={networkGraphRef}></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
        

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Product Co-Occurrence Heatmap</h2>
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
              width: 1000,
              height: 800,
              xaxis: { title: "Product" },
              yaxis: { title: "Product" },
            }}
          />
        </div>
      </div>

      {/* Sankey Diagram */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Purchase Flows</h2>
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
                color: ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b"],
              },
              link: {
                source: sankeyData.links.map((link) => link.source),
                target: sankeyData.links.map((link) => link.target),
                value: sankeyData.links.map((link) => link.value),
              },
            },
          ]}
          layout={{
            width: 1000,
            height: 500,
            title: "Product Purchase Paths",
          }}
        />
      </div>
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-xl font-bold mb-4">FP-Tree Visualization</h2>
        <div ref={fpTreeRef}></div>
      </div>
    </div>
  );
}