import p1 from "@/assets/product-1.jpg";
import p2 from "@/assets/product-2.jpg";
import p3 from "@/assets/product-3.jpg";
import p4 from "@/assets/product-4.jpg";
import { ArrowRight, Plus, Star } from "lucide-react";

const products = [
  { name: "Instant Supplement Health Capsule", price: "$54.20", img: p1, tag: "30%" },
  { name: "Anti-bacterial pillow XX", price: "$140.00", img: p2, tag: "20%" },
  { name: "Wellness Multi Vitamins & Biotin Capsules", price: "$80.00", img: p3, tag: "30%" },
  { name: "Antibacterial Liquid Hand Soap", price: "$80.00", img: p4 },
];

const Deals = () => (
  <>
    <div className="mt-16 flex items-end justify-between gap-4 border-t border-white/10 pt-16">
      <h2 className="reveal text-2xl md:text-4xl font-bold text-primary-foreground">
        Today's best deals<br />for you!
      </h2>
      <a href="#" className="reveal group inline-flex items-center gap-1 text-xs font-semibold tracking-wider text-accent">
        SEE ALL PRODUCTS
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
      </a>
    </div>

    <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4">
      {products.map((p, i) => (
        <div
          key={i}
          className="reveal group relative rounded-2xl bg-background p-4 transition-all duration-500 hover:-translate-y-2 hover:shadow-glow"
          style={{ transitionDelay: `${i * 80}ms` }}
        >
          {p.tag && (
            <span className="absolute left-3 top-3 z-10 rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
              {p.tag} OFF
            </span>
          )}
          <div className="aspect-square overflow-hidden rounded-xl bg-secondary">
            <img src={p.img} alt={p.name} loading="lazy" width={512} height={512} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-0.5 text-accent">
              {Array.from({ length: 5 }).map((_, k) => (
                <Star key={k} className="h-3 w-3 fill-current" />
              ))}
            </div>
            <h4 className="mt-1 text-sm font-semibold text-primary line-clamp-2">{p.name}</h4>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-base font-bold text-primary">{p.price}</span>
              <button className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground transition-all duration-300 hover:scale-110 hover:bg-primary-glow active:scale-90">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </>
);

export default Deals;
