import avatar from "@/assets/avatar-1.jpg";
import { Star } from "lucide-react";

const Reviews = () => (
  <section className="container mt-20 text-center">
    <h2 className="reveal text-3xl md:text-4xl font-bold text-primary">
      Our doctors and clinics have earned<br />over 5,000+ reviews on Google!
    </h2>
    <div className="reveal mt-4 flex items-center justify-center gap-1 text-accent">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-5 w-5 fill-current" />
      ))}
    </div>
    <p className="reveal mt-1 text-sm text-muted-foreground">Average Google Rating is 4.8</p>

    <div className="reveal mx-auto mt-10 max-w-2xl rounded-2xl bg-secondary p-6 text-left shadow-soft transition-all duration-500 hover:shadow-card">
      <div className="flex items-start gap-4">
        <img src={avatar} alt="" loading="lazy" width={512} height={512} className="h-12 w-12 rounded-full object-cover" />
        <div>
          <h4 className="font-semibold text-primary">Esther Howard</h4>
          <p className="text-xs text-muted-foreground">Patient</p>
          <p className="mt-2 text-sm text-foreground/80">
            I had a great experience at this healthcare clinic. I was seen quickly,
            and the doctor was able to diagnose and treat my condition.
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default Reviews;
