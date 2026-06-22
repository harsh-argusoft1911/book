import { 
  LayoutDashboard, 
  CalendarRange, 
  ClipboardList, 
  Users, 
  Settings, 
  LogOut,
  ChevronRight,
  ChevronLeft,
  Microscope,
  TrendingUp,
  Package,
  PlusSquare,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation, useParams } from "react-router-dom";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen?: boolean;
  onClose?: () => void;
}

const PathologySidebar = ({ isCollapsed, onToggle, isMobileOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const { labId } = useParams();

  const labName = labId === 'L-001' ? 'BookMyPathology' : labId === 'L-002' ? 'City Pathology' : 'Lab Portal';
  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: `/pathology/${labId}/dashboard` },
    { icon: ClipboardList, label: "Bookings", href: `/pathology/${labId}/bookings` },
    { icon: PlusSquare, label: "Walk-in Booking", href: `/pathology/${labId}/walkin` },
    { icon: CalendarRange, label: "Manage", href: `/pathology/${labId}/manage` },
    // { icon: Users, label: "Lab Staff", href: `/pathology/${labId}/staff` },
    // { icon: TrendingUp, label: "Earnings", href: `/pathology/${labId}/earnings` },
    // { icon: Package, label: "Inventory", href: `/pathology/${labId}/inventory` },
  ];

  return (
    <div className={cn(
      "h-screen bg-white border-r border-slate-100 flex flex-col fixed left-0 top-0 z-[50] transition-all duration-300 shadow-sm",
      isCollapsed ? "md:w-20" : "md:w-64",
      // Mobile behavior
      isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      "w-64" // Always full width on mobile drawer
    )}>
      <div className={cn("p-6 flex-1 flex flex-col", isCollapsed && "px-3")}>

        {/* Brand Header */}
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
              <h2 className="text-[14px] font-black text-[#161F5A] truncate leading-tight">BookMyPathology</h2>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black truncate">{labName}</p>
            </div>
          )}
          {/* Toggle Button */}
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

        {/* Nav Items */}
        <div className="space-y-1.5 flex-1 overflow-y-auto no-scrollbar">
          {!isCollapsed && (
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 animate-in fade-in duration-500">Main Menu</p>
          )}
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.label}
                to={item.href}
                onClick={onClose}
                title={isCollapsed ? item.label : ""}
                className={cn(
                  "flex items-center rounded-xl transition-all duration-200 group relative",
                  isCollapsed ? "p-3 justify-center mb-1" : "px-3 py-2.5 gap-3",
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-slate-500 hover:bg-slate-50 hover:text-primary"
                )}
              >
                <item.icon
                  size={isCollapsed ? 20 : 18}
                  className={cn(isActive ? "text-white" : "text-slate-400 group-hover:text-primary transition-colors")}
                />
                {!isCollapsed && (
                  <span className="animate-in fade-in slide-in-from-left-2 duration-300 truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className={cn("p-6 border-t border-slate-50", isCollapsed && "px-3")}>
        {/* <Link
          to={`/pathology/${labId}/settings`}
          title={isCollapsed ? "Settings" : ""}
          className={cn(
            "flex items-center rounded-xl text-sm font-medium transition-all mb-1",
            isCollapsed ? "p-3 justify-center" : "px-3 py-2.5 gap-3",
            "text-slate-500 hover:bg-slate-50"
          )}
        >
          <Settings size={isCollapsed ? 20 : 18} className="text-slate-400" />
          {!isCollapsed && <span className="truncate">Settings</span>}
        </Link> */}
        <button
          onClick={() => window.location.href = '/'}
          title={isCollapsed ? "Logout" : ""}
          className={cn(
            "flex items-center rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 transition-all w-full",
            isCollapsed ? "p-3 justify-center" : "px-3 py-2.5 gap-3"
          )}
        >
          <LogOut size={isCollapsed ? 20 : 18} />
          {!isCollapsed && <span className="truncate">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default PathologySidebar;
