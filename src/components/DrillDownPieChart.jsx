import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

/* ---------- constants ---------- */
const W = 950, H = 650, R = Math.min(W, H) / 2;
const R_FIRST = 0.82;          // % of radius for first-level arcs
const LABEL_RAD = R * 0.95;    // where spokes end

const REGION = {
  north: ["Jammu and Kashmir", "Himachal Pradesh", "Punjab", "Haryana",
    "Delhi", "Uttar Pradesh", "Uttarakhand", "Chandigarh"],
  south: ["Andhra Pradesh", "Telangana", "Tamil Nadu", "Kerala", "Karnataka",
    "Puducherry", "Lakshadweep"],
  east: ["West Bengal", "Odisha", "Bihar", "Jharkhand", "Sikkim", "Assam",
    "Meghalaya", "Manipur", "Mizoram", "Nagaland", "Tripura",
    "Andaman and Nicobar Islands"],
  west: ["Rajasthan", "Gujarat", "Maharashtra", "Goa",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Madhya Pradesh", "Chhattisgarh"]
};

const UT_LIST = [
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const MONTH_NAME = { 4: "April", 5: "May", 6: "June" };

const RAMPS = {
  north: d3.schemeBlues[9],
  south: d3.schemeGreens[9],
  east: d3.schemeOranges[9],
  west: d3.schemePurples[9],
  ut: ["#D3D3D3"],  // Light grey color for UT
  months: d3.schemePastel1,
  // Custom product color ramp with orange, yellow, blue, green, and dark green
  prod: [
    "#FFA500",  // Orange
    "#FFFF00",  // Yellow
    "#1E90FF",  // Blue
    "#32CD32",  // Green
    "#006400",  // Dark Green
    "#8A2BE2",  // Violet (optional for diversity)
    "#FFD700",  // Gold
    "#FF6347",  // Tomato
    "#8B4513"   // SaddleBrown
  ]
};

/* ---------- helpers ---------- */
const node = (name, value = 1, children = []) => ({ name, value, children });

/* --------- Function to generate random color --------- */
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export default function DrillDownSunburstD3() {
  const svgRef = useRef(null);
  const [stack, setStack] = useState([{ type: "ROOT" }]);  // history stack
  const view = stack[stack.length - 1];

  /* ----------------------------- data fetch + draw ---------------------------- */
  useEffect(() => {
    const fetchRows = async () => {
      const base = "http://127.0.0.1:8000/analytics";
      if (view.type === "ROOT" || view.type === "UT")
        return (await (await fetch(`${base}/get-sales-by-state`)).json()).data || [];
      if (view.type === "MONTH")
        return (await (await fetch(`${base}/get-sales-by-month?state_ut=${encodeURIComponent(view.state)}`)).json()).data || [];
      return (await (await fetch(`${base}/get-top-products?state_ut=${encodeURIComponent(view.state)}&month=${view.month}`)).json()).data || [];
    };

    const buildTree = rows => {
      if (view.type === "ROOT") {
        const states = [], uts = [];
        rows.forEach(r => (UT_LIST.includes(r.state_ut)
          ? uts.push(node(r.state_ut, 1))
          : states.push(node(r.state_ut, 1))
        ));
        states.push(node("Union Territories", 1, uts));
        return node("India", 1, states);
      }
      if (view.type === "UT")
        return node("Union Territories", 1,
          rows.filter(r => UT_LIST.includes(r.state_ut)).map(r => node(r.state_ut, 1)));
      if (view.type === "MONTH")
        return node(view.state, 1,
          rows.map(r => node(MONTH_NAME[r.month] || `M${r.month}`, r.total_sales)));
      /* PROD */
      return node(`${view.state}/${MONTH_NAME[view.month]}`, 1,
        rows.slice(0, 5).map(r => node(r.product_name, r.total_sales)));  // Only top 5 products
    };

    fetchRows().then(rows => {
      const root = d3.hierarchy(buildTree(rows))
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);
      draw(root);
    });
  }, [view]);

  /* ----------------------------- draw ---------------------------- */
  const draw = root => {
    const svg = d3.select(svgRef.current)
      .attr("viewBox", `${-W / 2} ${-H / 2} ${W} ${H}`)
      .style("font-family", "sans-serif");
    svg.selectAll("*").remove();

    const partition = d3.partition().size([2 * Math.PI, R * 0.8]);
    partition(root);

    const arc = d3.arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .innerRadius(d => d.y0)
      .outerRadius(d => d.y1);

    /* colour picker */
    const color = d => {
      if (UT_LIST.includes(d.data.name)) {
        // Fixed grey color for UT regions
        return RAMPS.ut[0]; // Grey color for UT
      }
      // Random color for product layers
      if (view.type === "PROD" && d.depth >= 2) {
        return RAMPS.prod[Math.abs(d.data.name.hashCode?.() ?? d.data.name.length) % RAMPS.prod.length]; // Bright colors for product slices
      }
      return getRandomColor(); // Random color for other slices
    };

    /* arcs */
    svg.append("g")
      .selectAll("path")
      .data(root.descendants().filter(d => d.depth))
      .join("path")
      .attr("fill", color)
      .attr("d", arc)
      .attr("stroke", "#fff")
      .on("click", (_, d) => {
        if (view.type === "ROOT") {
          setStack(s => [...s, d.data.name === "Union Territories"
            ? { type: "UT" }
            : { type: "MONTH", state: d.data.name }]);
        } else if (view.type === "UT") {
          setStack(s => [...s, { type: "MONTH", state: d.data.name }]);
        } else if (view.type === "MONTH") {
          const m = Object.entries(MONTH_NAME).find(([, v]) => v === d.data.name)?.[0];
          if (m) setStack(s => [...s, { type: "PROD", state: view.state, month: m }]);
        }
      });

    /* stems + labels (skip <4°) */
    const stems = svg.append("g").attr("stroke", "#999");
    const labels = svg.append("g").attr("font-size", 20);

    root.descendants()
      .filter(d => d.depth && (d.x1 - d.x0) > 0.07)
      .forEach(d => {
        const a = (d.x0 + d.x1) / 2;
        const [sx, sy] = arc.centroid(d);
        const ex = Math.cos(a - Math.PI / 2) * LABEL_RAD;
        const ey = Math.sin(a - Math.PI / 2) * LABEL_RAD;

        stems.append("line").attr("x1", sx).attr("y1", sy).attr("x2", ex).attr("y2", ey);

        const anchor = a < Math.PI ? "start" : "end";

        // Use `foreignObject` to create a div that wraps the text
        labels.append("foreignObject")
          .attr("x", ex + (anchor === "start" ? 6 : -6))
          .attr("y", ey - 10)  // Adjust vertical position to center the text properly
          .attr("width", 80)    // Set the width of the box
          .attr("height", 30)   // Set the height of the box
          .append("xhtml:div")
          .style("font-size", "11px")
          .style("text-anchor", anchor)
          .style("overflow", "hidden")
          .style("white-space", "normal")
          .style("word-wrap", "break-word")
          .style("max-width", "100%")
          .text(d.data.name);
      });

    /* center label */
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("font-size", 25)
      .attr("font-weight", 600)
      .text(root.data.name);
  };

  /* ----------------------------- helpers ---------------------------- */
  String.prototype.hashCode = function () { // simple hash for colour index
    let h = 0, i, chr;
    for (i = 0; i < this.length; i++) {
      chr = this.charCodeAt(i);
      h = (h << 5) - h + chr;
      h |= 0;
    }
    return h;
  };

  /* ----------------------------- render ---------------------------- */
  return (
    <div className="flex flex-col items-center">
      {stack.length > 1 && (
        <button
          onClick={() => setStack(s => s.slice(0, -1))}
          className="mb-3 px-4 py-2 bg-gray-200 rounded"
        >
          ← Back
        </button>
      )}

      <svg ref={svgRef} width={W} height={H} />
    </div>
  );
}
