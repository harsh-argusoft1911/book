import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useReveal } from "@/hooks/use-reveal";
import apiClient from "@/api/apiClient";
import { cn } from "@/lib/utils";
import { Loader2, Plus, Sparkles } from "lucide-react";

interface Test {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
}

const allowedCategories = ["Liver", "Kidney", "Routine", "Thyroid", "Cardiac"];

const pastelColors = [
  { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100", accent: "bg-blue-200" },
  { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", accent: "bg-emerald-200" },
  { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100", accent: "bg-amber-200" },
  { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-100", accent: "bg-purple-200" },
  { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-100", accent: "bg-cyan-200" },
  { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-100", accent: "bg-indigo-200" },
  { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-100", accent: "bg-teal-200" },
];

const Doctors = () => {
  const [activeCategory, setActiveCategory] = useState("All");

  const { data: tests = [], isLoading } = useQuery<Test[]>({
    queryKey: ['tests'],
    queryFn: async () => {
      const res = await apiClient.get('/tests');
      return res.data;
    }
  });

  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get('/tests/categories');
      return res.data.filter((cat: string) =>
        allowedCategories.some(allowed => cat.toLowerCase().includes(allowed.toLowerCase()))
      );
    }
  });

  const filteredTests = (activeCategory === "All"
    ? tests
    : tests.filter(t => t.category === activeCategory)
  ).slice(0, 3);

  useReveal([activeCategory, tests]);

  return (
    <section className="container mt-24 mb-32">
      <div className="reveal">
        <h2 className="text-3xl md:text-4xl font-black text-[#161F5A] leading-tight">
          Expert care starts<br />with a simple booking
        </h2>
      </div>

      {/* Categories Toggle */}
      <div className="mt-8 flex flex-wrap gap-2 reveal">
        <button
          onClick={() => setActiveCategory("All")}
          className={cn(
            "rounded-full px-5 py-2.5 text-xs font-black tracking-widest transition-all uppercase",
            activeCategory === "All"
              ? "bg-[#161F5A] text-white shadow-xl shadow-blue-900/20"
              : "bg-slate-50 text-slate-400 hover:bg-slate-100"
          )}
        >
          All Tests
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "rounded-full px-5 py-2.5 text-xs font-black tracking-widest transition-all uppercase",
              activeCategory === cat
                ? "bg-[#161F5A] text-white shadow-xl shadow-blue-900/20"
                : "bg-slate-50 text-slate-400 hover:bg-slate-100"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-20 flex justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTests.map((test, i) => {
            const color = pastelColors[i % pastelColors.length];
            const originalPrice = Math.round(test.price * 1.5);
            const savings = originalPrice - test.price;

            return (
              <div
                key={test.id}
                className={cn(
                  "reveal group relative overflow-hidden rounded-[40px] p-8 border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl",
                  color.bg,
                  color.border
                )}
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                {/* Decorative Element */}
                <div className={cn("absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20", color.accent)} />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter", color.accent, color.text)}>
                      {test.category}
                    </div>
                  </div>

                  <h4 className="text-xl font-black text-[#161F5A] mb-3 group-hover:text-primary transition-colors">
                    {test.name}
                  </h4>

                  <p className="text-slate-500 text-sm font-medium mb-8 flex-1 leading-relaxed">
                    {test.description || "Comprehensive diagnostic test with precise accuracy and digital report delivery."}
                  </p>

                  <div className="mt-auto pt-6 border-t border-black/5 flex items-end justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 line-through text-sm font-bold">₹{originalPrice}</span>
                        <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                          Save ₹{savings}
                        </span>
                      </div>
                      <div className="text-2xl font-black text-[#161F5A]">₹{test.price}</div>
                    </div>

                    <Link
                      to="/login"
                      className="flex items-center gap-1 text-[10px] font-black text-[#161F5A] uppercase tracking-widest hover:underline transition-all"
                    >
                      Book Now <Sparkles size={12} className="text-amber-500" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default Doctors;
