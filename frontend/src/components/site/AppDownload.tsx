import app from "@/assets/app-mockup.png";

const AppDownload = () => (
  <section className="container mt-20 grid gap-6 md:grid-cols-5">
    <div className="reveal md:col-span-3 relative overflow-hidden rounded-3xl bg-surface-yellow p-6 shadow-soft">
      <img
        src={app}
        alt="BookMyPathology mobile app"
        loading="lazy"
        width={896}
        height={768}
        className="mx-auto h-64 md:h-80 w-auto object-contain transition-transform duration-700 hover:-translate-y-2"
      />
    </div>
    <div className="reveal md:col-span-2 rounded-3xl bg-surface-pink p-8 shadow-soft flex flex-col justify-center" style={{ transitionDelay: "150ms" }}>
      <h3 className="text-2xl md:text-3xl font-bold text-primary leading-tight">
        Download Our<br />Healthcare App for<br />Easy Access
      </h3>
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="btn-shine inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform duration-300 hover:scale-105 active:scale-95">
           App Store
        </button>
        <button className="btn-shine inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform duration-300 hover:scale-105 active:scale-95">
          ▶ Google Play
        </button>
      </div>
    </div>
  </section>
);

export default AppDownload;
