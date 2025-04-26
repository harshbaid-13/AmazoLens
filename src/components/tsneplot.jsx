import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import * as d3 from 'd3';

const colors = ['red', 'blue', 'green', 'purple', 'orange', 'cyan', 'pink', 'brown', 'gray', 'olive'];

const TSNEPlot = ({ selectedCategory = "All" }) => {
  const [plotData, setPlotData] = useState([]);

  useEffect(() => {
    d3.csv("/data_for_tsne_final2.csv").then((data) => {
      // Filter based on selected category
      const filtered = selectedCategory === "All"
        ? data
        : data.filter(d => d.split_2_category === selectedCategory);

      // Assign colors by topic name
      const colorMap = {};
      let colorIndex = 0;

      const processed = filtered.map(d => {
        const topic = d.name_of_topic;
        const color = colorMap[topic] ?? (colorMap[topic] = colors[colorIndex++ % colors.length]);

        return {
          x: +d.x2,
          y: +d.y2,
          z: +d.z2,
          topic: d.name_of_topic,
          review: d.review_title,
          color,
          
        };
      });

      setPlotData(processed);
    });
  }, [selectedCategory]);

  const tracesByTopic = d3.groups(plotData, d => d.topic).map(([topic, group]) => ({
    x: group.map(d => d.x),
    y: group.map(d => d.y),
    z: group.map(d => d.z),
    text: group.map(d => `${d.topic}<br>${d.review}`),
    name: topic, // This is the legend label
    mode: 'markers',
    type: 'scatter3d',
    marker: {
      size: 6,
      color: group[0].color, // same color per topic
      opacity: 0.8,
    },
    hovertemplate: 'Topic: %{text}<br>x: %{x}<br>y: %{y}<br>z: %{z}<extra></extra>',
  }));

  return (
    <div className="w-full h-[600px]">
      <Plot
        data={tracesByTopic}
        layout={{
          title: `3D t-SNE Clusters (${selectedCategory})`,
          scene: {
            xaxis: { title: 't-SNE X' },
            yaxis: { title: 't-SNE Y' },
            zaxis: { title: 't-SNE Z' },
          },
          margin: { l: 0, r: 0, b: 0, t: 30 },
          dragmode: 'turntable',
  uirevision: true,showlegend: true,legend: {
    x: 1,
    y: 0.5,
    bgcolor: '#FFF',
    bordercolor: '#CCC',
    borderwidth: 1
  }
        }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default TSNEPlot;

