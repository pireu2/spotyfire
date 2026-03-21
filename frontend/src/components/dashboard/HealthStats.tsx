"use client";

import { memo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Leaf, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NDVIDataPoint } from "@/types";

interface HealthStatsProps {
  data: NDVIDataPoint[];
  currentNDVI: number;
}

function HealthStats({ data, currentNDVI }: HealthStatsProps) {
  const previousNDVI = data[data.length - 2]?.value || currentNDVI;
  const trend = currentNDVI - previousNDVI;
  const trendPercent = ((trend / previousNDVI) * 100).toFixed(1);

  const getHealthLabel = (value: number) => {
    if (value >= 0.7) return { text: "Excelent", color: "text-green-500" };
    if (value >= 0.5) return { text: "Bun", color: "text-green-400" };
    if (value >= 0.3) return { text: "Moderat", color: "text-yellow-500" };
    return { text: "Critic", color: "text-red-500" };
  };

  const health = getHealthLabel(currentNDVI);

  return (
    <Card className="bg-slate-800/80 backdrop-blur border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2 text-lg">
          <Leaf className="h-5 w-5 text-green-500" />
          Sănătate Vegetație
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-3xl font-bold text-white">
              {currentNDVI.toFixed(2)}
            </p>
            <p className={`text-sm ${health.color}`}>{health.text}</p>
          </div>
          <div
            className={`flex items-center gap-1 ${
              trend >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {trend >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {trend >= 0 ? "+" : ""}
              {trendPercent}%
            </span>
          </div>
        </div>

        <div className="h-[120px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 10 }} />
              <YAxis domain={[0, 1]} tick={{ fill: "#9ca3af", fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-700/50 rounded-lg p-2">
            <p className="text-xs text-slate-400">Min</p>
            <p className="text-sm font-semibold text-white">
              {Math.min(...data.map((d) => d.value)).toFixed(2)}
            </p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-2">
            <p className="text-xs text-slate-400">Medie</p>
            <p className="text-sm font-semibold text-white">
              {(
                data.reduce((acc, d) => acc + d.value, 0) / data.length
              ).toFixed(2)}
            </p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-2">
            <p className="text-xs text-slate-400">Max</p>
            <p className="text-sm font-semibold text-white">
              {Math.max(...data.map((d) => d.value)).toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(HealthStats);
