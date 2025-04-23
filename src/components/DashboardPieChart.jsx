// src/components/DrillDownPie.jsx
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { useEffect, useState } from "react";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AA46BE",
  "#FF6666",
  "#66CC66",
  "#6699FF",
  "#CC66FF",
  "#FF9933",
  "#00CED1",
  "#FFD700",
  "#DA70D6",
  "#40E0D0",
  "#FF4500",
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0].payload;
    const total = payload[0].payload.total;
    const percent = ((value / total) * 100).toFixed(2);
    return (
      <div className="bg-white border border-gray-300 rounded px-3 py-2 shadow-md">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-gray-600">{percent}%</p>
      </div>
    );
  }
  return null;
};

const DrillDownPie = () => {
  const [level, setLevel] = useState(1);
  const [selected, setSelected] = useState({ cat1: null, cat2: null });
  const [pieData, setPieData] = useState([]);
  const [, setActiveIndex] = useState(null);
  const [othersMode, setOthersMode] = useState(false);
  const [loadingPieChart, setLoadingPieChart] = useState(true);

  const fetchPieData = async () => {
    const params = new URLSearchParams({ level });
    if (selected.cat1) params.append("cat1", selected.cat1);
    if (selected.cat2) params.append("cat2", selected.cat2);
    if (level === 1 && othersMode) params.append("others_only", "true");

    const res = await fetch(
      `http://127.0.0.1:8000/dashboard/pie-data?${params.toString()}`
    );
    const data = await res.json();
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const enriched = data.map((item) => ({ ...item, total }));
    setPieData(enriched);
    setLoadingPieChart(false);
  };

  useEffect(() => {
    fetchPieData();
  }, [level, selected, othersMode]);

  const handleClick = (entry) => {
    setActiveIndex(null); // remove focus on click

    if (level === 1 && entry.name === "Others") {
      setOthersMode(true);
      return;
    }

    if (level === 1) {
      setSelected({ cat1: entry.name, cat2: null });
      setLevel(2);
    } else if (level === 2) {
      setSelected((prev) => ({ ...prev, cat2: entry.name }));
      setLevel(3);
    }
  };

  const handleBack = () => {
    if (othersMode) {
      setOthersMode(false);
      return;
    }

    if (level === 3) {
      setSelected((prev) => ({ ...prev, cat2: null }));
      setLevel(2);
    } else if (level === 2) {
      setSelected({ cat1: null, cat2: null });
      setLevel(1);
    }
  };
  if (loadingPieChart) return <div>Loading Pie Chart ...</div>;
  return (
    <div className="flex flex-col items-center">
      {(level > 1 || othersMode) && (
        <button
          onClick={handleBack}
          className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          ← Back
        </button>
      )}
      <PieChart width={700} height={500}>
        <Pie
          data={pieData}
          cx="50%"
          paddingAngle={0.5}
          cy="50%"
          outerRadius={150}
          className="outline-none"
          dataKey="value"
          onClick={handleClick}
          onMouseEnter={(_, index) => setActiveIndex(index)}
          onMouseLeave={() => setActiveIndex(null)}
          label={({ name }) => name}
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </div>
  );
};

export default DrillDownPie;
