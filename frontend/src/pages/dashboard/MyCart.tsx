import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Trash2, ShieldCheck, MapPin, ChevronDown, ArrowRight, Calendar, Clock, CreditCard, ShoppingBag, History, Loader2, CheckCircle2, Tag, Percent, Download, Eye, Wand2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import apiClient from "@/api/apiClient";
import { toast } from "sonner";

const MyCart = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') === 'orders' ? 'orders' : 'cart';
  const [activeTab, setActiveTab] = useState<"cart" | "orders">(initialTab);
  const [draft, setDraft] = useState<any>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  // Load draft from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem('bookingDraft');
    if (savedDraft) {
      setDraft(JSON.parse(savedDraft));
    }
  }, []);

  // Fetch past orders — always enabled so data is ready when tab opens
  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['orders', patientId],
    queryFn: async () => {
      const response = await apiClient.get(`/bookings?patientId=${patientId}`);
      return response.data;
    },
    staleTime: 0 // always fresh
  });

  const validateCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiClient.get(`/coupons/validate/${code}`);
      return response.data;
    },
    onSuccess: (data) => {
      setAppliedCoupon(data);
      toast.success("Coupon Applied!", {
        description: `${data.discountPercent}% discount has been added to your order.`
      });
    },
    onError: () => {
      toast.error("Invalid Coupon", {
        description: "The coupon code you entered is invalid or expired."
      });
    }
  });

  const totals = useMemo(() => {
    if (!draft) return { subtotal: 0, labDiscount: 0, couponDiscount: 0, total: 0 };
    
    const subtotal = draft.tests.reduce((sum: number, t: any) => sum + t.price, 0);
    const labDiscountAmt = Math.round((subtotal * (draft.labDiscount || 0)) / 100);
    const afterLabDiscount = subtotal - labDiscountAmt;
    
    const couponDiscountAmt = appliedCoupon 
      ? Math.round((afterLabDiscount * appliedCoupon.discountPercent) / 100)
      : 0;
      
    const homeCollectionFee = draft.homeCollection ? 150 : 0;
    const finalTotal = afterLabDiscount - couponDiscountAmt + homeCollectionFee;

    return {
      subtotal,
      labDiscount: labDiscountAmt,
      couponDiscount: couponDiscountAmt,
      total: finalTotal,
      homeCollectionFee
    };
  }, [draft, appliedCoupon]);

  const paymentMutation = useMutation({
    mutationFn: async () => {
      if (!draft) return;
      const response = await apiClient.post('/bookings', {
        patientId: draft.patientId || patientId,
        bookedById: patientId,
        labId: draft.lab?.id,
        testIds: draft.tests.map((t: any) => t.id),
        timeSlot: `${draft.appointmentDate}, ${draft.timeSlot}`,
        priority: "MEDIUM",
        comments: draft.instructions ? 1 : 0,
        amountPaid: totals.total
      });
      return response.data;
    },
    onSuccess: () => {
      localStorage.removeItem('bookingDraft');
      window.dispatchEvent(new Event('cart-updated'));
      setDraft(null);
      setAppliedCoupon(null);
      toast.success("Payment Successful!", {
        description: "Your tests are now officially scheduled.",
      });
      refetchOrders(); // refresh orders list immediately
      setActiveTab("orders");
    },
    onError: () => {
      toast.error("Payment Failed", {
        description: "There was an error processing your transaction."
      });
    }
  });

  const removeFromCart = (testId: string) => {
    if (!draft) return;
    const updatedTests = draft.tests.filter((t: any) => t.id !== testId);
    if (updatedTests.length === 0) {
      setDraft(null);
      localStorage.removeItem('bookingDraft');
      window.dispatchEvent(new Event('cart-updated'));
    } else {
      const newDraft = { ...draft, tests: updatedTests };
      setDraft(newDraft);
      localStorage.setItem('bookingDraft', JSON.stringify(newDraft));
      window.dispatchEvent(new Event('cart-updated'));
    }
  };

  const handleAIAnalysis = (orderId: string) => {
    toast.info("AI Magic Initiated", {
      description: "Analyzing your pathology report with BookMyPathology AI. Results will be available in Insights.",
      icon: <Wand2 className="h-4 w-4 text-primary" />
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-6xl mx-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight uppercase">Checkout & Orders</h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium mt-1">Review selections and track history</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
          <button 
            onClick={() => setActiveTab("cart")}
            className={cn(
              "flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all",
              activeTab === "cart" ? "bg-white text-slate-800 shadow-md" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <ShoppingBag size={14} /> <span className="hidden xs:inline">My Cart</span><span className="xs:hidden">Cart</span>
          </button>
          <button 
            onClick={() => setActiveTab("orders")}
            className={cn(
              "flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all",
              activeTab === "orders" ? "bg-white text-slate-800 shadow-md" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <History size={14} /> <span className="hidden xs:inline">Orders</span><span className="xs:hidden">History</span>
          </button>
        </div>
      </div>

      {activeTab === "cart" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in slide-in-from-bottom-4 duration-500">
          {draft ? (
            <>
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Selected Tests</h3>
                  <span className="text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/10 uppercase tracking-widest">
                    {draft.tests.length} Items in cart
                  </span>
                </div>

                <div className="space-y-4">
                  {draft.tests.map((test: any) => (
                    <div key={test.id} className="rounded-3xl bg-white border border-slate-100 p-6 shadow-soft group hover:shadow-xl hover:border-slate-200 transition-all">
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                          <ShieldCheck className="h-8 w-8 text-primary/40 group-hover:text-primary transition-all duration-500" />
                        </div>
                        <div className="flex-1 space-y-2 text-center md:text-left w-full">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <h4 className="font-black text-slate-800 text-lg">{test.name}</h4>
                            <span className="text-xl font-black text-slate-800 tracking-tighter">₹{test.price}</span>
                          </div>
                          <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 w-fit mx-auto md:mx-0">
                              <MapPin className="h-4 w-4 text-primary" />
                              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{draft.lab?.name || "LAB A"}</span>
                            </div>
                            <button 
                              onClick={() => removeFromCart(test.id)}
                              className="flex items-center gap-1.5 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline mx-auto md:mx-0"
                            >
                              <Trash2 className="h-4 w-4" /> Remove Test
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div 
                  className="p-6 md:p-8 rounded-[32px] bg-white border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-4 cursor-pointer group hover:bg-slate-50 transition-all text-center" 
                  onClick={() => navigate(`/patient/${patientId}/book?labId=${draft.lab?.id}`)}
                >
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full border-2 border-slate-100 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all">
                    <ArrowRight className="h-5 w-5 md:h-6 md:w-6 text-slate-300 group-hover:text-white" />
                  </div>
                  <span className="text-[9px] md:text-[11px] font-black text-slate-400 group-hover:text-primary uppercase tracking-[0.2em] transition-colors px-4">Add more tests to your booking</span>
                </div>
              </div>

              <div className="lg:col-span-1 space-y-6">
                <div className="rounded-[32px] md:rounded-[40px] bg-white border border-slate-100 p-6 md:p-8 shadow-2xl shadow-slate-100 lg:sticky lg:top-24">
                  <h4 className="font-black text-lg md:text-xl text-slate-800 mb-6 md:mb-8 uppercase tracking-tight">Order Summary</h4>
                  
                  <div className="mb-8 space-y-3">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Apply Coupon</div>
                    <div className="relative group">
                      <input 
                        type="text" 
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="ENTER CODE"
                        className="w-full pl-12 pr-24 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                      />
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                      <button 
                        onClick={() => validateCouponMutation.mutate(couponCode)}
                        disabled={!couponCode || validateCouponMutation.isPending}
                        className="absolute right-2 top-2 px-4 py-2 rounded-xl bg-slate-800 text-white text-[9px] font-black uppercase tracking-widest hover:bg-primary transition-all disabled:opacity-50"
                      >
                        {validateCouponMutation.isPending ? "..." : "Apply"}
                      </button>
                    </div>
                    {appliedCoupon && (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-3 rounded-xl animate-in zoom-in duration-300">
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4 text-emerald-600" />
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Applied: {appliedCoupon.code}</span>
                        </div>
                        <button onClick={() => setAppliedCoupon(null)} className="text-[10px] font-black text-emerald-600 hover:underline">Remove</button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 border-b border-slate-100 pb-8 mb-8">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>Subtotal</span>
                      <span className="text-slate-800 tracking-tight">₹{totals.subtotal}</span>
                    </div>
                    
                    {totals.labDiscount > 0 && (
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-emerald-600">
                        <span>Lab Offer ({draft.labDiscount}%)</span>
                        <span className="tracking-tight">-₹{totals.labDiscount}</span>
                      </div>
                    )}

                    {totals.couponDiscount > 0 && (
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-emerald-600">
                        <span>Coupon Savings ({appliedCoupon.discountPercent}%)</span>
                        <span className="tracking-tight">-₹{totals.couponDiscount}</span>
                      </div>
                    )}

                    {totals.homeCollectionFee > 0 && (
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Convenience Fee</span>
                        <span className="text-slate-800 tracking-tight">₹{totals.homeCollectionFee}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm font-black uppercase tracking-[0.1em] text-slate-800 pt-4 border-t border-slate-50">
                      <span>Total Amount</span>
                      <span className="text-3xl tracking-tighter text-primary">₹{totals.total}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => paymentMutation.mutate()}
                    disabled={paymentMutation.isPending}
                    className="w-full py-6 rounded-3xl bg-slate-800 text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-primary shadow-2xl transition-all flex items-center justify-center gap-4 group"
                  >
                    {paymentMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : (
                      <>
                        Pay & Schedule <CreditCard className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="lg:col-span-3 py-20 flex flex-col items-center justify-center text-center space-y-6">
              <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200">
                <ShoppingBag className="h-10 w-10 text-slate-300" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Your cart is empty</h3>
                <p className="text-slate-500 text-sm mt-2">You haven't selected any tests for booking yet.</p>
              </div>
              <button 
                onClick={() => navigate(`/patient/${patientId}/book`)}
                className="px-10 py-4 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all"
              >
                Browse All Tests
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "orders" && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Booking & Date</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Patient</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Lab & Tests</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {ordersLoading ? (
                    <tr>
                      <td colSpan={4} className="py-20 text-center">
                        <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" />
                      </td>
                    </tr>
                  ) : orders && orders.length > 0 ? (
                    orders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-8">
                          <div className="space-y-1">
                            <div className="text-sm font-black text-slate-800 uppercase tracking-tight">#{order.bookingId}</div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <Calendar size={12} className="text-primary" /> {order.timeSlot}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-8">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-primary/40 font-black text-[10px]">
                              {order.patient?.name?.charAt(0)}
                            </div>
                            <div>
                              <div className="text-xs font-black text-slate-800 uppercase tracking-tight">{order.patient?.name}</div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{order.patient?.relation || "Self"}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-8 py-8">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <MapPin size={12} className="text-primary" />
                              <span className="text-xs font-black text-slate-700 uppercase tracking-wide">{order.lab?.name || "LAB A"}</span>
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[200px]">
                              {order.tests?.map((t: any) => t.name).join(', ')}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-8">
                          <span className={cn(
                            "text-[9px] font-black px-3 py-1.5 rounded-full border uppercase tracking-widest",
                            order.status === 'REPORT_GENERATED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            order.status === 'PICKEDUP' ? "bg-amber-50 text-amber-600 border-amber-100" :
                            "bg-blue-50 text-blue-600 border-blue-100"
                          )}>
                            {order.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-8 py-8 text-right">
                          <div className="text-lg font-black text-slate-800 tracking-tighter">₹{order.amountPaid}</div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <FileText size={48} className="text-slate-100" />
                          <div className="text-sm font-black text-slate-300 uppercase tracking-widest">No order history found</div>
                        </div>
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCart;
