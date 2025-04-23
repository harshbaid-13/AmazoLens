import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function WeeklySalesBarChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBarChartData = async () => {
    const res = await fetch(`http://127.0.0.1:8000/dashboard/weekly-sales`);
    const data = await res.json();
    const modified_data = data.slice(1).map((entry, index) => ({
      week: `Week ${index + 1}`,
      sales: entry.sales,
    }));
    console.log(modified_data);
    setData(modified_data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBarChartData();
  }, []);

  if (loading)
    return <div className="text-center p-4">Loading weekly sales...</div>;

  return (
    <div className="w-full h-[400px] p-4 bg-white rounded-2xl shadow-md">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="week"
            angle={0} // Ensure no rotation on labels
            textAnchor="middle" // Center the labels
            interval={0} // Avoid skipping any X-axis labels
          />
          <YAxis
            tickFormatter={(value) => `₹${(value / 1000000).toLocaleString()}M`} // Format Y-axis in millions
          />
          <Tooltip
            formatter={(value) =>
              `₹${(
                Math.round((value / 1000000) * 100) / 100
              ).toLocaleString()} M`
            }
          />
          <Bar dataKey="sales" fill="#4f46e5" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
