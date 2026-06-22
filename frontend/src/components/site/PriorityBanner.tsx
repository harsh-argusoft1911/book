import banner from "@/assets/priority-banner.jpg";
import { ArrowRight } from "lucide-react";

const PriorityBanner = () => (
  <section className="container mt-16">
    <div className="reveal relative overflow-hidden rounded-3xl shadow-card">
      <img src={banner} alt="People exercising" loading="lazy" width={1536} height={640} className="h-64 md:h-80 w-full object-cover transition-transform duration-700 hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-primary-foreground">
        <p className="text-xs uppercase tracking-[0.3em] opacity-80">BookMyPathology's mission</p>
        <h2 className="mt-2 text-3xl md:text-5xl font-bold">Smarter diagnostics, healthier lives</h2>
        <button className="group btn-shine mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-cta px-6 py-3 text-sm font-bold text-accent-foreground shadow-glow transition-transform duration-300 hover:scale-105 active:scale-95">
        Get Started
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  </section>
);

export default PriorityBanner;
