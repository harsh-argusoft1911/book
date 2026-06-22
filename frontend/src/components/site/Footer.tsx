import { Heart, Instagram, Twitter, Facebook, MapPin, Phone, Mail, Headphones } from "lucide-react";
import { Link } from "react-router-dom";

const cols = [
  { title: "Company", links: ["BookMyPathology for Business", "2025 Career Report", "About", "Press", "Careers", "Medical Trust", "Contact"] },
  { title: "Community", links: ["BookMyPathology for Mentors", "Mentors", "BookMyPathology Method Browser", "Explore Templates"] },
  { title: "Resource Support", links: ["Help Centre", "Getting Started", "Licensee Pro", "Releases & New Era", "FAQs", "Report a violation"] },
  { title: "Trust & Legal", links: ["Terms & Conditions", "Privacy Notice", "Privacy Policy", "Trust Centre", "Cookie Preferences"] },
];

const Footer = () => (
  <footer className="mt-32 border-t border-slate-100 bg-white">
    <div className="container py-20">
      <div className="grid gap-12 md:grid-cols-12">
        {/* Brand Section */}
        <div className="md:col-span-4 space-y-6">
          <Link to="/" className="flex items-center gap-4 group">
            <img src="/logo.png" alt="BookMyPathology" className="h-16 w-auto transition-transform duration-300 group-hover:scale-110" />
            <span className="text-4xl font-black tracking-tighter text-[#161F5A]">BookMyPathology</span>
          </Link>
          <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
            Empowering patients with AI-driven diagnostics and seamless lab services. Experience the future of healthcare today.
          </p>
          <div className="flex gap-4">
            {[Instagram, Twitter, Facebook].map((Icon, i) => (
              <a key={i} href="#" className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-[#161F5A] hover:text-white transition-all duration-300">
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        {/* Links Section */}
        <div className="md:col-span-2 space-y-6">
          <h4 className="text-sm font-black text-[#161F5A] uppercase tracking-widest">Services</h4>
          <ul className="space-y-4">
            {["Lab Tests", "AI Analysis", "Home Collection", "Specialists"].map((item) => (
              <li key={item}>
                <a href="#" className="text-sm text-slate-500 hover:text-[#161F5A] font-medium transition-colors">{item}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Section */}
        <div className="md:col-span-6 space-y-8">
          <h4 className="text-sm font-black text-[#161F5A] uppercase tracking-widest text-right hidden md:block">Get in Touch</h4>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="text-emerald-500 mt-1 shrink-0" size={18} />
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Our Location</div>
                  <div className="text-sm font-bold text-slate-700">B-3/42, Vibhuti Khand, Gomti Nagar, Lucknow 226016</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="text-blue-500 mt-1 shrink-0" size={18} />
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Us</div>
                  <div className="text-sm font-bold text-slate-700">zenmedicalservices05@gmail.com</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="text-primary mt-1 shrink-0" size={18} />
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Direct Line</div>
                  <div className="text-sm font-bold text-slate-700">+91-7752845151</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Headphones className="text-rose-500 mt-1 shrink-0" size={18} />
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Care</div>
                  <div className="text-sm font-bold text-slate-700">+91-7754845151</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-20 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          © 2026 ZEN MEDICAL SERVICES. ALL RIGHTS RESERVED.
        </p>
        <div className="flex gap-6">
          <a href="#" className="text-[11px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">Privacy Policy</a>
          <a href="#" className="text-[11px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">Terms of Service</a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
