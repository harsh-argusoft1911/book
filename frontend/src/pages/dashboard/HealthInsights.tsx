import { useState, useEffect } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  Activity, 
  ShieldCheck, 
  TrendingUp, 
  AlertTriangle, 
  FileText, 
  ChevronRight, 
  Search,
  Sparkles,
  Utensils,
  Dumbbell,
  ArrowRight,
  Info,
  Check,
  ShoppingBag
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/api/apiClient";
import { cn } from "@/lib/utils";

const RiskMeter = ({ label, risk }: { label: string, risk: number }) => {
  const getStatusColor = () => {
    if (risk > 70) return "bg-rose-500 text-rose-500";
    if (risk > 30) return "bg-amber-500 text-amber-500";
    return "bg-emerald-500 text-emerald-500";
  };

  const [bg, text] = getStatusColor().split(' ');

  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm space-y-3 hover:border-primary/20 transition-all group">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors">{label}</span>
        <span className={cn("text-[10px] font-black uppercase tracking-widest", text)}>
          {risk > 70 ? "High" : risk > 30 ? "Moderate" : "Low"}
        </span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-1000", bg)} 
          style={{ width: `${risk}%` }} 
        />
      </div>
    </div>
  );
};

const HealthScore = ({ score }: { score: number }) => {
  const getScoreColor = () => {
    if (score >= 80) return "text-emerald-500 stroke-emerald-500";
    if (score >= 60) return "text-amber-500 stroke-amber-500";
    return "text-rose-500 stroke-rose-500";
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
      <svg className="w-40 h-40 transform -rotate-90">
        <circle
          cx="80"
          cy="80"
          r="70"
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          className="text-slate-100"
        />
        <circle
          cx="80"
          cy="80"
          r="70"
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={440}
          strokeDashoffset={440 - (440 * score) / 100}
          strokeLinecap="round"
          className={cn("transition-all duration-1000 ease-out", getScoreColor())}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-4xl font-black", getScoreColor().split(' ')[0])}>{score}</span>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Health Score</span>
      </div>
    </div>
  );
};

