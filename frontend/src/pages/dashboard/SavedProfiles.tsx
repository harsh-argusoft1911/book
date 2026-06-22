import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User, Plus, FileText, Activity, ArrowRight, ShieldCheck, Calendar, X, Loader2, Weight, Ruler, Mail, Phone, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/api/apiClient";
import { toast } from "sonner";

const SavedProfiles = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [active, setActive] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Male",
    relation: "Other",
    height: "",
    weight: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    pincode: ""
  });

  // Fetch all saved profiles
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['family', patientId],
    queryFn: async () => {
      const response = await apiClient.get(`/family/${patientId}`);
      return response.data;
    }
  });

  useEffect(() => {
    if (members && members.length > 0 && !active) {
      setActive(members[0].id);
    }
  }, [members]);

  // Fetch activity for the ACTIVE profile
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', active],
    queryFn: async () => {
      const response = await apiClient.get(`/bookings?patientId=${active}`);
      return response.data;
    },
    enabled: !!active
  });

  // Fetch stats for the ACTIVE profile (to get health score)
  const { data: stats } = useQuery({
    queryKey: ['patientStats', active],
    queryFn: async () => {
      const response = await apiClient.get(`/patients/${active}/stats`);
      return response.data;
    },
    enabled: !!active
  });

  const addMemberMutation = useMutation({
    mutationFn: async (newData: any) => {
      const response = await apiClient.post(`/family/${patientId}`, newData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family', patientId] });
      setShowModal(false);
      setFormData({ 
        name: "", age: "", gender: "Male", relation: "Other", 
        height: "", weight: "", email: "", phone: "", 
        addressLine1: "", addressLine2: "", pincode: "" 
      });
      toast.success("Profile Saved!", {
        description: "New profile has been successfully added to your account."
      });
    },
    onError: (error: any) => {
      toast.error("Failed to add profile", {
        description: error.response?.data?.error || "Please check your input and try again."
      });
    }
  });

  const currentMember = members?.find((m: any) => m.id === active);
  const latestOrder = orders?.[0];

  const validateForm = () => {
    if (!formData.name) return "Name is required";
    if (!formData.phone || formData.phone.length !== 10) return "Phone number must be 10 digits";
    if (formData.email && !formData.email.includes("@")) return "Invalid email format";
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }
    addMemberMutation.mutate(formData);
  };

  if (membersLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
      </div>
    );
  }

  // Handle score display logic
  const displayScore = stats?.healthScore && stats.healthScore !== "N/A" 
    ? stats.healthScore.split('/')[0] 
    : "--";

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h3 className="text-lg md:text-xl font-bold text-primary uppercase tracking-tight">Saved Profiles</h3>
          <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Manage health records and addresses for your loved ones</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 md:py-2.5 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary-glow shadow-glow transition-all"
        >
          <Plus className="h-3.5 w-3.5" /> Add Profile
        </button>
      </div>

      {/* Member Selection Row */}
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {members?.map((m: any) => (
          <button
            key={m.id}
            onClick={() => setActive(m.id)}
            className={cn(
              "flex items-center gap-3 min-w-[160px] p-3 rounded-xl border transition-all text-left shrink-0",
              active === m.id ? "bg-primary border-primary text-primary-foreground shadow-sm scale-105" : "bg-card border-border text-muted-foreground hover:bg-secondary"
            )}
          >
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
              active === m.id ? "bg-white/20" : "bg-secondary"
            )}>
              <User className={cn("h-5 w-5", active === m.id ? "text-white" : "text-primary/40")} />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold truncate leading-tight">{m.name}</div>
              <div className="text-[8px] uppercase font-bold opacity-60 tracking-wider mt-0.5">{m.relation || "Self"}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Active Member Data */}
      {currentMember && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-scale-in">
           <div className="lg:col-span-1 space-y-4">
              <div className="rounded-2xl bg-card border border-border p-6 shadow-soft flex flex-col items-center text-center">
                 <div className="h-20 w-20 rounded-full bg-surface-mint flex items-center justify-center mb-4 relative">
                    <span className="text-xl font-extrabold text-emerald-700">{displayScore}</span>
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin-slow opacity-20" />
                 </div>
                 <h4 className="text-lg font-bold text-primary">{currentMember.name}</h4>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{currentMember.relation || "Self"} · {currentMember.age || "--"} years</p>
                 
                 <div className="w-full space-y-3 mt-6 pt-6 border-t border-border text-left">
                    <div className="flex items-center gap-3 text-muted-foreground">
                       <Mail className="h-3.5 w-3.5 text-primary/60" />
                       <span className="text-[10px] font-bold truncate">{currentMember.email || "No email"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                       <Phone className="h-3.5 w-3.5 text-primary/60" />
                       <span className="text-[10px] font-bold">{currentMember.phone || "No phone"}</span>
                    </div>
                    <div className="flex items-start gap-3 text-muted-foreground">
                       <MapPin className="h-3.5 w-3.5 text-primary/60 mt-0.5 shrink-0" />
                       <span className="text-[10px] font-bold leading-relaxed line-clamp-2">
                        {currentMember.addressLine1 || "No address provided"}
                        {currentMember.addressLine2 ? `, ${currentMember.addressLine2}` : ""}
                        {currentMember.pincode ? ` - ${currentMember.pincode}` : ""}
                       </span>
                    </div>
                 </div>

                 <div className="w-full grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
                    <div className="text-center">
                       <div className="text-[9px] font-bold text-primary uppercase tracking-widest flex items-center justify-center gap-1.5"><Ruler size={10}/> Height</div>
                       <div className="text-base font-extrabold text-primary/60 mt-1">{currentMember.height || "--"} <span className="text-[10px]">cm</span></div>
                    </div>
                    <div className="text-center">
                       <div className="text-[9px] font-bold text-primary uppercase tracking-widest flex items-center justify-center gap-1.5"><Weight size={10}/> Weight</div>
                       <div className="text-base font-extrabold text-primary/60 mt-1">{currentMember.weight || "--"} <span className="text-[10px]">kg</span></div>
                    </div>
                 </div>
              </div>

              <div className="rounded-2xl bg-gradient-cta p-5 text-accent-foreground shadow-card space-y-3">
                 <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    <h4 className="font-bold text-xs uppercase tracking-tight">Active Profile</h4>
                 </div>
                 <p className="text-[10px] leading-relaxed opacity-90 font-medium italic">This profile is ready for test bookings with saved details.</p>
              </div>
           </div>

           <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl bg-card border border-border p-6 shadow-soft">
                 <div className="flex items-center justify-between mb-6">
                    <h4 className="font-bold text-base text-primary flex items-center gap-2 uppercase tracking-tight">
                       <FileText className="h-4 w-4" /> Recent Bookings
                    </h4>
                    <button 
                      onClick={() => navigate(`/patient/${active}/reports`)}
                      className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
                    >
                      Full History
                    </button>
                 </div>

                 <div className="space-y-4">
                    {ordersLoading ? (
                      <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                    ) : latestOrder ? (
                      <div className="p-5 rounded-xl bg-secondary/30 border border-border flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-lg bg-card flex items-center justify-center border border-border shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                              <Activity className="h-5 w-5 text-primary group-hover:text-white transition-all" />
                           </div>
                           <div>
                              <div className="text-sm font-bold text-primary truncate max-w-[250px]">
                                {latestOrder.tests?.map((t: any) => t.name).join(', ')}
                              </div>
                              <div className="text-[9px] text-muted-foreground mt-1 uppercase font-bold tracking-widest flex items-center gap-1.5">
                                 <Calendar className="h-3 w-3" /> {latestOrder.timeSlot}
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-[8px] font-black px-2 py-1 rounded-full border uppercase tracking-widest",
                            latestOrder.status === 'REPORT_GENERATED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100"
                          )}>
                            {latestOrder.status.replace('_', ' ')}
                          </span>
                          <button 
                            onClick={() => navigate(`/patient/${active}/reports`)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-border text-[9px] font-bold text-primary uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                          >
                             View <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-center opacity-60">
                         <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No medical history found for {currentMember.name.split(' ')[0]}</p>
                         <button 
                           onClick={() => navigate(`/patient/${patientId}/book`)}
                           className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
                         >
                           Book First Test
                         </button>
                      </div>
                    )}
                 </div>
              </div>

              <div className="rounded-2xl bg-primary text-primary-foreground p-6 shadow-card flex items-center justify-between gap-6 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="h-24 w-24" />
                 </div>
                 <div className="relative z-10 space-y-3">
                    <h4 className="text-lg font-bold uppercase tracking-tight">Health Vault</h4>
                    <p className="text-[10px] opacity-80 leading-relaxed max-w-xs font-medium">Securely store prescriptions and medical history for {currentMember.name.split(' ')[0]}.</p>
                    <button 
                      onClick={() => navigate(`/patient/${patientId}/vault?for=${active}`)}
                      className="px-5 py-2 rounded-lg bg-accent text-accent-foreground text-[9px] font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-glow"
                    >
                      Open Vault
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Modal - Visible without scroll */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in my-8">
            <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
              <h3 className="text-sm font-bold text-primary uppercase tracking-tight">New Saved Profile</h3>
              <button onClick={() => setShowModal(false)} className="h-6 w-6 rounded-full hover:bg-secondary flex items-center justify-center">
                <X size={14} />
              </button>
            </div>

            <form className="p-6 space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-2">Basic Information</h4>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Full Name *</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Relation</label>
                      <select 
                        className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        value={formData.relation}
                        onChange={(e) => setFormData({...formData, relation: e.target.value})}
                      >
                        <option>Spouse</option>
                        <option>Child</option>
                        <option>Father</option>
                        <option>Mother</option>
                        <option>Sibling</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Age *</label>
                      <input 
                        required
                        type="number" 
                        className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        value={formData.age}
                        onChange={(e) => setFormData({...formData, age: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Gender</label>
                    <div className="flex gap-2 p-1 bg-secondary rounded-lg border border-border">
                      {["Male", "Female", "Other"].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setFormData({...formData, gender: g})}
                          className={cn(
                            "flex-1 py-1.5 rounded text-[9px] font-bold uppercase transition-all",
                            formData.gender === g ? "bg-card text-primary shadow-sm border border-border" : "text-muted-foreground"
                          )}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-1.5"><Ruler size={10}/> Height (cm)</label>
                      <input 
                        type="number" 
                        className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        value={formData.height}
                        onChange={(e) => setFormData({...formData, height: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-1.5"><Weight size={10}/> Weight (kg)</label>
                      <input 
                        type="number" 
                        className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        value={formData.weight}
                        onChange={(e) => setFormData({...formData, weight: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-2">Contact & Address</h4>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Email</label>
                    <input 
                      type="email" 
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Phone Number *</label>
                    <input 
                      required
                      type="tel" 
                      maxLength={10}
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Address Line 1</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={formData.addressLine1}
                      onChange={(e) => setFormData({...formData, addressLine1: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Line 2</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        value={formData.addressLine2}
                        onChange={(e) => setFormData({...formData, addressLine2: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Pincode</label>
                      <input 
                        type="text" 
                        maxLength={6}
                        className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        value={formData.pincode}
                        onChange={(e) => setFormData({...formData, pincode: e.target.value.replace(/\D/g, '')})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={addMemberMutation.isPending}
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-primary-glow shadow-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {addMemberMutation.isPending ? <Loader2 className="animate-spin" /> : "Save Profile"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedProfiles;
