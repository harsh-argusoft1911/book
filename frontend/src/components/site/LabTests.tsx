import { ArrowRight, Sparkles, Activity, Thermometer, Weight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const packages = [
  { 
    title: "Complete Body Checkup", 
    desc: "CBC + LFT + KFT + CARDIO + THYROID", 
    normalPrice: 5500, 
    ourPrice: 2499,
    icon: Activity,
    bg: "bg-blue-500",
    textColor: "text-white"
  },
  { 
    title: "Hormonal Health Package", 
    desc: "Thyroid + Testosterone + PCOS + Vitamin D + Prolactin Level", 
    normalPrice: 2500, 
    ourPrice: 999,
    icon: Thermometer,
    bg: "bg-emerald-500",
    textColor: "text-white"
  },
  { 
    title: "Weight Package", 
    desc: "TSH + Insulin + PCOD Profile + Testosterone", 
    normalPrice: 2900, 
    ourPrice: 1199,
    icon: Weight,
    bg: "bg-purple-500",
    textColor: "text-white"
  },
];

const LabTests = () => (
  <div className="space-y-10">
    <div className="flex items-end justify-between gap-4">
      <h2 className="reveal text-2xl md:text-5xl font-black text-white leading-tight">
        OUR CURATED<br />HEALTH PACKAGES
      </h2>
      <Link to="/login" className="reveal group inline-flex items-center gap-2 text-xs font-black tracking-widest text-emerald-400 uppercase">
        VIEW ALL PACKAGES
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>

    <div className="grid gap-8 md:grid-cols-3">
      {packages.map((pkg, i) => {
        const savings = pkg.normalPrice - pkg.ourPrice;
        const discount = Math.round((savings / pkg.normalPrice) * 100);

        return (
          <div
            key={pkg.title}
            className={cn(
              "reveal group relative overflow-hidden rounded-[40px] p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl shadow-xl",
              pkg.bg
            )}
            style={{ transitionDelay: `${i * 100}ms` }}
          >
            {/* Background Accent */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
            
            <div className="relative z-10 flex flex-col h-full space-y-6">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                  <pkg.icon size={24} />
                </div>
                <div className="px-3 py-1 rounded-full bg-white text-[#161F5A] text-[10px] font-black uppercase tracking-tighter shadow-sm">
                  {discount}% OFF
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white leading-tight">
                  {pkg.title}
                </h3>
                <p className="text-white/70 text-xs font-bold uppercase tracking-wider leading-relaxed">
                  {pkg.desc}
                </p>
              </div>

              <div className="pt-8 mt-auto border-t border-white/10 flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white/50 line-through text-sm font-bold">₹{pkg.normalPrice}</span>
                    <span className="text-white text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                      Save ₹{savings}
                    </span>
                  </div>
                  <div className="text-4xl font-black text-white">₹{pkg.ourPrice}</div>
                </div>
                
                <Link 
                  to="/login"
                  className="flex items-center gap-1 text-[10px] font-black text-white uppercase tracking-widest hover:underline transition-all"
                >
                  Book Now <Sparkles size={12} className="text-amber-300" />
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default LabTests;
