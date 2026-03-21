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
import { Formatter } from "@/utils/formatter";

interface HealthStatsProps {
  data: NDVIDataPoint[];
  currentNDVI: number;
}

function HealthStats({ data, currentNDVI }: HealthStatsProps) {
  const previousNDVI = data[data.length - 2]?.value || currentNDVI;
  const trend = currentNDVI - previousNDVI;
  const trendPercent =
    previousNDVI > 0 ? ((trend / previousNDVI) * 100).toFixed(1) : "0";

  const health = {
    text: Formatter.getNDVIHealthLabel(currentNDVI),
    color: Formatter.getNDVIHealthColor(currentNDVI),
  };

  const minValue = Math.min(...data.map((d) => d.value));
  const maxValue = Math.max(...data.map((d) => d.value));
  const avgValue = data.reduce((sum, d) => sum + d.value, 0) / data.length;

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
              {Formatter.formatNDVI(currentNDVI)}
            </p>
            <p className={`text-sm ${health.color}`}>{health.text}</p>
          </div>
          <div
            className={`flex items-center gap-1 ${trend >= 0 ? "text-green-500" : "text-red-500"}`}
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
              {Formatter.formatNDVI(minValue)}
            </p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-2">
            <p className="text-xs text-slate-400">Media</p>
            <p className="text-sm font-semibold text-white">
              {Formatter.formatNDVI(avgValue)}
            </p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-2">
            <p className="text-xs text-slate-400">Max</p>
            <p className="text-sm font-semibold text-white">
              {Formatter.formatNDVI(maxValue)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(HealthStats);
