import { Activity, FileText, Calendar, CreditCard, ChevronRight, ArrowRight, Clock, MapPin, Loader2, ShieldCheck, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/api/apiClient";

const DashboardHome = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['patientStats', patientId],
    queryFn: async () => {
      const response = await apiClient.get(`/patients/${patientId}/stats`);
      return response.data;
    }
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const quickActions = [
    { label: "Book Test", icon: Activity, path: `/patient/${patientId}/book`, color: "bg-primary text-white" },
    { label: "Track Sample", icon: MapPin, path: `/patient/${patientId}/cart?tab=orders`, color: "bg-slate-100 text-slate-600" },
    { label: "Latest Report", icon: FileText, path: `/patient/${patientId}/reports`, color: "bg-slate-100 text-slate-600" },
    { label: "AI Insights", icon: Activity, path: `/patient/${patientId}/insights`, color: "bg-slate-100 text-slate-600" },
  ];

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Dynamic Stats Row - Diversified Colors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatBlock 
          icon={Activity} 
          title="Health Score" 
          value={stats?.healthScore || "84/100"} 
          subtext="Determined by BookMyPathology AI"
          colorClass="bg-emerald-50 text-emerald-700 border-emerald-100"
          iconColor="bg-emerald-500/10 text-emerald-600"
          onClick={() => navigate(`/patient/${patientId}/insights`)}
        />
        <StatBlock 
          icon={FileText} 
          title="Lab Tests" 
          value={stats?.lastTest || "None"} 
          subtext={stats?.lastTestDate ? `Last test: ${stats.lastTestDate}` : "View History"}
          colorClass="bg-violet-50 text-violet-700 border-violet-100"
          iconColor="bg-violet-500/10 text-violet-600"
          onClick={() => navigate(`/patient/${patientId}/reports`)}
        />
        <StatBlock 
          icon={Calendar} 
          title="Active Bookings" 
          value={stats?.activeBookings || "00"} 
          subtext="Track orders in cart"
          colorClass="bg-amber-50 text-amber-700 border-amber-100"
          iconColor="bg-amber-500/10 text-amber-600"
          onClick={() => navigate(`/patient/${patientId}/cart?tab=orders`)}
        />
        <StatBlock 
          icon={ShieldCheck} 
          title="Total Saved" 
          value={stats?.totalSaved || "₹0"} 
          subtext="Discounts + Points earned"
          colorClass="bg-sky-50 text-sky-700 border-sky-100"
          iconColor="bg-sky-500/10 text-sky-600"
          clickable={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Welcome & Quick Actions */}
        <div className="lg:col-span-2 space-y-8">
          <div className="p-6 md:p-10 rounded-[32px] md:rounded-[40px] bg-slate-900 text-white relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-primary/30 transition-all duration-700" />
            <div className="relative z-10 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">{getGreeting()}, {stats?.patientName}</h2>
                <p className="text-white/60 font-medium text-sm md:text-lg">Your health trends look stable. You have {stats?.activeBookings} active bookings scheduled.</p>
              </div>
              <Link 
                to={`/patient/${patientId}/book`}
                className="inline-flex items-center gap-3 bg-primary text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-white hover:text-slate-900 transition-all shadow-xl shadow-primary/20"
              >
                Book New Test <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, idx) => (
                <Link 
                  key={idx}
                  to={action.path}
                  className={cn(
                    "p-6 rounded-3xl border border-slate-100 flex flex-col items-center gap-4 transition-all hover:shadow-xl hover:border-slate-200 group",
                    action.color === "bg-primary text-white" ? "bg-primary border-primary shadow-lg shadow-primary/20" : "bg-white"
                  )}
                >
                  <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110",
                    action.color === "bg-primary text-white" ? "bg-white/20" : "bg-slate-50"
                  )}>
                    <action.icon size={24} className={action.color === "bg-primary text-white" ? "text-white" : "text-primary"} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    action.color === "bg-primary text-white" ? "text-white" : "text-slate-600"
                  )}>
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Health Tips & Support */}
        <div className="space-y-8">
           <div className="p-8 rounded-[40px] bg-white border border-slate-100 shadow-soft space-y-6">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">AI Health Tip</h3>
              <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100 space-y-4">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white">
                  <Activity size={20} />
                </div>
                <p className="text-sm font-medium text-emerald-900 leading-relaxed italic">
                  "{stats?.healthTip}"
                </p>
              </div>
              <button onClick={() => navigate(`/patient/${patientId}/insights`)} className="w-full py-4 rounded-2xl border-2 border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2">
                View All Insights <ChevronRight size={14} />
              </button>
           </div>

           <div className="p-8 rounded-[40px] bg-slate-50 border border-slate-100 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center text-rose-500 animate-pulse">
                  <Heart size={20} fill="currentColor" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-800 uppercase tracking-widest">Connect to Us</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">24/7 Emergency Support</div>
                </div>
              </div>
              <p className="text-xs font-medium text-slate-500 leading-relaxed">
                Having an Emergency? Need immediate assistance with your medical reports or booking?
              </p>
              <button className="w-full py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl">
                Contact Us Now
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatBlock = ({ icon: Icon, title, value, subtext, colorClass, iconColor, onClick, clickable = true }: any) => (
  <div 
    onClick={clickable ? onClick : undefined}
    className={cn(
      "p-8 rounded-[40px] border transition-all group", 
      colorClass,
      clickable ? "cursor-pointer hover:shadow-2xl hover:scale-[1.02]" : "cursor-default"
    )}
  >
    <div className="flex items-center justify-between mb-6">
      <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", iconColor)}>
        <Icon size={24} />
      </div>
      {clickable && <ArrowRight size={16} className="opacity-20 group-hover:opacity-100 transition-all group-hover:translate-x-1" />}
    </div>
    <div className="space-y-1">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{title}</h3>
      <div className="text-3xl font-black tracking-tight">{value}</div>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">{subtext}</p>
    </div>
  </div>
);

export default DashboardHome;
