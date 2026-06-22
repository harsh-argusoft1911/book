import { useState } from "react";
import { Outlet } from "react-router-dom";
import PathologySidebar from "./PathologySidebar";
import { cn } from "@/lib/utils";
import { Bell, User, Settings, LogOut, ChevronDown, Menu } from "lucide-react";
import { useParams } from "react-router-dom";

const PathologyHeader = ({ onMenuClick }: { onMenuClick?: () => void }) => {
  const { labId } = useParams();
  const [showMenu, setShowMenu] = useState(false);

  const labName = labId === 'L-001' ? 'BookMyPathology' : labId === 'L-002' ? 'City Pathology' : 'Lab Portal';

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
      <button 
        onClick={onMenuClick}
        className="md:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all"
      >
        <Menu size={20} />
      </button>
      <div className="flex-1" />

      <div className="flex items-center gap-6">
        {/* Notification Bell */}
        <div className="flex items-center gap-4 border-r border-slate-100 pr-6">
          <button className="relative w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 border-2 border-white rounded-full" />
          </button>
        </div>

        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-3 p-1 rounded-full hover:bg-slate-50 transition-all"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800 leading-tight">Dr. Sarah Wilson</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{labName}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-white shadow-sm flex items-center justify-center text-primary overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150"
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <ChevronDown size={14} className={cn("text-slate-400 transition-transform", showMenu && "rotate-180")} />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-slate-100 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
                <Settings size={16} /> Settings
              </button>
              <button onClick={() => window.location.href = '/'} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 transition-all">
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const PathologyLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[45] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <PathologySidebar 
        isCollapsed={isCollapsed} 
        onToggle={() => setIsCollapsed(!isCollapsed)} 
        isMobileOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      
      <div 
        className={cn(
          "flex flex-col flex-1 transition-all duration-300 min-w-0",
          isCollapsed ? "md:ml-20" : "md:ml-64",
          "ml-0" // No padding on mobile as sidebar is a drawer
        )}
      >
        <PathologyHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PathologyLayout;
