import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Plot from "react-plotly.js";
import { tree } from "d3-hierarchy";
import Papa from "papaparse";

export default function MarketBasketAnalysis() {
  const frequentItemsetsRef = useRef();
  const networkGraphRef = useRef();
  const fpTreeRef = useRef();
  const [selectedCategory, setSelectedCategory] = useState("Atta, Rice & Dal");
  const [isLoading, setIsLoading] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.3);
  const [data, setData] = useState({
    frequentItemsets: [],
    associationRules: [],
    heatmap: { products: [], values: [] },
    sankey: { nodes: [], links: [] },
    fpTree: { name: "null", children: [] },
    summary: { totalProducts: 0,  strongestAssociation: "" } //totalTransactions: 0,
  });

  // Get all available categories from the assets folder
  const categories = [
    "Atta, Rice & Dal",
    "Baby Care",
    "Bakery & Biscuits",
    "Chicken, Meat & Fish",
    "Cleaning Essentials",
    "Cold Drinks & Juices",
    "Dairy & Breakfast",
    "Dry Fruits, Masala & Oil",
    "Home & Office",
    "Instant & Frozen Food",
    "Munchies",
    "Organic & Premium",
    "Paan Corner",
    "Personal Care",
    "Pet Care",
    "Pharma & Wellness",
    "Sauces & Spreads",
    "Specials",
    "Sweet Tooth",
    "Tea, Coffee & Health Drinks",
    "Vegetables & Fruits"
  ];

  // Load data when category changes
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      console.log(`Loading data for category: ${selectedCategory}`);
      
      try {
        const categoryPath = selectedCategory.replace(/, /g, '_').replace(/ & /g, '_');
        
        // Load frequent itemsets
        const frequentItemsetsResponse = await fetch(`/src/assets/market-basket/${selectedCategory}/frequent_itemsets_output_${selectedCategory}.csv`);
        const frequentItemsetsText = await frequentItemsetsResponse.text();
        const frequentItemsetsParsed = Papa.parse(frequentItemsetsText, { header: true });
        console.log('Frequent itemsets data:', frequentItemsetsParsed.data);
        
        const frequentItemsets = frequentItemsetsParsed.data.map(item => ({
          items: item.itemsets.replace(/frozenset\(\{'(.*?)'\}\)/, '$1').split("', '"),
          support: parseFloat(item.support),
          support_count: parseInt(item.support_count)
        }));
        
        // Load association rules
        const associationRulesResponse = await fetch(`/src/assets/market-basket/${selectedCategory}/association_rules_output_${selectedCategory}.csv`);
        const associationRulesText = await associationRulesResponse.text();
        const associationRulesParsed = Papa.parse(associationRulesText, { header: true });
        console.log('Association rules data:', associationRulesParsed.data);
        
        const associationRules = associationRulesParsed.data.map(rule => ({
          antecedent: [rule.antecedents],
          consequent: [rule.consequents],
          support: parseFloat(rule.support),
          confidence: parseFloat(rule.confidence),
          lift: parseFloat(rule.lift)
        }));
        
        // Load heatmap data
        const heatmapResponse = await fetch(`/src/assets/market-basket/${selectedCategory}/heatmap_output_${selectedCategory}.csv`);
        const heatmapText = await heatmapResponse.text();
        const heatmapParsed = Papa.parse(heatmapText);
        console.log('Heatmap data:', heatmapParsed.data);
        
        const heatmapProducts = heatmapParsed.data[0];
        const heatmapValues = heatmapParsed.data.slice(1).map(row => 
          row.map(val => val === '' ? 0 : parseInt(val))
        );
        
        // Prepare sankey data (simplified for demo - you might need to adjust based on your pkl format)
        const allProducts = Array.from(
          new Set(associationRules.flatMap(rule => [...rule.antecedent, ...rule.consequent]))
        );
        
        const sankeyNodes = allProducts.map((product, i) => ({
          name: product,
          color: d3.schemeCategory10[i % 10]
        }));
        
        const sankeyLinks = associationRules
          .filter(rule => rule.confidence > 0.5) // Filter strong associations
          .map(rule => ({
            source: sankeyNodes.findIndex(node => node.name === rule.antecedent[0]),
            target: sankeyNodes.findIndex(node => node.name === rule.consequent[0]),
            value: rule.confidence * 100 // Scale for visualization
          }));
        
        // Prepare summary stats
        const totalProducts = heatmapProducts.length;
        // const totalTransactions = frequentItemsets.reduce((sum, item) => sum + item.support_count, 0);
        const strongestAssociation = associationRules.reduce((max, rule) => 
          rule.confidence > max.confidence ? rule : max, { confidence: 0 });
        
        setData({
          frequentItemsets,
          associationRules,
          heatmap: {
            products: heatmapProducts,
            values: heatmapValues
          },
          sankey: {
            nodes: sankeyNodes,
            links: sankeyLinks
          },
          fpTree: { name: "null", children: [] }, // You'll need to load the actual FP-Tree data
          summary: {
            totalProducts,
            // totalTransactions,
            strongestAssociation: strongestAssociation.confidence > 0 ? 
              `${strongestAssociation.antecedent[0]} → ${strongestAssociation.consequent[0]} (${(strongestAssociation.confidence * 100).toFixed(1)}%)` : 
              "No strong associations found"
          }
        });
        
        console.log('Data loaded successfully:', {
          frequentItemsets,
          associationRules,
          heatmap: { products: heatmapProducts, values: heatmapValues },
          sankey: { nodes: sankeyNodes, links: sankeyLinks },
          summary: { totalProducts,  strongestAssociation } //totalTransactions,
        });
        
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [selectedCategory]);

  // Create frequent itemsets bar chart
  useEffect(() => {
    if (!frequentItemsetsRef.current || isLoading) return;
    console.log('Rendering frequent itemsets chart');

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
    const sortedData = [...data.frequentItemsets]
      .sort((a, b) => b.support - a.support)
      .slice(0, 15); // Show top 15

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
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => d3.format(".0%")(d)));

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
      .text((d) => d3.format(".1%")(d.support));

    // Add title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(`Frequent Itemsets - ${selectedCategory}`);
  }, [data.frequentItemsets, isLoading, selectedCategory]);

  useEffect(() => {
    if (!networkGraphRef.current || isLoading) return;

    // Clear previous chart
    d3.select(networkGraphRef.current).selectAll("*").remove();

    // Get container dimensions
    const container = networkGraphRef.current.parentElement;
    const width = container.clientWidth;
    const height = Math.min(600, width * 0.8);

    // Create SVG with zoomable group
    const svg = d3
      .select(networkGraphRef.current)
      .append("svg")
      .attr("width", "100%")
      .attr("height", height)
      .call(
        d3.zoom()
          .scaleExtent([0.1, 5])
          .on("zoom", (event) => {
            zoomGroup.attr("transform", event.transform);
          })
      )
      .append("g");

    const zoomGroup = svg.append("g");

    // Prepare nodes and links
    const allProducts = Array.from(
      new Set(data.associationRules.flatMap((rule) => [...rule.antecedent, ...rule.consequent]))
    );

    const nodes = allProducts.map((product, i) => ({
      id: i,
      name: product,
      group: 1,
    }));

    const links = data.associationRules
      .filter((rule) => rule.confidence > confidenceThreshold)
      .map((rule) => ({
        source: nodes.find((n) => n.name === rule.antecedent[0])?.id,
        target: nodes.find((n) => n.name === rule.consequent[0])?.id,
        value: rule.confidence * 10,
        confidence: rule.confidence,
        lift: rule.lift,
      }))
      .filter((link) => link.source !== undefined && link.target !== undefined);

    // Create simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3.forceLink(links)
          .id((d) => d.id)
          .distance((link) => 100 / (link.confidence * 2))
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(20));

    // Draw links with arrow markers
    svg
      .append("defs")
      .selectAll("marker")
      .data(links)
      .enter()
      .append("marker")
      .attr("id", (d) => `arrow-${d.source.id}-${d.target.id}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#999");

    const link = zoomGroup
      .append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke-width", (d) => d.value)
      .attr("stroke", (d) => (d.lift > 1 ? "#4e79a7" : "#e15759"))
      .attr("stroke-opacity", 0.6)
      .attr("marker-end", (d) => `url(#arrow-${d.source.id}-${d.target.id})`);

    // Draw nodes with drag behavior
    const node = zoomGroup
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 12)
      .attr("fill", "#e15759")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

    // Add node labels
    const label = zoomGroup
      .append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("dy", -15)
      .attr("text-anchor", "middle")
      .text((d) => d.name)
      .style("font-size", "12px")
      .style("fill", "#555")
      .style("pointer-events", "none");

    // Add link labels (confidence)
    const linkLabel = zoomGroup
      .append("g")
      .selectAll(".link-label")
      .data(links)
      .enter()
      .append("text")
      .attr("class", "link-label")
      .attr("dy", -5)
      .attr("text-anchor", "middle")
      .text((d) => `${d3.format(".0%")(d.confidence)} (lift: ${d.lift.toFixed(1)})`)
      .style("font-size", "10px")
      .style("fill", "#333")
      .style("pointer-events", "none");

    // Add tooltips
    const tooltip = d3
      .select(networkGraphRef.current.parentElement)
      .append("div")
      .attr("class", "network-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "white")
      .style("border", "1px solid #ddd")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("pointer-events", "none");

    node
      .on("mouseover", (event, d) => {
        tooltip
          .html(
            `<strong>${d.name}</strong><br/>Associated with ${
              links.filter((l) => l.source.id === d.id).length
            } products`
          )
          .style("visibility", "visible");
      })
      .on("mousemove", (event) => {
        tooltip
          .style("top", `${event.pageY - 10}px`)
          .style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });

    // Update positions on each tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

      label.attr("x", (d) => d.x).attr("y", (d) => d.y);

      linkLabel
        .attr("x", (d) => (d.source.x + d.target.x) / 2)
        .attr("y", (d) => (d.source.y + d.target.y) / 2);
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

    // Handle window resize
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = Math.max(600, newWidth * 0.8);
      svg.attr("viewBox", [0, 0, newWidth, newHeight]);
      simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2));
      simulation.alpha(0.3).restart();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [data.associationRules, isLoading, confidenceThreshold]);

  // FP-Tree visualization
  useEffect(() => {
    if (!fpTreeRef.current || isLoading) return;
    console.log('Rendering FP-Tree');

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
      d3.hierarchy(data.fpTree)
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
      .text(`FP-Tree Visualization - ${selectedCategory}`);
  }, [data.fpTree, isLoading, selectedCategory]);

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading {selectedCategory} data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Market Basket Analysis</h1>
        <div className="w-64">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Select Category
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm">Total Products Analyzed</h3>
          <p className="text-2xl font-bold">{data.summary.totalProducts}</p>
        </div>

        {/* <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm">Total Transactions</h3>
          <p className="text-2xl font-bold">{data.summary.totalTransactions.toLocaleString()}</p>
        </div> */}

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm">Strongest Association</h3>
          <p className="text-2xl font-bold">{data.summary.strongestAssociation}</p>
        </div>
      </div>

      {/* Frequent Itemsets */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Frequently Bought Together</h2>
        <div ref={frequentItemsetsRef}></div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Product Associations</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Confidence:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={confidenceThreshold * 100}
              onChange={(e) => setConfidenceThreshold(e.target.value / 100)}
              className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm font-medium w-10">
              {Math.round(confidenceThreshold * 100)}%
            </span>
          </div>
        </div>
        <div className="w-full h-[600px]" ref={networkGraphRef}></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Product Co-Occurrence Heatmap</h2>
        <div className="overflow-x-auto">
          <Plot
            data={[
              {
                z: data.heatmap.values,
                x: data.heatmap.products,
                y: data.heatmap.products,
                type: "heatmap",
                colorscale: "Viridis",
                hoverongaps: false,
                xgap: 1, // Add small gap between cells
                ygap: 1, // Add small gap between cells
              },
            ]}
            layout={{
              width: Math.max(1000, data.heatmap.products.length * 20), // Dynamic width based on number of products
              height: Math.max(800, data.heatmap.products.length * 20), // Dynamic height based on number of products
              margin: {
                l: 150, // Left margin
                r: 50,  // Right margin
                b: 150, // Bottom margin
                t: 50,  // Top margin
                pad: 10 // Padding
              },
              xaxis: { 
                title: "Product",
                tickangle: -45, // Rotate x-axis labels
                automargin: true, // Let Plotly handle margins
                tickfont: {
                  size: 10 // Adjust font size if needed
                }
              },
              yaxis: { 
                title: "Product",
                automargin: true, // Let Plotly handle margins
                tickfont: {
                  size: 10 // Adjust font size if needed
                }
              },
              title: {
                text: `Product Co-Occurrence - ${selectedCategory}`,
                x: 0.5, // Center title
                xanchor: 'center'
              }
            }}
            config={{
              responsive: true,
              displayModeBar: true,
            }}
          />
        </div>
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
                label: data.sankey.nodes.map((node) => node.name),
                color: data.sankey.nodes.map((node) => node.color),
              },
              link: {
                source: data.sankey.links.map((link) => link.source),
                target: data.sankey.links.map((link) => link.target),
                value: data.sankey.links.map((link) => link.value),
              },
            },
          ]}
          layout={{
            width: 1000,
            height: 500,
            title: `Product Purchase Paths - ${selectedCategory}`,
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