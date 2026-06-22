import { useState, useEffect } from "react";
import { NavLink, useParams, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  FileText, 
  Activity, 
  Users, 
  Trophy, 
  LogOut,
  User,
  Microscope,
  ChevronRight,
  ChevronLeft,
  PlusCircle,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/api/apiClient";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen?: boolean;
  onClose?: () => void;
}

const DashboardSidebar = ({ isCollapsed, onToggle, isMobileOpen, onClose }: SidebarProps) => {
  const { patientId } = useParams();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);

  const { data: stats } = useQuery({
    queryKey: ['patientStats', patientId],
    queryFn: async () => {
      const response = await apiClient.get(`/patients/${patientId}/stats`);
      return response.data;
    }
  });

  useEffect(() => {
    const updateCartCount = () => {
      const savedDraft = localStorage.getItem('bookingDraft');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setCartCount(draft.tests?.length || 0);
        } catch (e) {
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };

    updateCartCount();
    window.addEventListener('cart-updated', updateCartCount);
    window.addEventListener('storage', updateCartCount);

    return () => {
      window.removeEventListener('cart-updated', updateCartCount);
      window.removeEventListener('storage', updateCartCount);
    };
  }, []);

  const navItems = [
    { name: "Dashboard", path: `/patient/${patientId}`, icon: LayoutDashboard },
    { name: "Book a Test", path: `/patient/${patientId}/book`, icon: PlusCircle },
    { name: "My Cart", path: `/patient/${patientId}/cart`, icon: ShoppingCart, badge: cartCount > 0 ? cartCount : null },
    { name: "My Reports", path: `/patient/${patientId}/reports`, icon: FileText },
    { name: "Health Insights", path: `/patient/${patientId}/insights`, icon: Activity },
    { name: "Saved Profiles", path: `/patient/${patientId}/profiles`, icon: Users },
    { name: "Rewards", path: `/patient/${patientId}/rewards`, icon: Trophy },
  ];

  return (
    <div 
      className={cn(
        "h-screen bg-white border-r border-slate-100 flex flex-col fixed left-0 top-0 z-[50] transition-all duration-300 shadow-sm",
        isCollapsed ? "md:w-20" : "md:w-64",
        // Mobile behavior
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        "w-64" // Always full width on mobile drawer
      )}
    >
      <div className={cn("p-6 flex-1 flex flex-col overflow-hidden", isCollapsed && "px-3")}>
        {/* Brand/Logo Section */}
        <div className={cn(
          "flex items-center gap-3 bg-slate-50 rounded-xl border border-slate-100 mb-8 transition-all relative",
          isCollapsed ? "p-2 justify-center" : "px-3 py-3"
        )}>
          <div className={cn(
            "w-12 h-12 flex items-center justify-center shrink-0",
            isCollapsed && "w-11 h-11"
          )}>
            <img src="/logo.png" alt="BookMyPathology" className="h-full w-auto object-contain" />
          </div>
          {!isCollapsed && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300 overflow-hidden">
              <h2 className="text-[15px] font-black text-[#161F5A] truncate leading-tight">BookMyPathology</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black truncate">Patient Hub</p>
            </div>
          )}
          
          <button 
            onClick={onToggle}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all shadow-md z-[60] hidden md:flex"
          >
            {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>

          {/* Mobile Close Button */}
          <button 
            onClick={onClose}
            className="md:hidden absolute -right-12 top-4 h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-xl active:scale-95 transition-all"
          >
            <X size={20} />
          </button>
        </div>


        {/* Navigation Section */}
        <div className="space-y-1.5 flex-1 overflow-y-auto no-scrollbar pr-1">
          {!isCollapsed && (
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 animate-in fade-in duration-500">Patient Menu</p>
          )}
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.name === "Dashboard" && location.pathname === `/patient/${patientId}`);
            
            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.name === "Dashboard"}
                onClick={onClose}
                className={({ isActive }) => cn(
                  "flex items-center rounded-xl transition-all duration-200 group relative",
                  isCollapsed ? "p-2.5 justify-center mb-1" : "px-3 py-2 justify-between",
                  isActive 
                    ? "bg-primary text-white shadow-md shadow-primary/20" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-primary"
                )}
                title={isCollapsed ? item.name : ""}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon size={isCollapsed ? 19 : 17} className={cn(isActive ? "text-white" : "text-slate-400 group-hover:text-primary transition-colors")} />
                  {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300 truncate text-[13.5px]">{item.name}</span>}
                </div>
                {item.badge && (
                  <span className={cn(
                    "text-[10px] font-black px-1.5 py-0.5 rounded-full transition-all",
                    isCollapsed ? "absolute top-1 right-1 border-2 border-white" : "relative ml-2",
                    isActive ? "bg-white text-primary" : "bg-primary text-white shadow-lg shadow-primary/20"
                  )}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Footer Section */}
      <div className={cn("p-6 border-t border-slate-50 mt-auto", isCollapsed && "px-3")}>
        <NavLink
          to={`/patient/${patientId}/profile`}
          className={({ isActive }) => cn(
            "flex items-center rounded-xl text-sm font-medium transition-all mb-1",
            isCollapsed ? "p-2.5 justify-center" : "px-3 py-2 gap-3",
            isActive ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-500 hover:bg-slate-50"
          )}
          title={isCollapsed ? "My Profile" : ""}
        >
          <User size={isCollapsed ? 19 : 17} className={cn("transition-colors", isCollapsed ? "" : "text-slate-400")} />
          {!isCollapsed && <span className="truncate text-[13.5px]">My Profile</span>}
        </NavLink>
        <NavLink
          to="/"
          className={cn(
            "flex items-center rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 transition-all",
            isCollapsed ? "p-2.5 justify-center" : "px-3 py-2 gap-3"
          )}
          title={isCollapsed ? "Logout" : ""}
        >
          <LogOut size={isCollapsed ? 19 : 17} />
          {!isCollapsed && <span className="truncate text-[13.5px]">Logout</span>}
        </NavLink>
      </div>
    </div>
  );
};

export default DashboardSidebar;
