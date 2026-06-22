import { Heart, MapPin, Search, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-lg shadow-soft" : "bg-background"
      }`}
    >
      <div className="container flex items-center justify-between gap-6 py-4">
        <Link to="/" className="flex items-center gap-4 group">
          <img src="/logo.png" alt="BookMyPathology" className="h-12 w-auto transition-transform duration-300 group-hover:scale-110" />
          <span className="text-3xl font-black tracking-tighter text-[#161F5A]">BookMyPathology</span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-xs md:text-sm font-black text-[#161F5A] px-5 md:px-6 py-2 md:py-2.5 rounded-full border-2 border-[#161F5A]/10 hover:bg-[#161F5A] hover:text-white transition-all duration-300"
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