const HealthInsights = () => {
  const [searchParams] = useSearchParams();
  const { patientId } = useParams();
  const orderId = searchParams.get("orderId");

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([]);

  const { data: allTests } = useQuery({
    queryKey: ['tests'],
    queryFn: async () => {
      const response = await apiClient.get('/tests');
      return response.data;
    }
  });

  const { data: insight, isLoading, error } = useQuery({
    queryKey: ['ai-insight', orderId || 'latest', patientId],
    queryFn: async () => {
      // If we have a specific orderId, analyze/fetch that
      if (orderId) {
        const response = await apiClient.post(`/ai/analyze/${orderId}`);
        return response.data;
      }
      // Otherwise, try to fetch the latest one for this patient
      const response = await apiClient.get(`/ai/latest/${patientId}`);
      return response.data;
    },
    // Always run if we have a patientId (to show latest) or a specific orderId
    enabled: !!patientId
  });

  useEffect(() => {
    if (insight && orderId) {
      // If we just finished an analysis, refresh the reports list
      queryClient.invalidateQueries({ queryKey: ['reports', patientId] });
      toast.success("AI Diagnostic Ready", {
        description: "Your comprehensive health insights have been generated."
      });
    }

    // AUTO-SELECT VERIFIED TESTS
    if (insight && allTests) {
      const autoSelectedIds: string[] = [];
      insight.nextSteps.forEach((step: any) => {
        const matchingTest = allTests.find((t: any) => {
          const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
          const tName = normalize(t.name);
          const sName = normalize(step.testName);
          return tName.includes(sName) || sName.includes(tName);
        });
        if (matchingTest) autoSelectedIds.push(matchingTest.id);
      });
      
      if (autoSelectedIds.length > 0) {
        setSelectedRecommendations(prev => {
          // Merge with existing but avoid duplicates
          const newSet = new Set([...prev, ...autoSelectedIds]);
          return Array.from(newSet);
        });
      }
    }
  }, [insight, orderId, patientId, queryClient, allTests]);

  useEffect(() => {
    if (error) {
      const is404 = (error as any)?.response?.status === 404;
      if (!is404) {
        toast.error("AI Analysis Interrupted", {
          description: "We couldn't process this report. Please verify your Gemini API key."
        });
      }
    }
  }, [error]);

  if (!insight && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
        <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200">
          <Sparkles className="h-10 w-10 text-slate-300" />
        </div>
        <div className="max-w-sm">
          <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">AI Diagnostic Center</h3>
          <p className="text-slate-500 text-sm mt-2">Go to <span className="font-bold text-primary">My Reports</span> and click "Run AI Analysis" on any finalized report to generate deep medical insights.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-8 animate-in fade-in duration-700">
        <div className="relative">
          <div className="h-24 w-24 rounded-[32px] bg-primary/10 flex items-center justify-center animate-pulse">
            <Sparkles size={40} className="text-primary" />
          </div>
          <div className="absolute inset-0 h-24 w-24 rounded-[32px] border-4 border-primary border-t-transparent animate-spin" />
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">We are getting your analysis ready</h3>
          <p className="text-slate-400 text-sm font-medium italic tracking-wide">"Our AI is scanning 50+ biomarkers to generate your health profile..."</p>
        </div>

        <div className="flex items-center gap-2">
           {[1, 2, 3].map(i => (
             <div key={i} className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
           ))}
        </div>
      </div>
    );
  }

  if (error || !insight) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
        <AlertTriangle className="h-16 w-16 text-rose-500" />
        <div>
          <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Analysis Failed</h3>
          <p className="text-slate-500 text-sm mt-2 font-medium">We couldn't process this report. Please check your API key or the report quality.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 max-w-6xl mx-auto pb-20">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
            <Sparkles size={12} /> Personalized Health Analysis
          </div>
          <h1 className="text-4xl font-black text-slate-800 leading-none tracking-tighter uppercase">AI Diagnostics <br/> <span className="text-primary">& Insights</span></h1>
          <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-xl">{insight.summary}</p>
        </div>
        <HealthScore score={insight.overallHealthScore} />
      </div>

      {/* AI Detailed Summary Points */}
      {insight.summaryPoints && insight.summaryPoints.length > 0 && (
        <div className="p-8 rounded-[40px] bg-slate-900 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles size={120} />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <Sparkles size={18} />
              </div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">AI Clinical Deep-Dive</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              {insight.summaryPoints.map((point: string, i: number) => (
                <div key={i} className="flex gap-4 items-start group/point">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0 group-hover/point:scale-150 transition-transform" />
                  <p className="text-[13px] font-medium leading-relaxed text-slate-300">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Risk & Critical Findings Section */}
      <div className="space-y-8">
        <div className="space-y-6">
           <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
             <Activity size={14} className="text-primary" /> Health Risk Profile
           </h4>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <RiskMeter label="Diabetes Risk" risk={insight.riskMeters.diabetes} />
              <RiskMeter label="Heart Health" risk={insight.riskMeters.heart} />
              <RiskMeter label="Thyroid Function" risk={insight.riskMeters.thyroid} />
              <RiskMeter label="Anemia Risk" risk={insight.riskMeters.anemia} />
              <RiskMeter label="Liver Profile" risk={insight.riskMeters.liver} />
              <RiskMeter label="Kidney Health" risk={insight.riskMeters.kidney} />
           </div>

           {/* Medical Disclaimer */}
           <div className="mt-4 p-6 rounded-3xl bg-slate-50 border border-slate-100 flex items-start gap-4">
              <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                <Info size={18} />
              </div>
              <p className="text-xs font-medium text-slate-500 leading-relaxed italic">
                <span className="font-black uppercase tracking-widest text-[10px] text-slate-400 block mb-1">Medical Disclaimer</span>
                These AI-generated insights are for informational purposes only. Results may vary based on report quality. Please consult a qualified medical professional for a formal diagnosis and treatment plan.
              </p>
           </div>
        </div>

        {/* Attention Items (Sidewise) */}
        <div className="space-y-6">
           <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
             <AlertTriangle size={14} className="text-rose-500" /> Critical Findings
           </h4>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {insight.attentionRequired.map((item: any, i: number) => (
                <div key={i} className={cn(
                  "p-5 rounded-2xl border transition-all shadow-sm",
                  item.severity === "HIGH" ? "bg-rose-50 border-rose-100" : "bg-amber-50 border-amber-100"
                )}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn("text-xs font-black", item.severity === "HIGH" ? "text-rose-800" : "text-amber-800")}>{item.parameter}</span>
                    <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-black", item.severity === "HIGH" ? "bg-rose-200 text-rose-800" : "bg-amber-200 text-amber-800")}>{item.value}</span>
                  </div>
                  <p className="text-[11px] font-medium leading-relaxed text-slate-600 italic">"{item.observation}"</p>
                </div>
              ))}
              {insight.attentionRequired.length === 0 && (
                <div className="col-span-full p-8 rounded-3xl border border-emerald-100 bg-emerald-50/50 text-center space-y-2">
                  <ShieldCheck className="mx-auto h-8 w-8 text-emerald-500" />
                  <p className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">All Parameters Optimal</p>
                </div>
              )}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Remedies */}
        <div className="space-y-6">
           <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
             <Sparkles size={14} className="text-primary" /> Personalized Remedies
           </h4>
           <div className="grid grid-cols-1 gap-4">
              <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm flex items-start gap-6 group hover:shadow-xl transition-all">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 group-hover:scale-110 transition-transform">
                  <Utensils size={24} />
                </div>
                <div className="space-y-4">
                  <h5 className="font-black text-slate-800 uppercase text-xs tracking-widest">Nutrition & Diet</h5>
                  <div className="flex flex-wrap gap-2">
                    {[...insight.naturalRemedies.fruits, ...insight.naturalRemedies.vegetables].map((food: string) => (
                      <span key={food} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-600">{food}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm flex items-start gap-6 group hover:shadow-xl transition-all">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 group-hover:scale-110 transition-transform">
                  <Dumbbell size={24} />
                </div>
                <div className="space-y-4">
                  <h5 className="font-black text-slate-800 uppercase text-xs tracking-widest">Recommended Lifestyle</h5>
                  <div className="flex flex-wrap gap-2">
                    {insight.naturalRemedies.exercises.map((ex: string) => (
                      <span key={ex} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-600">{ex}</span>
                    ))}
                  </div>
                </div>
              </div>
           </div>
        </div>

        {/* Recommended Tests */}
        <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
               <Info size={14} className="text-primary" /> Recommended Next Steps
             </h4>
             {selectedRecommendations.length > 0 && (
               <button 
                 onClick={() => {
                   const testIds = selectedRecommendations.join(',');
                   navigate(`/patient/${patientId}/book?testIds=${testIds}`);
                 }}
                 className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all animate-in slide-in-from-right"
               >
                 Book Now <ShoppingBag size={14} />
               </button>
             )}
           </div>

           <div className="space-y-4">
              {insight.nextSteps.map((step: any, i: number) => {
                // Improved Matching Logic
                const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
                const matchingTest = allTests?.find((t: any) => {
                  const tName = normalize(t.name);
                  const sName = normalize(step.testName);
                  return tName.includes(sName) || sName.includes(tName);
                });

                const isSelected = matchingTest && selectedRecommendations.includes(matchingTest.id);

                return (
                  <div 
                    key={i} 
                    onClick={() => {
                      if (matchingTest) {
                        setSelectedRecommendations(prev => 
                          prev.includes(matchingTest.id) 
                            ? prev.filter(id => id !== matchingTest.id)
                            : [...prev, matchingTest.id]
                        );
                      }
                    }}
                    className={cn(
                      "group relative bg-white border p-5 rounded-3xl shadow-sm transition-all cursor-pointer",
                      isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-slate-100 hover:border-primary"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-2xl flex items-center justify-center transition-all",
                          isSelected ? "bg-primary text-white" : "bg-slate-50 text-primary group-hover:bg-primary group-hover:text-white"
                        )}>
                          {isSelected ? <Check size={18} /> : <FileText size={18} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-sm font-black text-slate-800">{step.testName}</h5>
                            {matchingTest && (
                              <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100 uppercase tracking-tighter">Verified Test</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">{step.reason}</p>
                        </div>
                      </div>
                      
                      {matchingTest ? (
                        <div className={cn(
                          "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                          isSelected ? "bg-primary text-white" : "bg-slate-50 text-slate-400 group-hover:bg-slate-800 group-hover:text-white"
                        )}>
                          {isSelected ? "Selected" : "Select"}
                        </div>
                      ) : (
                        <ArrowRight size={18} className="text-slate-200 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      )}
                    </div>
                  </div>
                );
              })}
           </div>
        </div>
      </div>
    </div>
  );
};

export default HealthInsights;
