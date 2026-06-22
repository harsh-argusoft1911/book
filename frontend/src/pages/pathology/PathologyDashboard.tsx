import React from "react";
import { 
  TrendingUp, 
  Users, 
  ClipboardCheck, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  MoreVertical
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/api/apiClient";
import { cn } from "@/lib/utils";

const PathologyDashboard = () => {
  const { labId } = useParams();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', labId],
    queryFn: async () => {
      const response = await apiClient.get(`/analytics?labId=${labId}`);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { stats, earningsData, departmentLoad } = analytics || {
    stats: [],
    earningsData: [],
    departmentLoad: []
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            {labId === 'L-001' ? 'BookMyPathology' : 'City Pathology'} Overview
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1">Monitor your pathology lab's performance and bookings.</p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <div className="bg-slate-100 px-3 md:px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest border border-slate-200">
            ID: {labId}
          </div>
          <button className="bg-primary text-white px-4 py-2 rounded-lg text-xs md:text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all whitespace-nowrap">
            Download
          </button>
        </div>
      </div>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat: any) => {
          const Icon = stat.label.includes("Earnings") ? TrendingUp : 
                      stat.label.includes("Tests") ? ClipboardCheck :
                      stat.label.includes("Patients") ? Users : AlertCircle;
          
          const color = stat.label.includes("Earnings") ? "bg-emerald-500" : 
                       stat.label.includes("Tests") ? "bg-blue-500" :
                       stat.label.includes("Patients") ? "bg-orange-500" : "bg-rose-500";

          return (
            <Card key={stat.label} className="border-none shadow-soft hover:shadow-card transition-all duration-300 overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={cn("p-3 rounded-2xl text-white shadow-lg", color)}>
                    <Icon size={24} />
                  </div>

                <div className={cn(
                  "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                  stat.trend === "up" ? "bg-emerald-50 text-emerald-600" : 
                  stat.trend === "down" ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-600"
                )}>
                  {stat.trend === "up" && <ArrowUpRight size={14} />}
                  {stat.trend === "down" && <ArrowDownRight size={14} />}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Earnings Chart - Spans 2 columns */}
        <Card className="lg:col-span-2 border-none shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold text-slate-800">Earnings Analysis</CardTitle>
            <button className="text-slate-400 hover:text-slate-600"><MoreVertical size={18} /></button>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={earningsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{payload[0].payload.day}</p>
                            <p className="text-lg font-bold text-slate-800">₹{payload[0].value}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="amount" 
                    radius={[6, 6, 0, 0]} 
                    barSize={40}
                  >
                    {earningsData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 6 ? '#1e1b4b' : '#6366f1'} 
                        fillOpacity={index === 6 ? 1 : 0.6}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions / Lab Efficiency */}
        <div className="space-y-6">
          <Card className="border-none shadow-soft bg-slate-900 text-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold">Lab Efficiency</h3>
              <p className="text-slate-400 text-sm mt-1">Average turnaround time for reports.</p>
              <div className="mt-8 flex items-end gap-2">
                <span className="text-4xl font-bold">4.2</span>
                <span className="text-slate-500 font-medium mb-1">Hours</span>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Processing Speed</span>
                  <span className="font-bold text-primary">92%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-[92%] h-full bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-slate-800">Department Load</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "Hematology", load: 75, color: "bg-blue-500" },
                { name: "Biochemistry", load: 45, color: "bg-emerald-500" },
                { name: "Microbiology", load: 60, color: "bg-orange-500" },
              ].map((dept) => (
                <div key={dept.name} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">{dept.name}</span>
                    <span className="text-slate-400">{dept.load}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", dept.color)} style={{ width: `${dept.load}%` }}></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PathologyDashboard;
