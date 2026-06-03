"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RegistrationsByCourseProps {
  data: { name: string; count: number }[];
}

const COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#ef4444"];

export default function RegistrationsByCourse({ data }: RegistrationsByCourseProps) {
  return (
    <Card className="h-full bg-white dark:bg-gray-900/40 border-gray-100 dark:border-gray-800 rounded-[2.5rem] shadow-sm overflow-hidden group">
      <CardHeader className="p-8 pb-2">
        <CardTitle className="text-xl font-black tracking-tight text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
          Course Mix
        </CardTitle>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Demographic Breakdown</p>
      </CardHeader>
      <CardContent className="h-[400px] p-6">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={8}
              dataKey="count"
              animationDuration={1500}
              animationBegin={200}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  className="hover:opacity-80 transition-opacity outline-none"
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white dark:bg-gray-950 p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-1">{payload[0].name}</p>
                      <p className="text-lg font-black text-blue-600">{payload[0].value} <span className="text-xs font-medium text-gray-500">Students</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend 
              layout="vertical" 
              verticalAlign="bottom" 
              align="center"
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter ml-1">{value}</span>}
              wrapperStyle={{ paddingTop: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
