import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function MyUsage() {
  // 🔹 fake data (theo giờ)
  const data = [
    { hour: "00:00", usage: 1.2 },
    { hour: "03:00", usage: 0.8 },
    { hour: "06:00", usage: 1.5 },
    { hour: "09:00", usage: 2.3 },
    { hour: "12:00", usage: 3.1 },
    { hour: "15:00", usage: 2.8 },
    { hour: "18:00", usage: 3.5 },
    { hour: "21:00", usage: 2.0 },
  ];

  const [filter, setFilter] = useState("today");

  // 🔹 tính tổng usage
  const totalUsage = data.reduce((sum, item) => sum + item.usage, 0);

  return (
    <div className="space-y-6">
      
      {/* 🔥 Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Electricity Usage</h1>

        {/* Filter */}
        <select
          className="border px-3 py-1 rounded"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="today">Today</option>
          <option value="7days">Last 7 days</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* 🔥 Total Usage */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-gray-500">Total Usage</h2>
        <p className="text-2xl font-bold text-blue-600">
          {totalUsage.toFixed(2)} kWh
        </p>
      </div>

      {/* 🔥 Chart */}
      <div className="bg-white p-4 rounded-xl shadow h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="usage" stroke="#164396" />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}