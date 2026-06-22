import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { Search, MapPin, Clock, Star, ShieldCheck, ChevronRight, Check, Loader2, ArrowRight, Grid, ChevronDown, ChevronUp, Filter, ArrowUpDown, ShoppingBag, User, Plus, X, Mail, Phone } from "lucide-react";

import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import apiClient from "@/api/apiClient";
import { toast } from "sonner";

const categoryMapping: Record<string, string> = {
  "All": "ALL",
  "Routine Health Checkups": "ROUTINE",
  "Diabetes & Metabolic Tests": "DIABETES",
  "Liver Function Tests (LFT)": "LIVER",
  "Kidney Function Tests (KFT/RFT)": "KIDNEY",
  "Cardiac Tests": "HEART",
  "Thyroid Tests": "THYROID",
  "Vitamin & Deficiency Tests": "VITAMINS",
  "Hormonal Tests": "HORMONES",
  "Infection & Serology Tests": "INFECTION",
  "Urine Tests": "URINE",
  "Stool Tests": "STOOL",
  "Cancer / Tumor Markers": "CANCER",
  "Coagulation Tests": "COAGULATION",
  "Autoimmune Tests": "AUTOIMMUNE",
  "Allergy Tests": "ALLERGY",
  "Genetic & Specialized Tests": "GENETIC",
  "Electrolyte & Mineral Panel": "MINERALS"
};

const topCategories = [
  "All",
  "Routine Health Checkups",
  "Liver Function Tests (LFT)",
  "Kidney Function Tests (KFT/RFT)",
  "Thyroid Tests",
  "Cardiac Tests"
];

