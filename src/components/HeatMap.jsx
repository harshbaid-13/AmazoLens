import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function Heatmap({ data }) {
  const heatmapRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0 || !heatmapRef.current) return;

    d3.select(heatmapRef.current).selectAll("*").remove();

    const width = 900;
    const height = 600;
    const zoomFactor = 2;
    const lensRadius = 80;

    const svg = d3.select(heatmapRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height + 100) // extra space for legend
      .style("position", "relative");

    const baseGroup = svg.append("g");
    const lensGroup = svg.append("g").attr("clip-path", "url(#lens-clip)");

    svg.append("defs")
      .append("clipPath")
      .attr("id", "lens-clip")
      .append("circle")
      .attr("id", "lens-circle")
      .attr("cx", -999)
      .attr("cy", -999)
      .attr("r", lensRadius);

    const tooltip = d3.select(heatmapRef.current)
      .append("div")
      .style("position", "absolute")
      .style("background", "white")
      .style("padding", "6px 10px")
      .style("border", "1px solid #ccc")
      .style("border-radius", "5px")
      .style("box-shadow", "0 2px 5px rgba(0,0,0,0.2)")
      .style("pointer-events", "none")
      .style("font-size", "13px")
      .style("font-weight", "500")
      .style("display", "none");

    const rawMaxVal = d3.max(data, d => d.value) || 1;
    const maxVal = Math.max(10, rawMaxVal); // ensure min threshold
    const colorScale = d3.scaleSequential()
      .domain([0, maxVal])
      .interpolator(d3.interpolateYlOrRd);

    const projection = d3.geoMercator()
      .center([80, 22])
      .scale(900)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    const normalizeName = (name) =>
      name.toLowerCase().trim()
        .replace(/&/g, "and")
        .replace(/\s+/g, " ")
        .replace("andaman and nicobar islands", "andaman and nicobar")
        .replace("jammu & kashmir", "jammu and kashmir");

    const salesMap = new Map(data.map(({ state, value }) => [normalizeName(state), value]));

    d3.json("https://gist.githubusercontent.com/jbrobst/56c13bbbf9d97d187fea01ca62ea5112/raw/e388c4cae20aa53cb5090210a42ebb9b765c0a36/india_states.geojson")
      .then(geoData => {
        geoData.features.forEach(feature => {
          const rawName = feature.properties.ST_NM;
          const normalized = normalizeName(rawName);
          const value = salesMap.get(normalized) || 0;
          const [cx, cy] = path.centroid(feature);

          baseGroup.append("path")
            .attr("d", path(feature))
            .attr("fill", value ? colorScale(value) : "#eee")
            .attr("stroke", "#aaa")
            .attr("stroke-width", 0.5);

          lensGroup.append("path")
            .attr("d", path(feature))
            .attr("fill", value ? colorScale(value) : "#eee")
            .attr("stroke", "#aaa")
            .attr("stroke-width", 0.5);

          baseGroup.append("text")
            .attr("x", cx)
            .attr("y", cy)
            .text(rawName)
            .attr("text-anchor", "middle")
            .attr("dy", ".35em")
            .style("font-size", "8px")
            .style("font-weight", "bold")
            .style("fill", "#222");

          lensGroup.append("text")
            .attr("x", cx)
            .attr("y", cy)
            .text(rawName)
            .attr("text-anchor", "middle")
            .attr("dy", ".35em")
            .style("font-size", "10px")
            .style("font-weight", "bold")
            .style("fill", "#111");
        });

        svg.on("mousemove", (event) => {
          const [x, y] = d3.pointer(event);

          svg.select("#lens-circle")
            .attr("cx", x)
            .attr("cy", y);

          lensGroup.attr("transform", `translate(${x * (1 - zoomFactor)}, ${y * (1 - zoomFactor)}) scale(${zoomFactor})`);

          tooltip
            .style("left", x + 20 + "px")
            .style("top", y - 20 + "px")
            .style("display", "block")
            .html("🔍 Zoomed view");
        });

        svg.on("mouseleave", () => {
          svg.select("#lens-circle").attr("cx", -999).attr("cy", -999);
          tooltip.style("display", "none");
        });

        // 🔥 Add Color Legend
        const legendWidth = 300;
        const legendHeight = 10;
        const legendMarginTop = height + 30;

        // Legend title
        svg.append("text")
          .attr("x", width / 2)
          .attr("y", legendMarginTop - 10)
          .attr("text-anchor", "middle")
          .style("font-size", "12px")
          .style("fill", "#333")
          .style("font-weight", "600")
          .text("Sales Volume (Color Intensity)");

        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient")
          .attr("id", "legend-gradient");

        gradient.selectAll("stop")
          .data(d3.ticks(0, 1, 10))
          .enter()
          .append("stop")
          .attr("offset", d => `${d * 100}%`)
          .attr("stop-color", d => colorScale(d * maxVal));

        const legendSvg = svg.append("g")
          .attr("transform", `translate(${(width - legendWidth) / 2}, ${legendMarginTop})`);

        legendSvg.append("rect")
          .attr("width", legendWidth)
          .attr("height", legendHeight)
          .style("fill", "url(#legend-gradient)")
          .attr("rx", 5)
          .attr("ry", 5);

        const legendScale = d3.scaleLinear()
          .domain([0, maxVal])
          .range([0, legendWidth]);

        const legendAxis = d3.axisBottom(legendScale)
          .ticks(5)
          .tickFormat(d3.format(".2s"));

        legendSvg.append("g")
          .attr("transform", `translate(0, ${legendHeight})`)
          .call(legendAxis)
          .selectAll("text")
          .style("font-size", "10px")
          .style("fill", "#444");
      });
  }, [data]);

  return <div ref={heatmapRef} style={{ position: "relative" }}></div>;
}
