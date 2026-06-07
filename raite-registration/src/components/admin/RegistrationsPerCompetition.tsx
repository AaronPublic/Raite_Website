"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RegistrationsPerCompetitionProps {
  data: { name: string; count: number }[];
}

const COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef"];

export default function RegistrationsPerCompetition({ data }: RegistrationsPerCompetitionProps) {
  return (
    <Card className="h-full bg-white dark:bg-gray-900/40 border-gray-100 dark:border-gray-800 rounded-[2.5rem] shadow-sm overflow-hidden group">
      <CardHeader className="p-8 pb-2">
        <CardTitle className="text-xl font-black tracking-tight text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
          Registration Density
        </CardTitle>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">By Competition Category</p>
      </CardHeader>
      <CardContent className="h-[400px] p-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" opacity={0.5} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white dark:bg-gray-950 p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-1">{payload[0].payload.name}</p>
                      <p className="text-lg font-black text-blue-600">{payload[0].value} <span className="text-xs font-medium text-gray-500">Registrations</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="count" 
              radius={[10, 10, 10, 10]} 
              barSize={40}
              animationDuration={1500}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  fillOpacity={0.8}
                  className="hover:fill-opacity-100 transition-all duration-300"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
