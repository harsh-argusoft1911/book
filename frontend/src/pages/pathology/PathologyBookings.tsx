import React, { useState, useRef } from "react";
import { 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  User as UserIcon,
  CreditCard,
  RefreshCcw,
  CheckCircle2,
  Clock,
  Truck,
  ArrowUpDown,
  Upload,
  FileText
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/api/apiClient";
import { toast } from "sonner";
import { useParams } from "react-router-dom";

const PathologyBookings = () => {
  const { labId } = useParams();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings', labId],
    queryFn: async () => {
      const response = await apiClient.get(`/bookings?labId=${labId}`);
      return response.data.sort((a: any, b: any) => 
        new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
      );
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const response = await apiClient.patch(`/bookings/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', labId] });
      toast.success("Status Updated");
    },
  });

  const uploadReportMutation = useMutation({
    mutationFn: async ({ id, reportUrl }: { id: string, reportUrl: string }) => {
      // One call: saves reportUrl + sets status to COMPLETED atomically in the backend
      const response = await apiClient.patch(`/bookings/${id}/report`, { reportUrl });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', labId] });
      toast.success("Report Uploaded & Finalized", {
        description: "Patient can now view their report."
      });
    },
    onError: () => {
      toast.error("Upload Failed", { description: "Could not save the report. Try again." });
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadId) return;

    const toastId = "upload-toast";
    toast.loading("Uploading report...", { id: toastId });

    try {
      // Step 1: Upload the actual PDF file to the backend
      const formData = new FormData();
      formData.append('report', file);
      const uploadRes = await apiClient.post('/bookings/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const { url } = uploadRes.data;

      // Step 2: Save the real URL + finalize the order
      uploadReportMutation.mutate({ id: activeUploadId, reportUrl: url });
    } catch (err) {
      toast.error("Upload Failed", { description: "Could not upload the PDF. Try again.", id: toastId });
    } finally {
      toast.dismiss(toastId);
      setActiveUploadId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const triggerUpload = (id: string) => {
    setActiveUploadId(id);
    fileInputRef.current?.click();
  };

  if (bookingsLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED": return "bg-blue-50 text-blue-600 border-blue-100";
      case "PICKEDUP": return "bg-amber-50 text-amber-600 border-amber-100";
      case "REPORT_GENERATED": return "bg-purple-50 text-purple-600 border-purple-100";
      case "COMPLETED": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      default: return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "SCHEDULED": return "Scheduled";
      case "PICKEDUP": return "Picked Up";
      case "REPORT_GENERATED": return "Report Ready";
      case "COMPLETED": return "✓ Finalized";
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "bg-rose-50 text-rose-600 border-rose-100";
      case "MEDIUM": return "bg-blue-50 text-blue-600 border-blue-100";
      case "LOW": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      default: return "bg-slate-50 text-slate-400 border-slate-100";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".pdf"
        onChange={handleFileUpload}
      />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Daily Bookings</h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1">Manage today's schedule and track test statuses.</p>
        </div>
        <div className="flex items-center justify-center md:justify-end gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs md:text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      {/* Modern Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 flex-1 w-full md:max-w-md">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search Patient or Booking ID..." 
            className="bg-transparent border-none outline-none text-xs md:text-sm w-full text-slate-600 placeholder:text-slate-400 font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-primary/5 rounded-lg border border-primary/10 text-primary text-[9px] md:text-[10px] font-black uppercase tracking-widest">
           <ArrowUpDown size={12} /> <span className="hidden xs:inline">Sorted by Appointment Time</span><span className="xs:hidden">Appointment Time</span>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-x-auto no-scrollbar">
        <Table className="min-w-[800px]">
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="w-[140px] text-[10px] font-black uppercase tracking-widest text-slate-400 pl-8">Booking</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scheduled For</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Patient Details</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tests Included</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right pr-8">Status / Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(bookings || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-20 text-center text-slate-400 font-medium">
                  No bookings found for this lab.
                </TableCell>
              </TableRow>
            ) : (
              (bookings || []).filter((b:any) => !searchQuery || b.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.bookingId.toLowerCase().includes(searchQuery.toLowerCase())).map((booking: any) => (
                <TableRow key={booking.id} className="hover:bg-slate-50/50 border-slate-50 group transition-colors">
                  <TableCell className="py-6 pl-8">
                    <div className="text-sm font-black text-slate-800 uppercase tracking-tight">#{booking.bookingId}</div>
                    <div className={cn(
                      "text-[9px] font-black uppercase tracking-widest mt-1 px-2 py-0.5 rounded-md inline-block border",
                      getPriorityColor(booking.priority)
                    )}>
                       {booking.priority}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <Clock size={14} className="text-slate-400" />
                       <span className="text-sm font-bold text-slate-700">{booking.timeSlot}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium mt-1">
                       {new Date(booking.appointmentDate).toLocaleDateString(undefined, { weekday: 'long' })}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black border border-slate-200 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-all">
                         {booking.patient.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 leading-tight">{booking.patient.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight mt-1">{booking.patient.phone || "No Phone"}</p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                     <div className="flex flex-wrap gap-1 max-w-[250px]">
                        {booking.tests.map((t: any) => (
                           <span key={t.id} className="text-[9px] font-black px-2 py-1 bg-white border border-slate-100 text-slate-600 rounded-lg shadow-sm">
                              {t.name}
                           </span>
                        ))}
                     </div>
                  </TableCell>

                  <TableCell className="text-right pr-8">
                    <div className="flex items-center justify-end gap-3">
                       {booking.status === 'REPORT_GENERATED' && (
                          <button 
                             onClick={() => triggerUpload(booking.id)}
                             className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border bg-white text-primary border-primary/20 hover:bg-primary hover:text-white"
                          >
                             <Upload size={14} /> Upload PDF
                          </button>
                       )}

                       {booking.status === 'COMPLETED' ? (
                          // Finalized: show locked badge, no dropdown
                          <span className={cn(
                            "px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2",
                            getStatusColor(booking.status)
                          )}>
                             <CheckCircle2 size={14} /> Finalized
                          </span>
                       ) : (
                          // All other statuses: show dropdown
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                               <button className={cn(
                                  "px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all inline-flex items-center gap-2 shadow-sm",
                                  getStatusColor(booking.status)
                               )}>
                                  {getStatusLabel(booking.status)}
                                  <ChevronRight size={12} className="opacity-50" />
                               </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 p-2 rounded-2xl shadow-2xl border-slate-100">
                               <div className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Move to Status</div>
                               <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'SCHEDULED' })} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-blue-50 text-blue-600 focus:bg-blue-50">
                                  <Clock size={16} /> <span className="text-xs font-black uppercase tracking-widest">Scheduled</span>
                               </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'PICKEDUP' })} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-amber-50 text-amber-600 focus:bg-amber-50">
                                  <Truck size={16} /> <span className="text-xs font-black uppercase tracking-widest">Picked Up</span>
                               </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'REPORT_GENERATED' })} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-purple-50 text-purple-600 focus:bg-purple-50">
                                  <CheckCircle2 size={16} /> <span className="text-xs font-black uppercase tracking-widest">Report Ready</span>
                               </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                       )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PathologyBookings;
