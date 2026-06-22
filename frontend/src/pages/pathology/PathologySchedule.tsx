import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { 
  MoreHorizontal, 
  Plus, 
  Search, 
  MessageSquare, 
  Paperclip, 
  Clock,
  Filter
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/api/apiClient";

const TaskCard = ({ task, index }: any) => {
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
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8 border-2 border-white shadow-sm">
                <AvatarImage src={task.avatar} />
                <AvatarFallback>{task.patient[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="text-xs font-bold text-slate-800 leading-none">{task.patient}</h4>
                <p className="text-[10px] text-slate-400 mt-1">{task.email}</p>
              </div>
            </div>
            <button className="text-slate-300 hover:text-slate-500 transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>

          <h3 className="text-sm font-semibold text-slate-700 mb-4">{task.content}</h3>

          <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                <MessageSquare size={12} />
                {task.comments}
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                <Paperclip size={12} />
                {task.attachments}
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-500 border border-slate-100">
              <Clock size={12} className="text-slate-400" />
              {task.time}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

const Column = ({ column, tasks }: any) => {
  return (
    <div className="w-[320px] flex flex-col">
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
        <button className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-primary transition-all">
          <Plus size={14} />
        </button>
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
              <TaskCard key={task.id} task={task} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

const PathologySchedule = () => {
  const queryClient = useQueryClient();

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const response = await apiClient.get('/bookings');
      return response.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const response = await apiClient.patch(`/bookings/${id}`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Transform backend data to Kanban format
  const columnOrder = ["BOOKING", "SCHEDULED", "PICKEDUP", "REPORT_GENERATED"];
  const columns: any = {
    "BOOKING": { id: "BOOKING", title: "BOOKINGS", taskIds: [], color: "border-t-amber-400" },
    "SCHEDULED": { id: "SCHEDULED", title: "SCHEDULED", taskIds: [], color: "border-t-blue-500" },
    "PICKEDUP": { id: "PICKEDUP", title: "PICKEDUP", taskIds: [], color: "border-t-purple-500" },
    "REPORT_GENERATED": { id: "REPORT_GENERATED", title: "REPORTS GENERATED", taskIds: [], color: "border-t-emerald-500" },
  };
  const tasks: any = {};

  bookingsData?.forEach((booking: any) => {
    const taskId = booking.id;
    tasks[taskId] = {
      id: taskId,
      content: booking.tests.map((t: any) => t.name).join(", "),
      patient: booking.patient.name,
      email: booking.patient.email || "",
      avatar: booking.patient.avatar || `https://i.pravatar.cc/150?u=${booking.patient.id}`,
      priority: booking.priority,
      time: booking.timeSlot || "N/A",
      comments: booking.comments,
      attachments: booking.attachments,
    };
    if (columns[booking.status]) {
      columns[booking.status].taskIds.push(taskId);
    }
  });

  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Update status in backend
    updateStatusMutation.mutate({ id: draggableId, status: destination.droppableId });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Job Schedule</h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1">Manage and track laboratory tests workflow.</p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 overflow-x-auto no-scrollbar py-1">
          <div className="flex-1 md:flex-initial flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
            <Search size={16} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-transparent border-none outline-none text-sm text-slate-600 w-full md:w-40 font-medium"
            />
          </div>
          <button className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm whitespace-nowrap">
            <Filter size={16} /> Filter
          </button>
          <button className="flex items-center gap-2 bg-primary text-white rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 whitespace-nowrap">
            <Plus size={16} /> New
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 md:gap-6 overflow-x-auto pb-8 min-h-[calc(100vh-250px)] no-scrollbar scroll-smooth">
          {columnOrder.map((columnId) => {
            const column = columns[columnId];
            const columnTasks = column.taskIds.map((taskId: string) => tasks[taskId]);

            return (
              <div key={column.id} className="w-[280px] md:w-[320px] shrink-0 flex flex-col">
                <Column column={column} tasks={columnTasks} />
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};

export default PathologySchedule;
