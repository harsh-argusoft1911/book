import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  DollarSign, 
  Megaphone, 
  PlusSquare, 
  Beaker, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft, 
  Bell, 
  ClipboardCheck, 
  Users, 
  Star, 
  Percent, 
  PlusCircle, 
  ArrowUpRight 
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import apiClient from "@/api/apiClient";
import { toast } from "sonner";
import LabsMapView from "./LabsMapView";
import LabLocationPicker, { LocationData } from "./LabLocationPicker";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  // Layout & Navigation State
  const [activeTab, setActiveTab] = useState<"financial" | "marketing" | "add_labs" | "view_labs">("financial");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  // Data States
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [labs, setLabs] = useState<any[]>([]);
  const [labsLoading, setLabsLoading] = useState(true);

  // Form States
  const [labForm, setLabForm] = useState({
    name: "",
    address: "",
    password: "",
    pincode: "",
    lat: null as number | null,
    lng: null as number | null,
    rating: "4.5",
    discount: "0",
    nabl: true,
    homeCollection: true
  });
  const [resetKey, setResetKey] = useState(0);
  const [submittingLab, setSubmittingLab] = useState(false);

  const [couponForm, setCouponForm] = useState({
    code: "",
    discountPercent: "",
    description: "",
    expiryDate: ""
  });
  const [submittingCoupon, setSubmittingCoupon] = useState(false);

  // Fetch functions
  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const res = await apiClient.get("/analytics/admin");
      setAnalytics(res.data);
    } catch (err) {
      toast.error("Failed to load global analytics");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      setCouponsLoading(true);
      const res = await apiClient.get("/coupons");
      setCoupons(res.data);
    } catch (err) {
      toast.error("Failed to load coupons");
    } finally {
      setCouponsLoading(false);
    }
  };

  const fetchLabs = async () => {
    try {
      setLabsLoading(true);
      const res = await apiClient.get("/labs");
      setLabs(res.data);
    } catch (err) {
      toast.error("Failed to load partner labs");
    } finally {
      setLabsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchCoupons();
    fetchLabs();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  // Lab Submission
  const handleLabSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labForm.name || !labForm.address || !labForm.password) {
      toast.error("Name, Address and Password are required");
      return;
    }
    try {
      setSubmittingLab(true);
      const result = await apiClient.post("/labs", {
        ...labForm,
        rating: parseFloat(labForm.rating),
        discount: parseInt(labForm.discount)
      });
      if (result.data.geocoded) {
        toast.success(`Lab registered! Login ID: ${result.data.id} — coordinates saved.`);
      } else {
        toast.success(`Lab registered! Login ID: ${result.data.id} — location coordinates could not be resolved.`);
      }
      setLabForm({
        name: "",
        address: "",
        password: "",
        pincode: "",
        lat: null,
        lng: null,
        rating: "4.5",
        discount: "0",
        nabl: true,
        homeCollection: true
      });
      setResetKey(prev => prev + 1);
      fetchLabs();
      fetchAnalytics();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create lab");
    } finally {
      setSubmittingLab(false);
    }
  };

  // Coupon Submission
  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.discountPercent) {
      toast.error("Code and Discount Percent are required");
      return;
    }
    try {
      setSubmittingCoupon(true);
      await apiClient.post("/coupons", couponForm);
      toast.success("Coupon code created successfully!");
      setCouponForm({
        code: "",
        discountPercent: "",
        description: "",
        expiryDate: ""
      });
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create coupon");
    } finally {
      setSubmittingCoupon(false);
    }
  };

  const menuItems = [
    { id: "financial", icon: DollarSign, label: "Financial Overview" },
    { id: "marketing", icon: MarketingIcon, label: "Marketing Portal" },
    { id: "add_labs", icon: PlusSquare, label: "Register Partner Lab" },
    { id: "view_labs", icon: Beaker, label: "Partner Labs Directory" }
  ] as const;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[45] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - modeled after PathologySidebar */}
      <div className={cn(
        "h-screen bg-white border-r border-slate-100 flex flex-col fixed left-0 top-0 z-[50] transition-all duration-300 shadow-sm",
        isCollapsed ? "md:w-20" : "md:w-64",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        "w-64"
      )}>
        <div className={cn("p-6 flex-1 flex flex-col", isCollapsed && "px-3")}>
          {/* Brand Header */}
          <div className={cn(
            "flex items-center gap-3 bg-slate-50 rounded-xl border border-slate-100 mb-8 transition-all relative",
            isCollapsed ? "p-2 justify-center" : "px-3 py-3"
          )}>
            <div className="w-12 h-12 flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="BookMyPathology" className="h-full w-auto object-contain" />
            </div>
            {!isCollapsed && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-300 overflow-hidden">
                <h2 className="text-[14px] font-black text-[#161F5A] truncate leading-tight">BookMyPathology</h2>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black truncate">Super Admin Portal</p>
              </div>
            )}
            {/* Toggle Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all shadow-md z-[60] hidden md:flex"
            >
              {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
            </button>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1.5 flex-1 overflow-y-auto no-scrollbar">
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Admin Dashboard</p>
            )}
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  title={isCollapsed ? item.label : ""}
                  className={cn(
                    "w-full flex items-center rounded-xl transition-all duration-200 group relative",
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
                    <span className="animate-in fade-in slide-in-from-left-2 duration-300 truncate font-semibold text-sm">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer Logout */}
        <div className={cn("p-6 border-t border-slate-50", isCollapsed && "px-3")}>
          <button
            onClick={handleLogout}
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

      {/* Main Content Area */}
      <div className={cn(
        "flex flex-col flex-1 transition-all duration-300 min-w-0",
        isCollapsed ? "md:ml-20" : "md:ml-64"
      )}>
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex-1 px-4 hidden md:block">
            <h1 className="text-xl font-bold text-slate-800 uppercase tracking-tight">
              {menuItems.find(m => m.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-r border-slate-100 pr-6">
              <button className="relative w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all">
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 border-2 border-white rounded-full" />
              </button>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                className="flex items-center gap-3 p-1 rounded-full hover:bg-slate-50 transition-all"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-800 leading-tight">Super Admin</p>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Control Portal</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-100 border-2 border-white shadow-sm flex items-center justify-center text-purple-600 overflow-hidden">
                  <ShieldCheck size={20} />
                </div>
                <ChevronDown size={14} className={cn("text-slate-400 transition-transform", showHeaderMenu && "rotate-180")} />
              </button>

              {showHeaderMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-slate-100 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 transition-all">
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Panels */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          
          {/* TAB 1: FINANCIAL OVERVIEW */}
          {activeTab === "financial" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {analyticsLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {/* Bento Grid Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {analytics?.stats.map((stat: any) => {
                      const Icon = stat.label.includes("Revenue") ? DollarSign : 
                                  stat.label.includes("Bookings") ? ClipboardCheck :
                                  stat.label.includes("Patients") ? Users : Beaker;
                      const color = stat.label.includes("Revenue") ? "bg-emerald-500" : 
                                   stat.label.includes("Bookings") ? "bg-blue-500" :
                                   stat.label.includes("Patients") ? "bg-orange-500" : "bg-purple-500";

                      return (
                        <Card key={stat.label} className="border-none shadow-soft hover:shadow-card transition-all duration-300 overflow-hidden group">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className={cn("p-3 rounded-2xl text-white shadow-lg", color)}>
                                <Icon size={24} />
                              </div>
                              <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
                                <ArrowUpRight size={14} />
                                {stat.change}
                              </div>
                            </div>
                            <div className="mt-4">
                              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                              <h3 className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</h3>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Charts & Top Labs */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Chart */}
                    <Card className="lg:col-span-2 border-none shadow-soft">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-bold text-slate-800">Global Gross Revenue (Last 7 Days)</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics?.earningsData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis 
                                dataKey="day" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                dy={10}
                              />
                              <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                tickFormatter={(value) => `₹${value}`}
                              />
                              <Tooltip 
                                cursor={{ fill: '#f8fafc' }}
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{payload[0].payload.day}</p>
                                        <p className="text-lg font-bold text-slate-800">₹{payload[0].value}</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar 
                                dataKey="amount" 
                                radius={[6, 6, 0, 0]} 
                                barSize={40}
                              >
                                {analytics?.earningsData.map((entry: any, index: number) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={index === 6 ? '#4f46e5' : '#818cf8'} 
                                    fillOpacity={index === 6 ? 1 : 0.6}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Top Performing Labs */}
                    <Card className="border-none shadow-soft">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold text-slate-800">Partner Rankings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {analytics?.topLabs.slice(0, 3).map((lab: any) => (
                          <div key={lab.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm">{lab.name}</h4>
                              <p className="text-xs text-slate-500 mt-0.5">{lab.bookingCount} bookings</p>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-black text-slate-800">₹{lab.totalEarnings.toLocaleString()}</span>
                              <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-amber-500 mt-0.5">
                                <Star size={10} fill="currentColor" /> {lab.rating.toFixed(1)}
                              </div>
                            </div>
                          </div>
                        ))}
                        {(!analytics?.topLabs || analytics?.topLabs.length === 0) && (
                          <div className="text-center text-slate-400 py-6 text-sm">No sales recorded yet.</div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: MARKETING PORTAL */}
          {activeTab === "marketing" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Create Promo Coupon */}
                <Card className="border-none shadow-soft">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-slate-800">Create Promotion Coupon</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCouponSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Coupon Code</label>
                        <input
                          type="text"
                          placeholder="e.g. HEALTH50"
                          value={couponForm.code}
                          onChange={(e) => setCouponForm(prev => ({ ...prev, code: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-primary transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Discount Percent</label>
                        <input
                          type="number"
                          placeholder="e.g. 20"
                          value={couponForm.discountPercent}
                          onChange={(e) => setCouponForm(prev => ({ ...prev, discountPercent: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-primary transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                        <input
                          type="text"
                          placeholder="e.g. Get 20% off all health packages"
                          value={couponForm.description}
                          onChange={(e) => setCouponForm(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-primary transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expiry Date (Optional)</label>
                        <input
                          type="date"
                          value={couponForm.expiryDate}
                          onChange={(e) => setCouponForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-primary transition-all"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingCoupon}
                        className="w-full py-3.5 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all flex items-center justify-center gap-2"
                      >
                        {submittingCoupon ? "Creating..." : "Generate Promo Coupon"}
                        <PlusCircle size={16} />
                      </button>
                    </form>
                  </CardContent>
                </Card>

                {/* Promo Coupons Directory */}
                <Card className="lg:col-span-2 border-none shadow-soft">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-slate-800">Active Campaign Coupons</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {couponsLoading ? (
                      <div className="flex items-center justify-center h-[200px]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase font-bold tracking-wider">
                              <th className="py-3 px-4">Promo Code</th>
                              <th className="py-3 px-4">Discount</th>
                              <th className="py-3 px-4">Description</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4">Expires</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-sm font-semibold text-slate-700">
                            {coupons.map((c) => (
                              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-3 px-4 font-bold text-primary">{c.code}</td>
                                <td className="py-3 px-4 flex items-center gap-1">
                                  <Percent size={14} className="text-emerald-500" /> {c.discountPercent}% OFF
                                </td>
                                <td className="py-3 px-4 text-xs text-slate-500 font-medium">{c.description || "N/A"}</td>
                                <td className="py-3 px-4">
                                  <span className={cn(
                                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                                    c.isActive 
                                      ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                      : "bg-slate-50 text-slate-400 border-slate-100"
                                  )}>
                                    {c.isActive ? "Active" : "Expired"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                                  {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : "Never"}
                                </td>
                              </tr>
                            ))}
                            {coupons.length === 0 && (
                              <tr>
                                <td colSpan={5} className="text-center text-slate-400 py-10">No coupons found. Create one to launch a campaign.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 3: REGISTER PARTNER LAB */}
          {activeTab === "add_labs" && (
            <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="border-none shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-800">Register Partner Lab</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLabSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lab Franchise Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Metro Diagnostics"
                          value={labForm.name}
                          onChange={(e) => setLabForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-primary transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Access Password</label>
                        <input
                          type="password"
                          placeholder="Default is 'test1'"
                          value={labForm.password}
                          onChange={(e) => setLabForm(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-primary transition-all"
                        />
                      </div>
                    </div>

                    <LabLocationPicker
                      key={resetKey}
                      onLocationSelect={(data) => {
                        setLabForm(prev => ({
                          ...prev,
                          address: data.address,
                          pincode: data.pincode,
                          lat: data.lat,
                          lng: data.lng
                        }));
                      }}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Default Rating</label>
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          max="5"
                          placeholder="4.5"
                          value={labForm.rating}
                          onChange={(e) => setLabForm(prev => ({ ...prev, rating: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-primary transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Promotional Discount (%)</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={labForm.discount}
                          onChange={(e) => setLabForm(prev => ({ ...prev, discount: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-primary transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex gap-8 border-t border-slate-100 pt-6">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={labForm.nabl}
                          onChange={(e) => setLabForm(prev => ({ ...prev, nabl: e.target.checked }))}
                          className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300"
                        />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider select-none group-hover:text-slate-800 transition-colors">NABL Accredited</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={labForm.homeCollection}
                          onChange={(e) => setLabForm(prev => ({ ...prev, homeCollection: e.target.checked }))}
                          className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300"
                        />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider select-none group-hover:text-slate-800 transition-colors">Supports Home Collection</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingLab}
                      className="w-full py-4 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all flex items-center justify-center gap-2"
                    >
                      {submittingLab ? "Submitting..." : "Register Partner Lab"}
                      <PlusCircle size={16} />
                    </button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 4: PARTNER LABS GOD VIEW */}
          {activeTab === "view_labs" && (
            <LabsMapView />
          )}

        </main>
      </div>
    </div>
  );
};

// Simple Marketing Icon component since it's not a direct export in some Lucide versions
const MarketingIcon = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M2 12a5 5 0 0 0 5 5h8a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5H7a5 5 0 0 0-5 5v5z" />
    <path d="M6 11h8" />
    <path d="M6 15h5" />
    <path d="M18 10a4 4 0 0 1-4 4h-4" />
  </svg>
);

export default AdminDashboard;
