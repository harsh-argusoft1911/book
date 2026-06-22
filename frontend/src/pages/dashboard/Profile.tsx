import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Save, 
  Loader2, 
  CheckCircle,
  Hash,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/api/apiClient";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";

// Custom styles for premium interactions
const dateInputStyles = `
  .date-field-container::after {
    content: '';
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23161F5A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='16' y1='2' x2='16' y2='6'%3E%3C/line%3E%3Cline x1='8' y1='2' x2='8' y2='6'%3E%3C/line%3E%3Cline x1='3' y1='10' x2='21' y2='10'%3E%3C/line%3E%3C/svg%3E") no-repeat center;
    background-size: contain;
    pointer-events: none;
    opacity: 0.5;
    transition: all 0.3s ease;
  }
  
  .date-field-container:focus-within::after {
    opacity: 1;
    transform: translateY(-50%) scale(1.1);
  }
`;

const Profile = () => {
  const { patientId } = useParams();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    addressLine1: "",
    addressLine2: "",
    pincode: "",
    dob: ""
  });

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      const response = await apiClient.get(`/patients/${patientId}`);
      return response.data;
    }
  });

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || "",
        email: patient.email || "",
        phone: patient.phone || "",
        whatsapp: patient.whatsapp || "",
        addressLine1: patient.addressLine1 || "",
        addressLine2: patient.addressLine2 || "",
        pincode: patient.pincode || "",
        dob: patient.dob ? new Date(patient.dob).toISOString().split('T')[0] : ""
      });
    }
  }, [patient]);

  const updateMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const response = await apiClient.post(`/patients/${patientId}`, updatedData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patientStats', patientId] });
      toast.success("Profile Updated", {
        description: "Your personal information has been successfully saved."
      });
    },
    onError: () => {
      toast.error("Update Failed", {
        description: "We couldn't save your profile. Please try again."
      });
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <style>{dateInputStyles}</style>
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center gap-8 bg-white p-10 rounded-[40px] border border-slate-100 shadow-soft">
        <div className="relative">
          <div className="h-32 w-32 rounded-[40px] bg-primary/10 flex items-center justify-center text-primary border-4 border-white shadow-xl">
            <User size={60} strokeWidth={1.5} />
          </div>
          <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white border-4 border-white shadow-lg">
            <CheckCircle size={20} />
          </div>
        </div>
        <div className="text-center md:text-left space-y-2">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">{formData.name || "Set Your Name"}</h1>
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 flex items-center gap-2">
              <Hash size={12} className="text-primary" /> {patientId}
            </span>
            <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 flex items-center gap-2">
              Verified Account
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Personal Details */}
        <div className="space-y-6 bg-white p-10 rounded-[40px] border border-slate-100 shadow-soft">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
             <div className="h-6 w-1 bg-primary rounded-full" /> Personal Details
          </h3>
          
          <div className="space-y-4">
            <ProfileField 
              label="Full Name" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              icon={User} 
              placeholder="e.g. John Doe"
            />
            <ProfileField 
              label="Email Address" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              icon={Mail} 
              placeholder="john@example.com"
              type="email"
            />
            <ProfileField 
              label="Date of Birth" 
              name="dob" 
              value={formData.dob} 
              onChange={(val: string) => setFormData(prev => ({ ...prev, dob: val }))} 
              icon={Calendar} 
              type="custom-date"
            />
          </div>
        </div>

        {/* Contact Details */}
        <div className="space-y-6 bg-white p-10 rounded-[40px] border border-slate-100 shadow-soft">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
             <div className="h-6 w-1 bg-primary rounded-full" /> Contact Info
          </h3>
          
          <div className="space-y-4">
            <ProfileField 
              label="Phone Number" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange} 
              icon={Phone} 
              placeholder="+91 98765 43210"
            />
            <ProfileField 
              label="WhatsApp Number" 
              name="whatsapp" 
              value={formData.whatsapp} 
              onChange={handleChange} 
              icon={MessageSquare} 
              placeholder="+91 98765 43210"
            />
          </div>
        </div>

        {/* Address Details */}
        <div className="md:col-span-2 space-y-6 bg-white p-10 rounded-[40px] border border-slate-100 shadow-soft">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
             <div className="h-6 w-1 bg-primary rounded-full" /> Delivery Address
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <ProfileField 
                label="Address Line 1" 
                name="addressLine1" 
                value={formData.addressLine1} 
                onChange={handleChange} 
                icon={MapPin} 
                placeholder="House No, Building Name, Street"
              />
            </div>
            <ProfileField 
              label="Address Line 2 (Optional)" 
              name="addressLine2" 
              value={formData.addressLine2} 
              onChange={handleChange} 
              icon={MapPin} 
              placeholder="Landmark, Area"
            />
            <ProfileField 
              label="Pincode" 
              name="pincode" 
              value={formData.pincode} 
              onChange={handleChange} 
              icon={Hash} 
              placeholder="400001"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="md:col-span-2 flex justify-end">
          <button 
            type="submit"
            disabled={updateMutation.isPending}
            className="group flex items-center gap-3 bg-primary text-white px-12 py-5 rounded-[24px] font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-900 transition-all shadow-2xl shadow-primary/30 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} className="group-hover:scale-110 transition-transform" />
            )}
            {updateMutation.isPending ? "Saving..." : "Save Profile Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

const ProfileField = ({ label, icon: Icon, value, onChange, name, placeholder, type = "text" }: any) => {
  const isDate = type === "custom-date";
  
  return (
    <div className="space-y-2 group">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
        {label}
      </label>
      <div className={cn("relative", isDate && "date-field-container")}>
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
          <Icon size={16} className="text-slate-300 group-focus-within:text-primary transition-colors" />
        </div>
        
        {isDate ? (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "w-full pl-11 pr-4 py-4 bg-slate-50/50 border-2 border-slate-50 rounded-2xl text-[13px] font-bold text-left outline-none hover:bg-white hover:border-primary/20 transition-all",
                  !value ? "text-slate-200" : "text-slate-700"
                )}
              >
                {value ? format(parseISO(value), "PPP") : "Select your birthday"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-[24px] border-none shadow-2xl" align="start">
              <CalendarComponent
                mode="single"
                captionLayout="dropdown"
                fromYear={1920}
                toYear={new Date().getFullYear()}
                selected={value ? parseISO(value) : undefined}
                onSelect={(date) => {
                  if (date) {
                    onChange(format(date, "yyyy-MM-dd"));
                  }
                }}
                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                initialFocus
                className="rounded-[24px] border border-slate-100 bg-white"
              />
            </PopoverContent>
          </Popover>
        ) : (
          <input 
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full pl-11 pr-4 py-4 bg-slate-50/50 border-2 border-slate-50 rounded-2xl text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-slate-200"
          />
        )}
      </div>
    </div>
  );
};

export default Profile;
