import { ArrowRight, ShieldCheck, Pill } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => (
  <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-slate-900 px-6">
    {/* Cloud Background Layer */}
    <div className="absolute inset-0 z-0">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-40 mix-blend-overlay animate-pulse" />
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 via-slate-900/80 to-slate-900" />
      
      {/* Animated Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-[120px] animate-float-delayed" />
    </div>

    <div className="container relative z-10">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-4 duration-1000">
          <ShieldCheck className="h-4 w-4 text-emerald-400" /> Changing how you look at your medical reports
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          Your Health, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Perfectly Calculated.</span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-300 font-medium animate-in fade-in zoom-in duration-1000 delay-500 leading-relaxed">
          Experience the future of diagnostics. AI-powered reports, smart insights, and seamless lab booking—all in one premium platform.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6 pt-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-700">
          
          <div className="flex -space-x-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
              </div>
            ))}
            <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-white/10 backdrop-blur-md flex items-center justify-center text-[10px] font-black text-white">
              10K+
            </div>
          </div>
          <div className="text-left">
            <div className="text-white font-black text-sm">Trusted by Thousands</div>
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Across the nation</div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default Hero;