const BookTest = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const forcedLabId = searchParams.get("labId");

  const [step, setStep] = useState(1);
  const [activeCategory, setActiveCategory] = useState("All");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTests, setSelectedTests] = useState<any[]>([]);
  const [selectedLab, setSelectedLab] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<number>(18);
  const [selectedTime, setSelectedTime] = useState<string>("09:00 AM");
  const [instructions, setInstructions] = useState("");
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
  const [sortBy, setSortBy] = useState<string>("popularity");
  const [homeCollection, setHomeCollection] = useState(true);
  const [selectedProfileId, setSelectedProfileId] = useState<string | undefined>(patientId);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: "", age: "", gender: "Male", relation: "Other", phone: "", email: "", addressLine1: "", addressLine2: "", pincode: ""
  });

  // Auto-select lab if forcedLabId is present
  const { data: forcedLab } = useQuery({
    queryKey: ['lab', forcedLabId],
    queryFn: async () => {
      const response = await apiClient.get(`/labs/${forcedLabId}`);
      return response.data;
    },
    enabled: !!forcedLabId && !selectedLab
  });

  useEffect(() => {
    if (forcedLab && !selectedLab) {
      setSelectedLab(forcedLab);
      if (step === 2) setStep(3);
    }
  }, [forcedLab, selectedLab, step]);

  // Fetch Tests
  const { data: tests, isLoading: testsLoading } = useQuery({
    queryKey: ['tests'],
    queryFn: async () => {
      const response = await apiClient.get('/tests');
      return response.data;
    },
  });

  // Fetch Categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.get('/tests/categories');
      return ["All", ...response.data];
    },
  });

  // Fetch Labs
  const { data: labs, isLoading: labsLoading, refetch: refetchLabs } = useQuery({
    queryKey: ['labs', sortBy, userCoords],
    queryFn: async () => {
      const params: any = { sortBy };
      if (userCoords) {
        params.lat = userCoords.lat;
        params.lng = userCoords.lng;
      }
      const response = await apiClient.get('/labs', { params });
      return response.data;
    },
    enabled: step === 2
  });

  // Fetch Saved Profiles
  const { data: profiles, refetch: refetchProfiles } = useQuery({
    queryKey: ['family', patientId],
    queryFn: async () => {
      const response = await apiClient.get(`/family/${patientId}`);
      return response.data;
    },
    enabled: !!patientId
  });

  const addProfileMutation = useMutation({
    mutationFn: async (newData: any) => {
      const response = await apiClient.post(`/family/${patientId}`, newData);
      return response.data;
    },
    onSuccess: (newProfile) => {
      refetchProfiles();
      setSelectedProfileId(newProfile.id);
      setShowProfileModal(false);
      setProfileFormData({ name: "", age: "", gender: "Male", relation: "Other", phone: "", email: "", addressLine1: "", addressLine2: "", pincode: "" });
      toast.success("Profile Added!", { description: "You can now book tests for this profile." });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to add profile");
    }
  });

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // Default to Mumbai if denied
          setUserCoords({ lat: 19.0760, lng: 72.8777 });
        }
      );
    }
  }, []);

  // Load existing tests from cart if adding more
  useEffect(() => {
    const savedDraft = localStorage.getItem('bookingDraft');
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      // If we're coming from the cart with a specific lab, load its tests
      if (forcedLabId && draft.lab?.id === forcedLabId) {
        setSelectedTests(draft.tests || []);
        setSelectedLab(draft.lab); // CRITICAL: Restore the lab object
        
        // Preserve other selections too so they aren't reset to defaults
        if (draft.appointmentDate) {
          const datePart = parseInt(draft.appointmentDate.split('-')[2]);
          if (!isNaN(datePart)) setSelectedDate(datePart);
        }
        if (draft.timeSlot) setSelectedTime(draft.timeSlot);
        if (draft.instructions) setInstructions(draft.instructions);
        if (draft.homeCollection !== undefined) setHomeCollection(draft.homeCollection);
        if (draft.patientId) setSelectedProfileId(draft.patientId);
      }
    }
  }, [forcedLabId]);

  // Auto-select tests from query params (for AI recommendations)
  useEffect(() => {
    const testIdsFromUrl = new URLSearchParams(window.location.search).get('testIds');
    if (testIdsFromUrl && tests) {
      const ids = testIdsFromUrl.split(',');
      const matchedTests = tests.filter((t: any) => ids.includes(t.id));
      if (matchedTests.length > 0) {
        setSelectedTests(matchedTests);
        toast.info(`${matchedTests.length} Recommended tests pre-selected!`, {
          description: "We've added the tests recommended by your AI analysis to your selection."
        });
      }
    }
  }, [tests]);

  const toggleTest = (test: any) => {
    setSelectedTests(prev => 
      prev.find(t => t.id === test.id) 
        ? prev.filter(t => t.id !== test.id)
        : [...prev, test]
    );
  };

  const filteredTests = useMemo(() => {
    return (tests || []).filter((t: any) => {
      const matchesCategory = activeCategory === "All" || t.category === activeCategory;
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [tests, activeCategory, searchQuery]);

  // CALCULATION LOGIC: Now including Lab Discount automatically
  const subtotal = selectedTests.reduce((sum, t) => sum + t.price, 0);
  const labDiscountAmt = selectedLab ? Math.round((subtotal * selectedLab.discount) / 100) : 0;
  const homeFee = homeCollection ? 150 : 0;
  const totalAmount = subtotal - labDiscountAmt + homeFee;

  const handleConfirmBooking = () => {
    if (selectedTests.length === 0) {
      toast.error("No tests selected", { description: "Please select at least one test to book." });
      return;
    }

    if (!selectedLab) {
      toast.error("Laboratory not selected", { description: "Please go back and select a lab." });
      return;
    }
    
    const cartDraft = {
      tests: selectedTests,
      lab: selectedLab,
      labDiscount: selectedLab?.discount || 0,
      appointmentDate: format(new Date(2026, 4, selectedDate), 'yyyy-MM-dd'),
      timeSlot: selectedTime,
      homeCollection,
      instructions,
      totalAmount,
      patientId: selectedProfileId
    };
    
    localStorage.setItem('bookingDraft', JSON.stringify(cartDraft));
    window.dispatchEvent(new Event('cart-updated'));
    toast.success("Tests added to cart!", {
      description: `Booking for ${profiles?.find((p: any) => p.id === selectedProfileId)?.name || "yourself"}.`,
    });
    navigate(`/patient/${patientId}/cart`);
  };

  if (testsLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen no-scrollbar">
      {/* Content Wrapper */}
      <div className={cn("space-y-8 max-w-6xl mx-auto animate-fade-in px-4 md:px-0", selectedTests.length > 0 ? "pb-48" : "pb-20")}>
        
        {/* Step Navigation Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-6 border-b border-slate-100">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight uppercase">
              {step === 1 ? "Choose Tests" : step === 2 ? "Select Laboratory" : "Schedule Slot"}
            </h1>
            <p className="text-slate-500 text-xs md:text-sm font-medium mt-1">
              {step === 1 ? "Select from over 100+ certified pathology tests" : 
               step === 2 ? "Choose a high-rated diagnostic center near you" : 
               "Pick a convenient time for sample collection"}
            </p>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar py-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center shrink-0">
                <div 
                  onClick={() => {
                    if (s === 2 && forcedLabId) return;
                    if (s < step) setStep(s);
                  }}
                  className={cn(
                    "h-8 w-8 md:h-10 md:w-10 rounded-xl md:rounded-2xl flex items-center justify-center text-sm md:text-base font-black transition-all cursor-pointer shadow-sm",
                    step === s ? "bg-primary text-white scale-110 shadow-primary/30" : 
                    step > s ? "bg-emerald-500 text-white" : "bg-white text-slate-300 border border-slate-100"
                  )}
                >
                  {step > s ? <Check className="h-4 w-4 md:h-5 md:w-5" /> : s}
                </div>
                {s < 3 && <div className={cn("w-4 md:w-8 h-[2px] mx-1 rounded-full", step > s ? "bg-emerald-500" : "bg-slate-100")} />}
              </div>
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="max-w-2xl mx-auto w-full">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input 
                  type="text" 
                  placeholder="Search for CBC, Diabetes, Thyroid, Vitamin D..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-3xl text-sm shadow-soft focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Filter by Category</h3>
                <button 
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className="text-[10px] font-black text-primary flex items-center gap-1.5 uppercase tracking-widest hover:underline"
                >
                  {showAllCategories ? (
                    <>Show Less <ChevronUp size={14} /></>
                  ) : (
                    <>View All <ChevronDown size={14} /></>
                  )}
                </button>
              </div>

              {showAllCategories ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 animate-in fade-in zoom-in-95 duration-300">
                  {(categories || []).map((cat: string) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={cn(
                        "px-4 py-3 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all border-2 text-center",
                        activeCategory === cat 
                          ? "bg-slate-800 text-white border-slate-800 shadow-xl" 
                          : "bg-white text-slate-400 border-slate-50 hover:border-slate-200"
                      )}
                    >
                      {categoryMapping[cat] || cat}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {topCategories.map((cat: string) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={cn(
                        "px-7 py-3 rounded-2xl text-[11px] font-black tracking-widest uppercase transition-all whitespace-nowrap border-2",
                        activeCategory === cat 
                          ? "bg-slate-800 text-white border-slate-800 shadow-xl shadow-slate-200" 
                          : "bg-white text-slate-400 border-slate-50 hover:border-slate-200 hover:text-slate-600"
                      )}
                    >
                      {categoryMapping[cat] || cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTests.map((test: any) => (
                <div 
                  key={test.id} 
                  className={cn(
                    "rounded-3xl bg-white border-2 p-6 transition-all duration-300 group cursor-pointer relative overflow-hidden",
                    selectedTests.find(t => t.id === test.id) 
                      ? "border-primary shadow-2xl shadow-primary/5 translate-y-[-4px]" 
                      : "border-slate-50 hover:border-slate-200 shadow-soft hover:shadow-xl"
                  )}
                  onClick={() => toggleTest(test)}
                >
                  {selectedTests.find(t => t.id === test.id) && (
                    <div className="absolute top-0 right-0 bg-primary text-white p-2 rounded-bl-2xl animate-in zoom-in">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between">
                    <div className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                      selectedTests.find(t => t.id === test.id) 
                        ? "bg-primary text-white rotate-[360deg]" 
                        : "bg-slate-50 text-slate-400"
                    )}>
                      <ShieldCheck className="h-7 w-7" />
                    </div>
                    <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-slate-100">
                      {categoryMapping[test.category] || test.category}
                    </span>
                  </div>

                  <h4 className="mt-6 font-black text-slate-800 text-lg line-clamp-1">{test.name}</h4>
                  
                  <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-primary/60" /> 24 Hrs TAT</span>
                    <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-primary/60" /> NABL</span>
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-300 uppercase block mb-1">Price</span>
                      <div className="text-2xl font-black text-slate-800 tracking-tighter">₹{test.price}</div>
                    </div>
                    <div className={cn(
                      "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md",
                      selectedTests.find(t => t.id === test.id) 
                        ? "bg-primary text-white shadow-primary/20" 
                        : "bg-slate-50 text-slate-400 border border-slate-100 group-hover:bg-slate-800 group-hover:text-white"
                    )}>
                      {selectedTests.find(t => t.id === test.id) ? "Selected" : "Add Test"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-right duration-500">
            {/* Sorting Tabs */}
            <div className="flex items-center justify-between bg-white p-2 rounded-3xl border border-slate-100 shadow-soft max-w-xl mx-auto overflow-x-auto no-scrollbar">
              {[
                { id: "popularity", label: "Most Popular", icon: Star },
                { id: "distance", label: "Nearest to Me", icon: MapPin },
                { id: "discount", label: "Best Offers", icon: ArrowUpDown },
              ].map((sort) => (
                <button
                  key={sort.id}
                  onClick={() => setSortBy(sort.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    sortBy === sort.id ? "bg-slate-800 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <sort.icon size={14} />
                  {sort.label}
                </button>
              ))}
            </div>

            {labsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin h-10 w-10 text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {(labs || []).map((lab: any) => (
                  <div 
                    key={lab.id} 
                    className={cn(
                      "group rounded-3xl bg-white border-2 p-8 transition-all flex flex-col md:flex-row items-center justify-between gap-8 cursor-pointer shadow-soft relative overflow-hidden",
                      selectedLab?.id === lab.id ? "border-primary shadow-xl" : "border-slate-50 hover:border-slate-200"
                    )}
                    onClick={() => setSelectedLab(lab)}
                  >
                    {lab.discount > 0 && (
                      <div className="absolute top-0 left-0 bg-rose-500 text-white px-4 py-1.5 rounded-br-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                        {lab.discount}% OFF
                      </div>
                    )}

                    <div className="flex gap-6 items-start flex-1 w-full">
                      <div className="h-20 w-20 rounded-3xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                        <MapPin className={cn("h-10 w-10 transition-colors", selectedLab?.id === lab.id ? "text-primary" : "text-slate-300 group-hover:text-primary")} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="font-black text-slate-800 text-xl tracking-tight">{lab.name}</h4>
                          {lab.nabl && <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2.5 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest">NABL Certified</span>}
                        </div>
                        <p className="text-sm text-slate-500 font-medium line-clamp-1">{lab.address}</p>
                        <div className="flex items-center gap-6 pt-2">
                          <span className="flex items-center gap-1.5 text-[11px] font-black text-amber-500">
                            <Star className="h-4 w-4 fill-amber-500" /> {lab.rating}
                          </span>
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            {lab.distance ? `${lab.distance.toFixed(1)} km away` : "Locating..."}
                          </span>
                          {lab.homeCollection && (
                            <span className="text-[11px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5 bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                              <Clock size={12} /> Home Sample
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setSelectedLab(lab); setStep(3); }}
                      className={cn(
                        "w-full md:w-auto px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-lg",
                        selectedLab?.id === lab.id ? "bg-primary text-white shadow-primary/20" : "bg-slate-50 text-slate-400 hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      {selectedLab?.id === lab.id ? "Selected" : "Choose Lab"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="max-w-4xl mx-auto space-y-10 animate-in zoom-in-95 duration-500">
            {/* Booking For Section */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
                  <div className="w-8 h-[2px] bg-primary/30" /> Booking For
                </h4>
                <button 
                  onClick={() => setShowProfileModal(true)}
                  className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                >
                  <Plus size={14} /> Add New Profile
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profiles?.map((profile: any) => (
                  <div 
                    key={profile.id}
                    onClick={() => setSelectedProfileId(profile.id)}
                    className={cn(
                      "p-5 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden group",
                      selectedProfileId === profile.id ? "border-primary bg-primary/5 shadow-md" : "border-slate-50 bg-slate-50/30 hover:border-slate-200"
                    )}
                  >
                    {selectedProfileId === profile.id && (
                      <div className="absolute top-0 right-0 bg-primary text-white p-1.5 rounded-bl-xl">
                        <Check size={12} />
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center",
                        selectedProfileId === profile.id ? "bg-primary text-white" : "bg-white text-slate-400 border border-slate-100"
                      )}>
                        <User size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-800 uppercase tracking-tight">{profile.name}</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{profile.relation || "Self"}</div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500">
                        <Phone size={10} className="text-primary/60" /> {profile.phone || "No phone"}
                      </div>
                      <div className="flex items-start gap-2 text-[9px] font-bold text-slate-500">
                        <MapPin size={10} className="text-primary/60 mt-0.5 shrink-0" /> 
                        <span className="line-clamp-1">{profile.addressLine1 || "No address"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-8 bg-white p-10 rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-100">
               <div>
                 <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-3">
                   <div className="w-8 h-[2px] bg-primary/30" /> Select Collection Date
                 </h4>
                 <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                   {[18, 19, 20, 21, 22, 23, 24].map((d, i) => (
                      <button 
                        key={d} 
                        onClick={() => setSelectedDate(d)}
                        className={cn(
                          "flex flex-col items-center gap-2 min-w-[85px] py-5 rounded-[24px] border-2 transition-all",
                          selectedDate === d 
                            ? "bg-slate-800 border-slate-800 text-white shadow-xl translate-y-[-4px]" 
                            : "bg-white border-slate-50 text-slate-400 hover:border-slate-200"
                        )}
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                          {["Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue"][i]}
                        </span>
                        <span className="text-xl font-black">{d}</span>
                      </button>
                   ))}
                 </div>
               </div>

               <div>
                 <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-3">
                   <div className="w-8 h-[2px] bg-primary/30" /> Select Time Slot
                 </h4>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                   {["07:00 AM", "08:30 AM", "09:00 AM", "10:30 AM", "11:00 AM"].map((t) => (
                     <button 
                      key={t} 
                      onClick={() => setSelectedTime(t)}
                      className={cn(
                        "py-4 rounded-2xl border-2 text-[11px] md:text-[12px] font-black uppercase tracking-wider transition-all",
                        selectedTime === t 
                          ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                          : "border-slate-50 text-slate-400 hover:border-slate-200 hover:text-slate-600 bg-slate-50/30"
                      )}
                     >
                       {t}
                     </button>
                   ))}
                 </div>
               </div>

               <div className="p-8 rounded-[32px] bg-slate-50/50 border-2 border-slate-50 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-sm font-black text-slate-800 uppercase tracking-wide">Home Collection</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Phlebotomist will visit your address</div>
                    </div>
                    <div 
                      onClick={() => setHomeCollection(!homeCollection)}
                      className={cn(
                        "h-8 w-14 rounded-full p-1 flex items-center transition-all cursor-pointer shadow-inner",
                        homeCollection ? "bg-primary" : "bg-slate-200"
                      )}
                    >
                      <div className={cn(
                        "h-6 w-6 rounded-full bg-white shadow-md transform transition-transform duration-200",
                        homeCollection ? "translate-x-6" : "translate-x-0"
                      )} />
                    </div>
                  </div>
                  <textarea 
                    placeholder="Provide special instructions (e.g. Near landmark, Entry code...)"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full h-32 rounded-2xl border-2 border-slate-100 bg-white p-5 text-xs font-medium outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all resize-none shadow-soft placeholder:text-slate-300"
                  />
               </div>

               <button 
                 onClick={handleConfirmBooking}
                 className="w-full py-6 rounded-3xl bg-primary text-white text-sm font-black uppercase tracking-[0.2em] hover:bg-slate-800 shadow-2xl shadow-primary/20 transition-all flex items-center justify-center gap-4"
               >
                 Confirm Final Booking <ArrowRight size={20} />
               </button>
             </div>
          </div>
        )}
      </div>
      
      {/* THE SMART CONTINUE BAR — UPDATED TO SHOW AUTO-APPLIED LAB DISCOUNT */}
      {selectedTests.length > 0 && (
        <div className="fixed bottom-4 md:bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 md:px-6 z-[9999] pointer-events-none">
          <div className="bg-slate-900/95 backdrop-blur-xl p-3 md:p-5 rounded-[24px] md:rounded-[32px] shadow-[0_30px_70px_rgba(0,0,0,0.6)] flex items-center justify-between text-white border border-white/10 ring-1 ring-white/20 pointer-events-auto">
            <div className="flex items-center gap-3 md:gap-6">
              <div className="bg-primary h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-primary/40 relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/10 group-hover:translate-y-[-100%] transition-transform duration-500" />
                <div className="text-[8px] md:text-[10px] font-black opacity-60 leading-none mb-0.5 md:mb-1 z-10">TESTS</div>
                <div className="text-lg md:text-xl font-black leading-none z-10">{selectedTests.length}</div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <div className="text-[8px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Payable</div>
                  {selectedLab && selectedLab.discount > 0 && (
                    <span className="hidden xs:inline-block text-[7px] md:text-[8px] font-black bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded border border-emerald-500/20 uppercase tracking-tighter">
                      {selectedLab.discount}% OFF
                    </span>
                  )}
                </div>
                <div className="text-xl md:text-2xl font-black tracking-tighter text-white flex items-baseline gap-1 mt-0.5">
                   ₹{totalAmount}
                   <span className="hidden md:inline-block text-[10px] text-white/30 font-bold ml-1 uppercase">INC. TAXES</span>
                </div>
              </div>
            </div>
            
            {step < 3 ? (
              <button 
                onClick={() => {
                  if (step === 1 && forcedLabId) {
                    setStep(3);
                  } else {
                    setStep(step + 1);
                  }
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-primary text-white px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] hover:bg-white hover:text-slate-900 transition-all shadow-xl active:scale-95 flex items-center gap-2 md:gap-3 group"
              >
                {step === 1 ? (forcedLabId ? "Schedule" : "Lab") : "Schedule"}
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button 
                onClick={handleConfirmBooking}
                className="bg-emerald-500 text-white px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] hover:bg-emerald-400 transition-all shadow-xl active:scale-95 flex items-center gap-2 md:gap-3"
              >
                Cart <ShoppingBag size={16} className="ml-1" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowProfileModal(false)} />
          <div className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Add New Profile</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Book tests for a family member or friend</p>
              </div>
              <button onClick={() => setShowProfileModal(false)} className="h-10 w-10 rounded-full hover:bg-slate-50 flex items-center justify-center border border-slate-100 transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <form className="p-8 space-y-8" onSubmit={(e) => {
              e.preventDefault();
              if (profileFormData.phone.length !== 10) {
                toast.error("Phone number must be 10 digits");
                return;
              }
              addProfileMutation.mutate(profileFormData);
            }}>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name *</label>
                    <input required type="text" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all text-xs font-bold" value={profileFormData.name} onChange={(e) => setProfileFormData({...profileFormData, name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Age *</label>
                      <input required type="number" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all text-xs font-bold" value={profileFormData.age} onChange={(e) => setProfileFormData({...profileFormData, age: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                      <select className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all text-xs font-bold" value={profileFormData.gender} onChange={(e) => setProfileFormData({...profileFormData, gender: e.target.value})}>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone *</label>
                    <input required type="tel" maxLength={10} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all text-xs font-bold" value={profileFormData.phone} onChange={(e) => setProfileFormData({...profileFormData, phone: e.target.value.replace(/\D/g, '')})} />
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Address Line 1</label>
                    <input type="text" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all text-xs font-bold" value={profileFormData.addressLine1} onChange={(e) => setProfileFormData({...profileFormData, addressLine1: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Relation</label>
                    <select className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all text-xs font-bold" value={profileFormData.relation} onChange={(e) => setProfileFormData({...profileFormData, relation: e.target.value})}>
                      <option>Spouse</option>
                      <option>Child</option>
                      <option>Father</option>
                      <option>Mother</option>
                      <option>Sibling</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pincode</label>
                    <input type="text" maxLength={6} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all text-xs font-bold" value={profileFormData.pincode} onChange={(e) => setProfileFormData({...profileFormData, pincode: e.target.value.replace(/\D/g, '')})} />
                  </div>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={addProfileMutation.isPending}
                className="w-full py-6 rounded-[24px] bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
              >
                {addProfileMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Save Profile & Continue"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Global Style for scrollbar hiding */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default BookTest;
