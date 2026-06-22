import { useState } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { 
  ShieldCheck, 
  Upload, 
  Trash2, 
  Eye, 
  FileText, 
  Plus, 
  X, 
  Loader2, 
  Download,
  AlertCircle,
  FileCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/api/apiClient";
import { toast } from "sonner";

const HealthVault = () => {
  const { patientId } = useParams();
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get("for") || patientId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    name: "",
    type: "INSURANCE"
  });

  // Fetch documents for the target person
  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', targetId],
    queryFn: async () => {
      const response = await apiClient.get(`/documents/${targetId}`);
      return response.data;
    },
    enabled: !!targetId
  });

  // Fetch target patient profile for context
  const { data: targetPatient } = useQuery({
    queryKey: ['patient', targetId],
    queryFn: async () => {
      const response = await apiClient.get(`/patients/${targetId}`);
      return response.data;
    },
    enabled: !!targetId
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("No file selected");
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', uploadData.name || selectedFile.name);
      formData.append('type', uploadData.type);

      const response = await apiClient.post(`/documents/${targetId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', targetId] });
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadData({ name: "", type: "INSURANCE" });
      toast.success("Document Uploaded", {
        description: "Your document has been safely stored in the vault."
      });
    },
    onError: (error: any) => {
      toast.error("Upload Failed", {
        description: error.response?.data?.error || "An error occurred during upload."
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', targetId] });
      toast.success("Document Deleted");
    }
  });

  const getFileIcon = (filename: string) => {
    if (filename.toLowerCase().endsWith('.pdf')) return <FileText className="h-8 w-8 text-rose-500" />;
    return <FileCheck className="h-8 w-8 text-sky-500" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header Section */}
      <div className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[40px] border border-slate-100 shadow-soft flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="h-14 w-14 md:h-20 md:w-20 rounded-2xl md:rounded-[30px] bg-primary/10 flex items-center justify-center text-primary shadow-inner shrink-0">
            <ShieldCheck className="h-8 w-8 md:h-10 md:w-10" />
          </div>
          <div className="space-y-0.5 md:space-y-1">
            <h1 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight uppercase">Health Vault</h1>
            <p className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] md:tracking-[0.2em] flex items-center gap-1.5 md:gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {targetPatient?.name}'s Secure Storage
            </p>
          </div>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="w-full md:w-auto flex items-center justify-center gap-3 bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-900 transition-all shadow-xl shadow-primary/20"
        >
          <Plus size={18} /> Upload Document
        </button>
      </div>

      {/* Insurance Cards Section */}
      <div className="space-y-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-3">
           <div className="h-6 w-1 bg-primary rounded-full" /> Insurance & ID Cards
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents?.filter((d: any) => d.type === 'INSURANCE').length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 py-12 rounded-[40px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center space-y-4 opacity-60">
              <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                <AlertCircle size={32} />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Insurance cards found</p>
            </div>
          )}
          
          {documents?.filter((d: any) => d.type === 'INSURANCE').map((doc: any) => (
            <DocumentCard 
              key={doc.id} 
              doc={doc} 
              onDelete={() => deleteMutation.mutate(doc.id)} 
              icon={getFileIcon(doc.fileUrl)}
            />
          ))}
        </div>
      </div>

      {/* Other Documents Section */}
      <div className="space-y-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-3 pt-10">
           <div className="h-6 w-1 bg-slate-300 rounded-full" /> Other Documents
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents?.filter((d: any) => d.type !== 'INSURANCE').map((doc: any) => (
            <DocumentCard 
              key={doc.id} 
              doc={doc} 
              onDelete={() => deleteMutation.mutate(doc.id)} 
              icon={getFileIcon(doc.fileUrl)}
            />
          ))}
          
          {/* Add Placeholder Card */}
          <button 
            onClick={() => setShowUploadModal(true)}
            className="group h-[180px] rounded-[30px] border-2 border-dashed border-slate-100 hover:border-primary/20 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-4 text-slate-300 hover:text-primary"
          >
            <div className="h-12 w-12 rounded-2xl bg-slate-50 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all">
              <Plus size={24} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Add New Document</span>
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowUploadModal(false)} />
          <div className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Upload Document</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Safe & Secure Storage</p>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="h-10 w-10 rounded-full hover:bg-slate-50 flex items-center justify-center transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Document Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Insurance Card"
                    className="w-full px-5 py-3 md:py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all text-xs font-bold"
                    value={uploadData.name}
                    onChange={(e) => setUploadData({...uploadData, name: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Document Type</label>
                  <select 
                    className="w-full px-5 py-3 md:py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all text-xs font-bold"
                    value={uploadData.type}
                    onChange={(e) => setUploadData({...uploadData, type: e.target.value})}
                  >
                    <option value="INSURANCE">Insurance Card</option>
                    <option value="PRESCRIPTION">Prescription</option>
                    <option value="ID">Government ID</option>
                    <option value="REPORT">Medical Report</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div 
                  className={cn(
                    "relative border-2 border-dashed rounded-3xl p-6 md:p-10 transition-all flex flex-col items-center justify-center gap-4 group cursor-pointer",
                    selectedFile ? "border-primary/30 bg-primary/5" : "border-slate-100 bg-slate-50 hover:border-primary/20"
                  )}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input 
                    id="file-upload"
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <div className={cn(
                    "h-12 w-12 md:h-16 md:w-16 rounded-[18px] md:rounded-[24px] flex items-center justify-center transition-all",
                    selectedFile ? "bg-primary text-white" : "bg-white text-slate-400 group-hover:scale-110"
                  )}>
                    <Upload size={selectedFile ? 20 : 32} />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] md:text-xs font-black text-slate-800 uppercase tracking-tight line-clamp-1">
                      {selectedFile ? selectedFile.name : "Choose File or Drop here"}
                    </p>
                    <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      PDF, JPG, PNG (Max 5MB)
                    </p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => uploadMutation.mutate()}
                disabled={!selectedFile || uploadMutation.isPending}
                className="w-full py-5 md:py-6 rounded-[20px] md:rounded-[24px] bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {uploadMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ShieldCheck size={18} /> Securely Upload</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DocumentCard = ({ doc, onDelete, icon }: any) => {
  return (
    <div className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-soft hover:shadow-xl hover:scale-[1.02] transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all flex gap-2">
        <button 
          onClick={() => window.open(doc.fileUrl, '_blank')}
          className="h-9 w-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-primary shadow-sm hover:bg-primary hover:text-white transition-all"
        >
          <Eye size={16} />
        </button>
        <button 
          onClick={onDelete}
          className="h-9 w-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-rose-500 shadow-sm hover:bg-rose-500 hover:text-white transition-all"
        >
          <Trash2 size={16} />
        </button>
      </div>
      
      <div className="flex items-start gap-5">
        <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className="space-y-1.5 flex-1 pr-16">
          <h4 className="text-sm font-black text-slate-800 tracking-tight line-clamp-1">{doc.name}</h4>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{doc.type}</span>
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Added {new Date(doc.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="h-2 w-2 rounded-full bg-emerald-500" />
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Encrypted</span>
        </div>
        <a 
          href={doc.fileUrl} 
          download 
          className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5 hover:underline"
        >
          <Download size={14} /> Download
        </a>
      </div>
    </div>
  );
};

export default HealthVault;
