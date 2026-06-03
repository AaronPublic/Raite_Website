"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface RegistrationTrendsProps {
  data: { date: string; count: number }[];
}

export default function RegistrationTrends({ data }: RegistrationTrendsProps) {
  return (
    <Card className="border-none bg-transparent shadow-none">
      <CardHeader className="p-8 pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-black tracking-tight text-gray-900 dark:text-white">Momentum Tracker</CardTitle>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rolling 30-Day Velocity</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[350px] p-6 pt-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" opacity={0.5} />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white dark:bg-gray-950 p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-1">
                        {new Date(payload[0].payload.date).toLocaleDateString(undefined, { dateStyle: 'full' })}
                      </p>
                      <p className="text-lg font-black text-blue-600">
                        {payload[0].value} <span className="text-xs font-medium text-gray-500">Sign-ups</span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorCount)"
              animationDuration={2000}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#1d4ed8' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
