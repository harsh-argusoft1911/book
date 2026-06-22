import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  User, 
  Phone, 
  Mail, 
  Search, 
  Plus, 
  Check, 
  Loader2, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  ClipboardCheck,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/api/apiClient";
import { toast } from "sonner";

const PathologyWalkin = () => {
  const { labId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [phoneSearch, setPhoneSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [selectedTests, setSelectedTests] = useState<any[]>([]);
  const [patientForm, setPatientForm] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    gender: "Male"
  });

  // Fetch all available tests
  const { data: allTests, isLoading: testsLoading } = useQuery({
    queryKey: ['tests'],
    queryFn: async () => {
      const response = await apiClient.get('/tests');
      return response.data;
    }
  });

  const validateForm = () => {
    if (!patientForm.name.trim()) {
      toast.error("Name is required");
      return false;
    }
    if (!/^\d{10}$/.test(patientForm.phone)) {
      toast.error("Phone number must be 10 digits");
      return false;
    }
    if (patientForm.email && !/\S+@\S+\.\S+/.test(patientForm.email)) {
      toast.error("Invalid email format");
      return false;
    }
    return true;
  };

  // Search Patient Mutation
  const handleSearch = async () => {
    if (!phoneSearch || !/^\d{10}$/.test(phoneSearch)) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await apiClient.get(`/patients/search/${phoneSearch}`);
      setSelectedPatient(response.data);
      setIsNewPatient(false);
      setStep(2);
      toast.success("Patient Record Found!");
    } catch (err: any) {
      if (err.response?.status === 404) {
        setIsNewPatient(true);
        setPatientForm({ ...patientForm, phone: phoneSearch });
        setStep(2);
        toast.info("No record found. Please register the patient.");
      } else {
        toast.error("Search failed. Try again.");
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Create Patient Mutation
  const createPatientMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/patients', data);
      return response.data;
    },
    onSuccess: (newPatient) => {
      setSelectedPatient(newPatient);
      setStep(3);
    }
  });

  // Create Booking Mutation
  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/bookings', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', labId] });
      toast.success("Walk-in Booking Created!", {
        description: `Booking confirmed for ${selectedPatient?.name}.`
      });
      navigate(`/pathology/${labId}/bookings`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Booking failed");
    }
  });

  const finalizeBooking = () => {
    if (selectedTests.length === 0) {
      toast.error("No tests selected");
      return;
    }

    createBookingMutation.mutate({
      patientId: selectedPatient.id,
      bookedById: selectedPatient.id, // For walk-ins, we can attribute it to the user or a staff ID
      labId,
      testIds: selectedTests.map(t => t.id),
      timeSlot: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      priority: "MEDIUM",
      amountPaid: selectedTests.reduce((sum, t) => sum + t.price, 0), // Assuming full payment at counter
      totalCost: selectedTests.reduce((sum, t) => sum + t.price, 0),
      comments: "Direct Walk-in Booking"
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight uppercase">Walk-in Booking</h1>
          <p className="text-xs md:text-sm font-medium text-slate-500">Register patients and create direct bookings.</p>
        </div>
        
        <div className="flex items-center justify-center gap-2 md:gap-4 overflow-x-auto no-scrollbar py-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center shrink-0">
              <div className={cn(
                "h-7 w-7 md:h-8 md:w-8 rounded-lg md:rounded-xl flex items-center justify-center text-[10px] font-black transition-all",
                step === s ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" :
                step > s ? "bg-emerald-500 text-white" : "bg-white border border-slate-200 text-slate-300"
              )}>
                {step > s ? <Check size={14} /> : s}
              </div>
              {s < 4 && <div className={cn("w-4 md:w-6 h-[2px] mx-1", step > s ? "bg-emerald-500" : "bg-slate-100")} />}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Search Patient */}
      {step === 1 && (
        <div className="bg-white rounded-[32px] md:rounded-[40px] border border-slate-100 shadow-soft p-8 md:p-12 text-center space-y-6 md:space-y-8 animate-in zoom-in-95 duration-300">
          <div className="h-16 w-16 md:h-24 md:w-24 rounded-2xl md:rounded-[32px] bg-primary/10 flex items-center justify-center text-primary mx-auto">
            <Search size={32} />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">Patient Lookup</h2>
            <p className="text-xs md:text-sm text-slate-500 font-medium">Enter patient's registered phone number to pull existing records.</p>
          </div>
          
          <div className="max-w-md mx-auto flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative group">
              <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input 
                type="tel" 
                placeholder="Phone Number (10 digits)"
                className="w-full pl-12 pr-6 py-4 md:py-5 rounded-2xl md:rounded-[24px] bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all font-black text-slate-700 tracking-wider text-sm md:text-base"
                value={phoneSearch}
                onChange={(e) => setPhoneSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button 
              onClick={handleSearch}
              disabled={isSearching}
              className="h-14 md:h-[68px] w-full md:w-[68px] rounded-2xl md:rounded-[24px] bg-primary text-white flex items-center justify-center hover:bg-slate-900 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 font-black text-xs md:text-base uppercase tracking-widest md:tracking-normal"
            >
              {isSearching ? <Loader2 className="animate-spin" /> : <><span className="md:hidden">Search Patient</span><ArrowRight className="hidden md:block" /></>}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Identification / Registration */}
      {step === 2 && (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-soft p-10 animate-in slide-in-from-right-4 duration-500">
           {isNewPatient ? (
             <div className="space-y-8">
                <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                  <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">New Patient Registration</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Please fill in details for record creation</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Doe"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary outline-none transition-all font-bold"
                      value={patientForm.name}
                      onChange={(e) => setPatientForm({...patientForm, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="e.g. john@example.com"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary outline-none transition-all font-bold"
                      value={patientForm.email}
                      onChange={(e) => setPatientForm({...patientForm, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Age</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 25"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary outline-none transition-all font-bold"
                      value={patientForm.age}
                      onChange={(e) => setPatientForm({...patientForm, age: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                    <select 
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary outline-none transition-all font-bold"
                      value={patientForm.gender}
                      onChange={(e) => setPatientForm({...patientForm, gender: e.target.value})}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={() => setStep(1)} className="flex-1 py-5 rounded-[20px] border-2 border-slate-100 font-black text-slate-400 uppercase tracking-widest text-xs hover:bg-slate-50 transition-all">Cancel</button>
                  <button 
                    onClick={() => validateForm() && createPatientMutation.mutate(patientForm)}
                    disabled={createPatientMutation.isPending}
                    className="flex-[2] py-5 rounded-[20px] bg-primary text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:bg-slate-900 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {createPatientMutation.isPending ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={18} /> Register & Proceed</>}
                  </button>
                </div>
             </div>
           ) : (
             <div className="text-center space-y-8 py-10">
                <div className="h-20 w-20 rounded-full bg-emerald-50 text-emerald-500 mx-auto flex items-center justify-center">
                  <Check size={40} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{selectedPatient?.name}</h3>
                  <p className="text-sm text-slate-400 font-medium">Record confirmed. Proceed to select tests.</p>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                    <Phone size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">{selectedPatient?.phone}</span>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">{selectedPatient?.email}</span>
                  </div>
                </div>
                <div className="flex gap-4 max-w-sm mx-auto pt-6">
                  <button onClick={() => setStep(1)} className="flex-1 py-4 rounded-2xl border-2 border-slate-100 font-black text-slate-400 uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all">Change</button>
                  <button onClick={() => setStep(3)} className="flex-[2] py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:bg-slate-900 transition-all">Select Tests</button>
                </div>
             </div>
           )}
        </div>
      )}

      {/* Step 3: Select Tests */}
      {step === 3 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
           <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-soft flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Select Pathology Tests</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Select one or more tests for the patient</p>
              </div>
              <div className="bg-primary/10 text-primary px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest">
                {selectedTests.length} Tests Selected
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allTests?.map((test: any) => {
                const isSelected = selectedTests.find(t => t.id === test.id);
                return (
                  <div 
                    key={test.id} 
                    onClick={() => {
                      setSelectedTests(prev => 
                        isSelected ? prev.filter(t => t.id !== test.id) : [...prev, test]
                      );
                    }}
                    className={cn(
                      "p-5 rounded-3xl border-2 transition-all cursor-pointer group flex items-center justify-between",
                      isSelected ? "border-primary bg-primary/5 ring-4 ring-primary/5" : "bg-white border-slate-100 hover:border-primary/20"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                        isSelected ? "bg-primary text-white" : "bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary"
                      )}>
                        {isSelected ? <Check size={18} /> : <Plus size={18} />}
                      </div>
                      <div>
                        <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight">{test.name}</h5>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{test.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-800 block">₹{test.price}</span>
                    </div>
                  </div>
                );
              })}
           </div>

           <div className="flex gap-4 pt-6">
              <button onClick={() => setStep(2)} className="flex-1 py-5 rounded-[24px] border-2 border-slate-100 font-black text-slate-400 uppercase tracking-widest text-xs hover:bg-slate-50 transition-all">Back</button>
              <button 
                onClick={() => setStep(4)} 
                disabled={selectedTests.length === 0}
                className="flex-[2] py-5 rounded-[24px] bg-primary text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:bg-slate-900 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                Continue to Payment <ArrowRight size={18} />
              </button>
           </div>
        </div>
      )}

      {/* Step 4: Final Summary & Payment */}
      {step === 4 && (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-soft overflow-hidden animate-in zoom-in-95 duration-500">
           <div className="p-10 border-b border-slate-50 bg-slate-50/50">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-primary shadow-sm">
                    <ClipboardCheck size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Booking Summary</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Please verify details before printing receipt</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction ID</p>
                  <p className="text-sm font-black text-slate-800">WALKIN-{Date.now().toString().slice(-6)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Details</span>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Name</span>
                      <span className="text-xs font-black text-slate-800">{selectedPatient.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Phone</span>
                      <span className="text-xs font-black text-slate-800">{selectedPatient.phone}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Gender / Age</span>
                      <span className="text-xs font-black text-slate-800">{selectedPatient.gender} / {selectedPatient.age}Y</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Tests</span>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 divide-y divide-slate-50">
                    {selectedTests.map(t => (
                      <div key={t.id} className="py-2.5 flex justify-between items-center first:pt-0 last:pb-0">
                        <span className="text-[11px] font-bold text-slate-800 truncate pr-4">{t.name}</span>
                        <span className="text-[11px] font-black text-primary">₹{t.price}</span>
                      </div>
                    ))}
                    <div className="pt-4 mt-2 flex justify-between items-center">
                      <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Total Bill</span>
                      <span className="text-lg font-black text-slate-800">₹{selectedTests.reduce((s, t) => s + t.price, 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
           </div>

           <div className="p-10 flex gap-4">
              <button onClick={() => setStep(3)} className="flex-1 py-5 rounded-[24px] border-2 border-slate-100 font-black text-slate-400 uppercase tracking-widest text-xs hover:bg-slate-50 transition-all">Go Back</button>
              <button 
                onClick={finalizeBooking}
                disabled={createBookingMutation.isPending}
                className="flex-[2] py-5 rounded-[24px] bg-primary text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:bg-slate-900 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {createBookingMutation.isPending ? <Loader2 className="animate-spin" /> : <><Check size={20} /> Collect Cash & Finalize</>}
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default PathologyWalkin;
