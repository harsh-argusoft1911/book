import { Wand2, Home, Users, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { 
    title: "Upto 50% Discount", 
    desc: "Huge savings on all laboratory tests and health packages.", 
    icon: Trophy, 
    bg: "bg-amber-50",
    iconBg: "bg-amber-500",
    accent: "text-amber-600"
  },
  { 
    title: "AI Lab Analytics", 
    desc: "Get deep clinical insights from your reports instantly.", 
    icon: Wand2, 
    bg: "bg-blue-50",
    iconBg: "bg-blue-500",
    accent: "text-blue-600"
  },
  { 
    title: "Home Sample Pickup", 
    desc: "Professional lab technicians at your doorstep.", 
    icon: Home, 
    bg: "bg-emerald-50",
    iconBg: "bg-emerald-500",
    accent: "text-emerald-600"
  },
  { 
    title: "Health Rewards", 
    desc: "Earn points and discounts for every test you book.", 
    icon: Trophy, 
    bg: "bg-rose-50",
    iconBg: "bg-rose-500",
    accent: "text-rose-600"
  },
];

const Services = () => (
  <section className="container mt-16">
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {items.map((it, i) => (
        <div
          key={it.title}
          className={cn(
            "group cursor-pointer rounded-[32px] p-8 transition-all duration-500 hover:-translate-y-2 border border-transparent hover:border-slate-100 shadow-sm hover:shadow-xl",
            it.bg
          )}
        >
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
            it.iconBg
          )}>
            <it.icon size={24} />
          </div>
          <h3 className="text-lg font-black leading-tight text-slate-800 mb-2">{it.title}</h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">{it.desc}</p>
          
          <div className="mt-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <span className={it.accent}>Learn More</span>
            <div className={cn("w-5 h-[2px]", it.iconBg)} />
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default Services;
