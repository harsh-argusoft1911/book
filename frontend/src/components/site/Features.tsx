import nutrition from "@/assets/feature-nutrition.jpg";
import { Play } from "lucide-react";

const Features = () => (
  <section className="container mt-16">
    <div className="grid gap-5 md:grid-cols-4">
      <div className="reveal md:col-span-2 rounded-3xl bg-surface-yellow p-6 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-card">
        <span className="inline-block rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">Primer</span>
        <h3 className="mt-3 text-2xl font-bold text-primary leading-tight">Nutrition and<br />Mental Health</h3>
        <p className="mt-2 text-sm text-primary/70">The five-set provides a unique experience and beautiful illustrations that stand out.</p>
        <div className="mt-4 flex items-center gap-3">
          <button className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground transition-all duration-300 hover:scale-110 hover:bg-primary-glow active:scale-95 glow-ring">
            <Play className="h-4 w-4 fill-current" />
          </button>
          <img src={nutrition} alt="" loading="lazy" width={640} height={512} className="ml-auto h-24 w-32 rounded-xl object-cover" />
        </div>
      </div>

      <div className="reveal rounded-3xl bg-primary p-6 text-primary-foreground shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-card" style={{ transitionDelay: "120ms" }}>
        <span className="inline-block rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">Learning</span>
        <h3 className="mt-3 text-xl font-bold leading-tight">Healthy Habits for a Happy Heart</h3>
        <p className="mt-2 text-xs text-primary-foreground/70">Daily routines that protect your most important muscle.</p>
      </div>

      <div className="reveal grid grid-rows-2 gap-5" style={{ transitionDelay: "240ms" }}>
        <div className="rounded-3xl bg-surface-mint p-5 shadow-soft text-center grid place-items-center transition-transform duration-500 hover:scale-105">
          <div>
            <div className="text-3xl font-extrabold text-primary">04</div>
            <div className="text-xs text-primary/70">Years Experience</div>
          </div>
        </div>
        <div className="rounded-3xl bg-surface-pink p-5 shadow-soft text-center grid place-items-center transition-transform duration-500 hover:scale-105">
          <div>
            <div className="text-3xl font-extrabold text-primary">120k</div>
            <div className="text-xs text-primary/70">Happy Customers</div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default Features;
