"use client";

import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "@/lib/api";

import { useI18n } from "@/i18n";

interface TotalViewsChartProps {
  totalViews: number;
  businessId: string;
}

const PERIODS = [
  { id: '1d', label: 'Այսօր' },
  { id: '7d', label: '7 օր' },
  { id: '14d', label: '14 օր' },
  { id: '1m', label: '1 ամիս' },
  { id: '3m', label: '3 ամիս' },
  { id: '6m', label: '6 ամիս' },
  { id: '1y', label: '1 տարի' },
  { id: 'all', label: 'Ամբողջը' },
];

export default function TotalViewsChart({ totalViews, businessId }: TotalViewsChartProps) {
  const { t } = useI18n();
  const [period, setPeriod] = useState<string>('7d');
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!businessId) return;
      setLoading(true);
      try {
        const res = await api.get(`/businesses/${businessId}/analytics?period=${period}`);
        
        if (res.data?.success) {
          const rawData = res.data.data;
          
          // Generate a full range of dates based on period to fill missing gaps with 0
          const filledData = [];
          const now = new Date();
          
          if (period === '1d') {
            for (let i = 23; i >= 0; i--) {
              const d = new Date(now);
              d.setHours(d.getHours() - i);
              const dateStr = d.toLocaleTimeString("hy-AM", { hour: "2-digit", minute: "2-digit" });
              const matchStr = d.toISOString().substring(0, 13).replace('T', ' ') + ':00'; // matching backend '%Y-%m-%d %H:00'
              const found = rawData.find((r: any) => r.date === matchStr);
              filledData.push({ date: dateStr, views: found ? found.views : 0 });
            }
          } else if (period === '1y' || period === 'all') {
            const months = period === '1y' ? 12 : 24;
            for (let i = months - 1; i >= 0; i--) {
              const d = new Date(now);
              d.setMonth(d.getMonth() - i);
              const dateStr = d.toLocaleDateString("hy-AM", { month: "short", year: "numeric" });
              const matchStr = d.toISOString().substring(0, 7); // '%Y-%m'
              const found = rawData.find((r: any) => r.date === matchStr);
              filledData.push({ date: dateStr, views: found ? found.views : 0 });
            }
          } else {
            let days = 7;
            if (period === '14d') days = 14;
            if (period === '1m') days = 30;
            if (period === '3m') days = 90;
            if (period === '6m') days = 180;
            
            for (let i = days - 1; i >= 0; i--) {
              const d = new Date(now);
              d.setDate(d.getDate() - i);
              const dateStr = d.toLocaleDateString("hy-AM", { month: "short", day: "numeric" });
              const matchStr = d.toISOString().substring(0, 10); // '%Y-%m-%d'
              const found = rawData.find((r: any) => r.date === matchStr);
              filledData.push({ date: dateStr, views: found ? found.views : 0 });
            }
          }

          setChartData(filledData);
        }
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [businessId, period]);



  const interval = period === '3m' || period === '6m' ? 'preserveStartEnd' : 0;
  const minTickGap = period === '3m' || period === '6m' ? 30 : 5;

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm h-full flex flex-col animate-scale-in relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-[hsl(var(--foreground))] mb-1">{t.dashboard.viewsDynamics}</h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">{t.dashboard.analyzeVisits}</p>
        </div>
        
        {/* Time Period Filter */}
        <details className="relative group">
          <summary className="list-none cursor-pointer flex items-center justify-between gap-2 px-4 py-2 bg-[hsl(var(--muted))] rounded-xl text-sm font-medium text-[hsl(var(--foreground))] select-none border border-transparent hover:border-[hsl(var(--border))] transition-colors">
            {PERIODS.find(p => p.id === period)?.label || 'Ընտրել'}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-180 opacity-50"><path d="m6 9 6 6 6-6"/></svg>
          </summary>
          <div className="absolute right-0 top-full mt-2 w-40 flex flex-col gap-1 p-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl z-50 shadow-lg">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={(e) => {
                  setPeriod(p.id);
                  const details = e.currentTarget.closest('details');
                  if (details) details.removeAttribute('open');
                }}
                className={`px-3 py-2 text-sm text-left rounded-lg transition-all ${
                  period === p.id 
                    ? "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm font-bold border border-[hsl(var(--border))]" 
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </details>
      </div>

      <div className="h-[300px] w-full relative">
        {loading && (
          <div className="absolute inset-0 bg-[hsl(var(--background))]/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
          </div>
        )}
        
        {chartData.length === 0 && !loading ? (
          <div className="h-full w-full flex items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
            Այս ժամանակահատվածում դիտումներ չկան:
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.2)" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: "gray" }} 
                dy={10}
                minTickGap={minTickGap}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: "gray" }} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  borderColor: "hsl(var(--border))",
                  borderRadius: "12px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  color: "hsl(var(--foreground))"
                }}
                itemStyle={{ color: "#10b981", fontWeight: "bold" }}
              />
              <Area 
                type="monotone" 
                dataKey="views" 
                name="Դիտումներ"
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorViews)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
