import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function Dashboard() {
  const salesChartRef = useRef();
  const pieChartRef = useRef();

  // Mock data
  const monthlySales = [
    { month: "Jan", sales: 12000 },
    { month: "Feb", sales: 15000 },
    { month: "Mar", sales: 18000 },
    { month: "Apr", sales: 16000 },
    { month: "May", sales: 21000 },
    { month: "Jun", sales: 19000 },
    { month: "Jul", sales: 22000 },
    { month: "Aug", sales: 25000 },
    { month: "Sep", sales: 23000 },
    { month: "Oct", sales: 27000 },
    { month: "Nov", sales: 30000 },
    { month: "Dec", sales: 35000 },
  ];

  const categoryData = [
    { category: "Electronics", percentage: 30 },
    { category: "Clothing", percentage: 25 },
    { category: "Books", percentage: 15 },
    { category: "Home", percentage: 20 },
    { category: "Other", percentage: 10 },
  ];

  // Draw bar chart for monthly sales
  useEffect(() => {
    if (!salesChartRef.current) return;

    // Clear previous chart
    d3.select(salesChartRef.current).selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3
      .select(salesChartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X scale
    const x = d3
      .scaleBand()
      .domain(monthlySales.map((d) => d.month))
      .range([0, width])
      .padding(0.1);

    // Y scale
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(monthlySales, (d) => d.sales)])
      .nice()
      .range([height, 0]);

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
        .tickFormat((d) => `$${d / 1000}k`)
    );

    // Add Y axis label
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr(
        "transform",
        `translate(${-margin.left / 1.5},${height / 2}) rotate(-90)`
      )
      .text("Sales ($)");

    // Add X axis label
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr(
        "transform",
        `translate(${width / 2},${height + margin.bottom - 5})`
      )
      .text("Month");

    // Add the bars
    svg
      .selectAll(".bar")
      .data(monthlySales)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.month))
      .attr("y", (d) => y(d.sales))
      .attr("width", x.bandwidth())
      .attr("height", (d) => height - y(d.sales))
      .attr("fill", "#3b82f6");
  }, []);

  // Draw pie chart for category distribution
  useEffect(() => {
    if (!pieChartRef.current) return;

    // Clear previous chart
    d3.select(pieChartRef.current).selectAll("*").remove();

    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;

    const svg = d3
      .select(pieChartRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // Color scale
    const color = d3
      .scaleOrdinal()
      .domain(categoryData.map((d) => d.category))
      .range(d3.schemeCategory10);

    // Pie generator
    const pie = d3
      .pie()
      .value((d) => d.percentage)
      .sort(null);

    // Arc generator
    const arc = d3
      .arc()
      .innerRadius(0)
      .outerRadius(radius - 20);

    // Label arc
    const labelArc = d3
      .arc()
      .innerRadius(radius - 60)
      .outerRadius(radius - 60);

    // Add the pie slices
    const g = svg
      .selectAll(".arc")
      .data(pie(categoryData))
      .enter()
      .append("g")
      .attr("class", "arc");

    g.append("path")
      .attr("d", arc)
      .attr("fill", (d) => color(d.data.category));

    // Add labels
    g.append("text")
      .attr("transform", (d) => `translate(${labelArc.centroid(d)})`)
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .text((d) => d.data.category);

    // Add title
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(0,${-radius - 10})`)
      .text("Sales by Category");
  }, []);

  // Key metrics data
  const keyMetrics = [
    { name: "Total Sales", value: "$4.25M", change: "+15%", icon: "📈" },
    { name: "Total Orders", value: "124,500", change: "+8%", icon: "📦" },
    { name: "Avg. Order Value", value: "$34.20", change: "+5%", icon: "💰" },
    { name: "Active Customers", value: "56,700", change: "+12%", icon: "👥" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {keyMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">{metric.icon}</div>
              <div>
                <h3 className="text-gray-500 text-sm">{metric.name}</h3>
                <div className="flex items-center">
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <span
                    className={`ml-2 text-sm ${
                      metric.change.startsWith("+")
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {metric.change}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Monthly Sales</h2>
          <div ref={salesChartRef} className="overflow-x-auto"></div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Sales by Category</h2>
          <div ref={pieChartRef}></div>
        </div>
      </div>
    </div>
  );
}
