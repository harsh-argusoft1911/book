import { useState } from "react";
import { Bell, User, Settings, LogOut, ChevronDown, Wand2, Menu } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/api/apiClient";
import { cn } from "@/lib/utils";
const DashboardHeader = ({ onMenuClick }: { onMenuClick?: () => void }) => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['patientStats', patientId],
    queryFn: async () => {
      const response = await apiClient.get(`/patients/${patientId}/stats`);
      return response.data;
    }
  });

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="md:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all"
        >
          <Menu size={20} />
        </button>
        <div className="flex-1" />
      </div>
      
      <div className="flex items-center gap-6">
        {/* Quick Insights Action */}
        <button 
          onClick={() => navigate(`/patient/${patientId}/insights`)}
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 text-primary text-xs font-bold hover:bg-primary/10 transition-all border border-primary/10"
        >
          <Wand2 size={14} /> AI Analysis
        </button>

        <div className="flex items-center gap-4 border-r border-slate-100 pr-6">
          <button className="relative w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>
          </button>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 p-1 rounded-full hover:bg-slate-50 transition-all"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800 leading-tight">{stats?.patientName || "Patient"}</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{patientId}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-white shadow-sm flex items-center justify-center text-primary overflow-hidden">
               <User size={20} />
            </div>
            <ChevronDown size={14} className={cn("text-slate-400 transition-transform", showProfileMenu && "rotate-180")} />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-slate-100 shadow-2xl p-2 animate-scale-in z-50">
               <button onClick={() => navigate(`/patient/${patientId}/profile`)} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
                  <User size={16} /> My Profile
               </button>
               <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 transition-all">
                  <LogOut size={16} /> Logout
               </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
