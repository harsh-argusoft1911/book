import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FileText, Download, Eye, Calendar, Clock, ShieldCheck, Wand2, Loader2, ArrowRight, MapPin, Share2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/api/apiClient";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const MyReports = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("All");

  const queryClient = useQueryClient();

  const handleAIAnalysis = (orderId: string) => {
    navigate(`/patient/${patientId}/insights?orderId=${orderId}`);
  };

  const { data: orders, isLoading } = useQuery({
    queryKey: ['reports', patientId],
    queryFn: async () => {
      const response = await apiClient.get(`/bookings?patientId=${patientId}`);
      // Show only COMPLETED (Finalized) reports that have a PDF URL
      return response.data.filter((order: any) => 
        order.status === 'COMPLETED' && order.reportUrl
      );
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in max-w-6xl mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-6 border-b border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Medical Reports</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Access and analyze your results with AI insights</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
           {["All", "Latest", "Archived"].map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={cn(
                 "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                 activeTab === tab ? "bg-white text-slate-800 shadow-md" : "text-slate-400 hover:text-slate-600"
               )}
             >
               {tab}
             </button>
           ))}
        </div>
      </div>

      {orders && orders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order: any) => (
            <div key={order.id} className="rounded-[32px] bg-white border border-slate-100 p-6 shadow-soft hover:shadow-2xl hover:border-slate-200 transition-all group flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-all" />

              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                   <FileText className="h-6 w-6" />
                </div>
                <div className="flex flex-col items-end gap-1">
                   <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">
                     FINALIZED
                   </span>
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">#{order.bookingId}</span>
                </div>
              </div>

              <div className="flex-1 space-y-4 relative z-10">
                <h4 className="text-lg font-black text-slate-800 tracking-tight line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                  {order.tests?.map((t: any) => t.name).join(', ')}
                </h4>
                
                <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   <span className="flex items-center gap-1.5"><Calendar size={12} className="text-primary/60" /> {order.timeSlot?.split(',')[0]}</span>
                   <span className="flex items-center gap-1.5"><Clock size={12} className="text-primary/60" /> {order.timeSlot?.split(',')[1]}</span>
                </div>

                <div className="pt-4 border-t border-slate-50 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                    <MapPin size={14} />
                  </div>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest truncate">{order.lab?.name || "BookMyPathology Lab"}</span>
                </div>
              </div>

              {/* Action Buttons Grid */}
              <div className="mt-8 space-y-3 relative z-10">
                {order.aiInsight ? (
                  <button 
                    onClick={() => navigate(`/patient/${patientId}/insights?orderId=${order.id}`)}
                    className="w-full py-4 rounded-2xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[0.15em] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 group/btn"
                  >
                    <Activity size={16} className="group-hover/btn:scale-110 transition-transform" />
                    View AI Insights
                  </button>
                ) : (
                  <button 
                    onClick={() => handleAIAnalysis(order.id)}
                    className="w-full py-4 rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-[0.15em] hover:bg-slate-800 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group/btn"
                  >
                    <Wand2 size={16} className="group-hover/btn:rotate-12 transition-transform" />
                    Run AI Analysis
                  </button>
                )}
                
                <div className="flex gap-2">
                  <a 
                    href={order.reportUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 py-3 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-200 transition-all text-[10px] font-black uppercase tracking-widest border border-slate-100"
                  >
                    <Eye size={14} /> View
                  </a>
                  <a 
                    href={order.reportUrl} 
                    download
                    className="flex-1 py-3 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-200 transition-all text-[10px] font-black uppercase tracking-widest border border-slate-100"
                  >
                    <Download size={14} /> Save
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-32 flex flex-col items-center justify-center text-center space-y-6">
          <div className="h-32 w-32 rounded-full bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200">
            <FileText className="h-14 w-14 text-slate-200" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">No Reports Available</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto font-medium">Once your laboratory generates your digital report, it will appear here for viewing and AI analysis.</p>
          </div>
          <button 
            onClick={() => navigate(`/patient/${patientId}/book`)}
            className="px-10 py-4 rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all"
          >
            Book a New Test
          </button>
        </div>
      )}
    </div>
  );
};

export default MyReports;
