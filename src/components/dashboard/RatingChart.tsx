"use client";

import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import api from "@/lib/api";

import { useI18n } from "@/i18n";

interface RatingChartProps {
  businessId: string;
}

const COLORS = {
  5: "#10b981", // green-500
  4: "#84cc16", // lime-500
  3: "#f59e0b", // amber-500
  2: "#f97316", // orange-500
  1: "#ef4444", // red-500
};

export default function RatingChart({ businessId }: RatingChartProps) {
  const { t } = useI18n();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    async function fetchRatings() {
      if (!businessId) return;
      try {
        const res = await api.get(`/businesses/${businessId}/reviews`);
        if (res.data?.success && res.data.distribution) {
          const dist = res.data.distribution;
          const chartData = [
            { name: t.dashboard.fiveStars, value: dist[5] || 0, color: COLORS[5] },
            { name: t.dashboard.fourStars, value: dist[4] || 0, color: COLORS[4] },
            { name: t.dashboard.threeStars, value: dist[3] || 0, color: COLORS[3] },
            { name: t.dashboard.twoStars, value: dist[2] || 0, color: COLORS[2] },
            { name: t.dashboard.oneStar, value: dist[1] || 0, color: COLORS[1] },
          ].filter(item => item.value > 0);
          
          setData(chartData);
          setTotalReviews(chartData.reduce((acc, curr) => acc + curr.value, 0));
        }
      } catch (error) {
        console.error("Failed to load rating distribution", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRatings();
  }, [businessId, t]);

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm flex flex-col h-full animate-scale-in">
      <div className="w-full mb-4">
        <h3 className="text-base font-bold text-[hsl(var(--foreground))] mb-1">{t.dashboard.ratingsDistribution}</h3>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">{t.dashboard.seeRatings}</p>
      </div>
      
      <div className="flex-1 w-full relative min-h-[250px] flex items-center justify-center">
        {loading ? (
          <div className="absolute inset-0 bg-[hsl(var(--background))]/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-sm text-[hsl(var(--muted-foreground))] text-center">
              Գնահատականներ դեռ չկան:
            </span>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    borderColor: "hsl(var(--border))",
                    borderRadius: "12px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                    color: "hsl(var(--foreground))",
                  }}
                  itemStyle={{ fontWeight: "bold" }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
              <span className="text-3xl font-bold">{totalReviews}</span>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">կարծիք</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
