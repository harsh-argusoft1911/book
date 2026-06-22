import React, { useState, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { 
  MoreHorizontal, 
  Plus, 
  Search, 
  Clock,
  Filter,
  Upload,
  CheckCircle2,
  AlertCircle,
  Phone
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/api/apiClient";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

const TaskCard = ({ task, index, onUpload }: any) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "text-rose-500 bg-rose-50";
      case "MEDIUM": return "text-blue-500 bg-blue-50";
      case "LOW": return "text-emerald-500 bg-emerald-50";
      default: return "text-slate-400 bg-slate-50";
    }
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
          className={cn(
            "bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-3 transition-all duration-200",
            snapshot.isDragging ? "shadow-xl ring-2 ring-primary/10 rotate-2" : "hover:shadow-md"
          )}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
               <div className={cn(
                  "text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest",
                  getPriorityColor(task.priority)
               )}>
                  {task.priority}
               </div>
               <span className="text-[10px] font-bold text-slate-400">#{task.bookingId}</span>
            </div>
            <button className="text-slate-300 hover:text-slate-500 transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>

          <div className="mb-4">
             <h4 className="text-sm font-bold text-slate-800 leading-tight">{task.patient}</h4>
             <p className="text-[11px] text-slate-500 mt-1 font-medium line-clamp-2">{task.content}</p>
          </div>

          <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-2">
            <div className="flex items-center gap-2">
               <div className="flex -space-x-2">
                  <Avatar className="w-6 h-6 border-2 border-white shadow-sm ring-1 ring-slate-100">
                    <AvatarImage src={task.avatar} />
                    <AvatarFallback>{task.patient[0]}</AvatarFallback>
                  </Avatar>
               </div>
               <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <Clock size={10} /> {task.time}
               </div>
            </div>

            {task.status === 'REPORT_GENERATED' && (
               <button 
                  onClick={() => onUpload(task.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold hover:bg-slate-800 transition-all shadow-md shadow-primary/20"
               >
                  <Upload size={12} /> Upload
               </button>
            )}

            {task.status === 'COMPLETED' && (
               <div className="flex items-center gap-1 text-emerald-500 font-bold text-[10px]">
                  <CheckCircle2 size={12} /> Finalized
               </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

const Column = ({ column, tasks, onUpload }: any) => {
  return (
    <div className="flex-1 min-w-0 flex flex-col shrink-0">
      <div className={cn(
        "bg-white p-4 rounded-t-2xl border-x border-t border-slate-100 flex items-center justify-between border-t-4",
        column.color
      )}>
        <div className="flex items-center gap-2">
          <h2 className="text-[11px] font-black tracking-widest text-slate-800 uppercase">{column.title}</h2>
          <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
            {tasks.length}
          </span>
        </div>
      </div>
      
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={cn(
              "flex-1 p-3 bg-slate-50/50 border-x border-b border-slate-100 rounded-b-2xl min-h-[500px] transition-colors duration-200",
              snapshot.isDraggingOver ? "bg-slate-100/80" : ""
            )}
          >
            {tasks.map((task: any, index: number) => (
              <TaskCard key={task.id} task={task} index={index} onUpload={onUpload} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

const PathologyManage = () => {
  const { labId } = useParams();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['bookings', labId],
    queryFn: async () => {
      const response = await apiClient.get(`/bookings?labId=${labId}`);
      return response.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const response = await apiClient.patch(`/bookings/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', labId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', labId] });
    },
  });

  const uploadReportMutation = useMutation({
    mutationFn: async ({ id, reportUrl }: { id: string, reportUrl: string }) => {
      const response = await apiClient.patch(`/bookings/${id}/report`, { reportUrl });
      return response.data;
    },
    onSuccess: (_, variables) => {
      // After upload, move to COMPLETED
      updateStatusMutation.mutate({ id: variables.id, status: 'COMPLETED' });
      toast.success("Report uploaded and job finalized!");
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeTaskId) return;

    toast.loading("Uploading results...", { id: "kanban-upload" });
    try {
      // Step 1: Upload the actual PDF to the backend
      const formData = new FormData();
      formData.append('report', file);
      const uploadRes = await apiClient.post('/bookings/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const { url } = uploadRes.data;

      // Step 2: Save URL + auto-finalize
      uploadReportMutation.mutate({ id: activeTaskId, reportUrl: url });
    } catch (err) {
      toast.error("Upload Failed", { description: "Could not save the report." });
    } finally {
      toast.dismiss("kanban-upload");
      setActiveTaskId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const columnOrder = ["SCHEDULED", "PICKEDUP", "REPORT_GENERATED", "COMPLETED"];
  const columns: any = {
    "SCHEDULED": { id: "SCHEDULED", title: "Scheduled", taskIds: [], color: "border-t-blue-500" },
    "PICKEDUP": { id: "PICKEDUP", title: "In Progress", taskIds: [], color: "border-t-amber-400" },
    "REPORT_GENERATED": { id: "REPORT_GENERATED", title: "Report Ready", taskIds: [], color: "border-t-purple-500" },
    "COMPLETED": { id: "COMPLETED", title: "Finalized", taskIds: [], color: "border-t-emerald-500" },
  };
  const tasks: any = {};

  bookingsData?.forEach((booking: any) => {
    const taskId = booking.id;
    tasks[taskId] = {
      id: taskId,
      bookingId: booking.bookingId,
      content: booking.tests.map((t: any) => t.name).join(", "),
      patient: booking.patient.name,
      avatar: `https://i.pravatar.cc/150?u=${booking.patient.id}`,
      priority: booking.priority,
      time: booking.timeSlot || "N/A",
      status: booking.status,
      reportUrl: booking.reportUrl
    };
    if (columns[booking.status]) {
      columns[booking.status].taskIds.push(taskId);
    }
  });

  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    updateStatusMutation.mutate({ id: draggableId, status: destination.droppableId });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileUpload} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Manage Workflow</h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1">Drag and drop to manage patient test cycles.</p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex-1 md:flex-initial flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
            <Search size={16} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter..." 
              className="bg-transparent border-none outline-none text-sm text-slate-600 w-full md:w-40 font-medium"
            />
          </div>
          <button className="flex items-center gap-2 bg-primary text-white rounded-xl px-4 md:px-5 py-2.5 text-xs md:text-sm font-bold hover:bg-slate-800 transition-all shadow-xl shadow-primary/20 whitespace-nowrap">
            <Plus size={16} /> New Job
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 min-h-[calc(100vh-250px)] pb-8 overflow-x-auto no-scrollbar scroll-smooth">
          {columnOrder.map((columnId) => {
            const column = columns[columnId];
            const columnTasks = column.taskIds.map((taskId: string) => tasks[taskId]);

            return (
              <div key={column.id} className="w-[280px] md:flex-1 shrink-0 flex flex-col">
                <Column 
                  column={column} 
                  tasks={columnTasks} 
                  onUpload={(id: string) => {
                    setActiveTaskId(id);
                    fileInputRef.current?.click();
                  }}
                />
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};

export default PathologyManage;
