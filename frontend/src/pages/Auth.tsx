import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Phone, 
  Lock, 
  User, 
  Mail, 
  ArrowRight, 
  Loader2, 
  MapPin, 
  Scale, 
  Ruler, 
  Calendar,
  ChevronLeft,
  LogIn,
  UserPlus,
  Beaker
} from "lucide-react";
import { cn } from "@/lib/utils";
import apiClient from "@/api/apiClient";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  
  const [authType, setAuthType] = useState<"patient" | "pathology">("patient");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    labId: "",
    addressLine1: "",
    pincode: "",
    dob: "",
    age: "",
    gender: "Male",
    height: "",
    weight: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.name || !formData.email) {
        toast.error("Please fill all fields");
        return;
      }
      setLoading(true);
      try {
        await apiClient.post('/auth/signup/step1', { name: formData.name, email: formData.email });
        setStep(2);
      } catch (err: any) {
        toast.error(err.response?.data?.error || "Signup failed");
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      if (!formData.phone || !formData.pincode) {
        toast.error("Phone and Pincode are required");
        return;
      }
      setStep(3);
    } else {
      handleSignup();
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/signup', formData);
      localStorage.setItem('user', JSON.stringify(response.data));
      toast.success("Account Created!", {
        description: "Welcome to BookMyPathology. You can now access your dashboard."
      });
      navigate(`/patient/${response.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authType === "patient") {
        if (!formData.phone || !formData.password) {
          toast.error("Please fill all fields");
          setLoading(false);
          return;
        }
        const response = await apiClient.post('/auth/login', { 
          phone: formData.phone, 
          password: formData.password 
        });
        localStorage.setItem('user', JSON.stringify(response.data));
        if (response.data.role === 'admin') {
          toast.success("Welcome back, Admin!");
          navigate("/admin");
        } else {
          toast.success(`Welcome back, ${response.data.name}!`);
          navigate(`/patient/${response.data.id}`);
        }
      } else {
        if (!formData.labId || !formData.password) {
          toast.error("Please fill all fields");
          setLoading(false);
          return;
        }
        const response = await apiClient.post('/auth/lab/login', { 
          labId: formData.labId, 
          password: formData.password 
        });
        localStorage.setItem('user', JSON.stringify(response.data));
        toast.success(`Lab Authenticated: ${response.data.name}`);
        navigate(`/pathology/${response.data.id}/dashboard`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-900">
      {/* Dynamic Cloud/Fog Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-40 mix-blend-overlay animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 via-slate-900/80 to-slate-900" />
        
        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-[120px] animate-float-delayed" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] px-6 py-6 animate-in fade-in zoom-in duration-700">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-[40px] shadow-2xl p-8 flex flex-col items-center">
          
          {/* Top Icon Area */}
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-6 transition-all duration-500 overflow-hidden border border-slate-100 shadow-sm">
            <img src="/logo.png" alt="BookMyPathology" className="h-10 w-auto object-contain" />
          </div>

          <h1 className="text-2xl font-black text-white text-center mb-2 tracking-tight">
            {isLoginPage ? "Sign In" : "Create Account"}
          </h1>
          
          {/* Type Toggle - Only for Login */}
          {isLoginPage && (
            <div className="flex bg-white/5 p-1 rounded-xl mb-6 w-full border border-white/10">
              <button 
                onClick={() => setAuthType("patient")}
                className={cn(
                  "flex-1 py-2 rounded-lg text-[10px] font-black transition-all",
                  authType === "patient" ? "bg-white text-primary shadow-lg" : "text-slate-400 hover:text-white"
                )}
              >
                PATIENT
              </button>
              <button 
                onClick={() => setAuthType("pathology")}
                className={cn(
                  "flex-1 py-2 rounded-lg text-[10px] font-black transition-all",
                  authType === "pathology" ? "bg-white text-primary shadow-lg" : "text-slate-400 hover:text-white"
                )}
              >
                PATHOLOGY
              </button>
            </div>
          )}

          <p className="text-slate-300 text-center text-xs mb-8 font-medium leading-relaxed px-4">
            {isLoginPage 
              ? (authType === "patient" ? "Access your diagnostic history and AI insights." : "Manage lab bookings and reports.")
              : `Step ${step} of 3: ${step === 1 ? "Basic Info" : step === 2 ? "Physical Metrics" : "Secure Password"}`
            }
          </p>

          <form onSubmit={isLoginPage ? handleLogin : handleNext} className="w-full space-y-3">
            {isLoginPage ? (
              <>
                {authType === "patient" ? (
                  <AuthField 
                    icon={Phone} 
                    placeholder="Phone Number" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                  />
                ) : (
                  <AuthField 
                    icon={Beaker} 
                    placeholder="Lab ID (e.g. LAB-1)" 
                    name="labId" 
                    value={formData.labId} 
                    onChange={handleChange} 
                  />
                )}
                <AuthField 
                  icon={Lock} 
                  type="password" 
                  placeholder="Password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                />
              </>
            ) : (
              <>
                {step === 1 && (
                  <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                    <AuthField 
                      icon={User} 
                      placeholder="Full Name" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange} 
                    />
                    <AuthField 
                      icon={Mail} 
                      type="email" 
                      placeholder="Email Address" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                    />
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                    <AuthField 
                      icon={Phone} 
                      placeholder="Phone Number" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleChange} 
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <AuthField 
                        icon={Calendar} 
                        placeholder="Age" 
                        name="age" 
                        value={formData.age} 
                        onChange={handleChange} 
                        type="number"
                      />
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User size={18} className="text-slate-400" />
                        </div>
                        <select 
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none focus:bg-white/10 focus:border-white/30 transition-all appearance-none"
                        >
                          <option value="Male" className="bg-slate-900">Male</option>
                          <option value="Female" className="bg-slate-900">Female</option>
                          <option value="Other" className="bg-slate-900">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <AuthField 
                        icon={Ruler} 
                        placeholder="Height (cm)" 
                        name="height" 
                        value={formData.height} 
                        onChange={handleChange} 
                        type="number"
                      />
                      <AuthField 
                        icon={Scale} 
                        placeholder="Weight (kg)" 
                        name="weight" 
                        value={formData.weight} 
                        onChange={handleChange} 
                        type="number"
                      />
                    </div>
                    <AuthField 
                      icon={MapPin} 
                      placeholder="Pincode" 
                      name="pincode" 
                      value={formData.pincode} 
                      onChange={handleChange} 
                    />
                  </div>
                )}
                {step === 3 && (
                  <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                    <AuthField 
                      icon={Lock} 
                      type="password" 
                      placeholder="Set Password" 
                      name="password" 
                      value={formData.password} 
                      onChange={handleChange} 
                    />
                  </div>
                )}
              </>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-white text-primary font-black uppercase tracking-widest text-[10px] shadow-xl shadow-white/10 hover:bg-slate-50 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : (isLoginPage ? "Secure Sign In" : step < 3 ? "Continue" : "Finalize Signup")}
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>

          {/* Bottom Actions */}
          <div className="mt-6 flex flex-col items-center gap-3">
            {!isLoginPage && step > 1 && (
              <button 
                onClick={() => setStep(step - 1)}
                className="text-slate-400 text-xs font-bold flex items-center gap-2 hover:text-white transition-colors"
              >
                <ChevronLeft size={14} /> Back to step {step - 1}
              </button>
            )}
            
            {authType === "patient" && (
              <button 
                onClick={() => {
                  navigate(isLoginPage ? "/signup" : "/login");
                  setStep(1);
                }}
                className="text-white/60 text-xs font-bold hover:text-white transition-colors"
              >
                {isLoginPage ? "New patient? Create an account" : "Already have an account? Login"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthField = ({ icon: Icon, type = "text", ...props }: any) => (
  <div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
      <Icon size={16} className="text-slate-400 group-focus-within:text-white transition-colors" />
    </div>
    <input 
      type={type}
      className="w-full pl-10 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white outline-none focus:bg-white/10 focus:border-white/30 transition-all placeholder:text-slate-500"
      {...props}
    />
  </div>
);

export default Auth;
