import { useParams } from "react-router-dom";
import { Trophy, Gift, TrendingUp, History, Star, ArrowRight, Zap, ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/api/apiClient";

const Rewards = () => {
  const { patientId } = useParams();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['patientStats', patientId],
    queryFn: async () => {
      const response = await apiClient.get(`/patients/${patientId}/stats`);
      return response.data;
    }
  });

  const points = stats?.rewardPoints || 0;
  const rupeeValue = (points * 0.5);
  const recentEarnings: any[] = stats?.recentEarnings || [];

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="text-center md:text-left">
          <h3 className="text-xl md:text-2xl font-bold text-primary">BookMyPathology Rewards</h3>
          <p className="text-[10px] md:text-sm text-muted-foreground mt-1">Earn points for tests and redeem for free diagnostics</p>
        </div>
      </div>

      {/* Points Summary Block */}
      <div className="rounded-3xl bg-gradient-hero p-8 md:p-12 text-primary-foreground shadow-card relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform">
            <Trophy className="h-48 w-48" />
         </div>
         <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-accent flex items-center justify-center text-accent-foreground shadow-glow">
                     <Star className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <span className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-accent">Active Balance</span>
               </div>
               <div className="space-y-2">
                  <div className="text-4xl md:text-5xl font-extrabold tracking-tight">{points.toLocaleString()} <span className="text-lg md:text-xl font-medium opacity-60">Points</span></div>
                  <p className="text-[11px] md:text-sm opacity-80 max-w-sm">Your balance is worth **₹{rupeeValue.toLocaleString()}**. Use these to get your next test for **FREE**.</p>
               </div>
               <div className="space-y-2">
                  <div className="flex justify-between text-[8px] md:text-[10px] font-bold uppercase tracking-widest opacity-80">
                     <span>Value in INR</span>
                     <span>₹{rupeeValue} / ₹5,000</span>
                  </div>
                  <div className="h-2.5 md:h-3 w-full bg-white/10 rounded-full overflow-hidden">
                     <div className="h-full bg-accent rounded-full shadow-glow" style={{ width: `${Math.min((rupeeValue / 5000) * 100, 100)}%` }} />
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
               <div className="p-4 md:p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-1">
                  <div className="text-xl md:text-2xl font-bold">10%</div>
                  <div className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest opacity-60">Cashback</div>
               </div>
               <div className="p-4 md:p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-1">
                  <div className="text-xl md:text-2xl font-bold">0.5</div>
                  <div className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest opacity-60">Value (INR)</div>
               </div>
               <div className="col-span-2 p-5 md:p-6 rounded-2xl bg-accent text-accent-foreground space-y-1 group/btn cursor-pointer active:scale-95 transition-all text-center">
                  <div className="flex items-center justify-between">
                     <span className="text-xs md:text-sm font-bold uppercase tracking-widest">Redeem for Free Test</span>
                     <ArrowRight className="h-5 w-5 group-hover/btn:translate-x-2 transition-transform" />
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Ways to Earn */}
         <div className="lg:col-span-2 space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary px-2 flex items-center gap-2">
               <Zap className="h-4 w-4" /> Rewards Program Rules
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {[
                 { title: "Earn as you Book", points: "10%", desc: "Every time you book a test, 10% of the amount is credited as points.", icon: TrendingUp, color: "bg-surface-mint" },
                 { title: "Refer a Patient", points: "+200", desc: "Refer a new patient to BookMyPathology and get 200 points in your wallet.", icon: Gift, color: "bg-surface-yellow" },
                 { title: "Upload Old Reports", points: "+5", desc: "Upload and digitalize your past reports to earn 5 points per document.", icon: ShieldCheck, color: "bg-surface-blue" },
                 { title: "Point Conversion", points: "₹0.5", desc: "Each reward point is worth 0.5 Rupees for free diagnostics.", icon: Star, color: "bg-surface-lavender" },
               ].map((way) => (
                  <div key={way.title} className="p-6 rounded-2xl bg-card border border-border shadow-soft hover:shadow-card transition-all space-y-4 group">
                     <div className="flex justify-between items-start">
                        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110", way.color)}>
                           <way.icon className="h-6 w-6 text-primary/60" />
                        </div>
                        <span className="text-sm font-extrabold text-emerald-600">{way.points}</span>
                     </div>
                     <div>
                        <div className="text-sm font-bold text-primary">{way.title}</div>
                        <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{way.desc}</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* History Timeline */}
         <div className="lg:col-span-1 space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary px-2 flex items-center gap-2">
               <History className="h-4 w-4" /> Recent Earning
            </h4>
            <div className="rounded-2xl bg-card border border-border p-6 shadow-soft space-y-6">
               {recentEarnings.slice(-4).length > 0 ? (
                 recentEarnings.slice(-4).map((earning: any, i: number) => (
                   <div key={earning.bookingId} className="flex gap-4 relative group">
                      {i < recentEarnings.slice(-4).length - 1 && <div className="absolute left-[19px] top-10 w-0.5 h-10 bg-border group-hover:bg-primary/20 transition-colors" />}
                      <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 border-2 z-10 bg-emerald-50 border-emerald-100 text-emerald-600">
                         <Star className="h-4 w-4" />
                      </div>
                      <div className="flex-1 pb-4 border-b border-border last:border-none">
                         <div className="flex justify-between items-start">
                            <div className="text-xs font-bold text-primary truncate max-w-[150px]">#{earning.bookingId}</div>
                            <div className="text-xs font-extrabold text-emerald-600">+{earning.pointsEarned} pts</div>
                         </div>
                         <div className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest mt-1">₹{earning.amountPaid} spent · {earning.date}</div>
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 opacity-40">
                    <History size={40} className="text-primary" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">No recent transactions</p>
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default Rewards;
