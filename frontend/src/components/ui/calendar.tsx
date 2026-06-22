import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center gap-1",
        caption_label: "hidden",
        nav: "hidden",
        table: "w-full border-collapse space-y-1",
        head_row: "flex mb-2",
        head_cell: "text-slate-400 rounded-md w-9 font-black text-[10px] uppercase tracking-widest",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-bold hover:bg-slate-100 rounded-xl transition-all"
        ),
        day_selected:
          "bg-[#161F5A] text-white hover:bg-[#161F5A] hover:text-white focus:bg-[#161F5A] focus:text-white rounded-xl shadow-xl shadow-[#161F5A]/20",
        day_today: "text-[#161F5A] font-black underline decoration-2 underline-offset-4",
        day_outside: "text-slate-200 opacity-50",
        day_disabled: "text-slate-100 opacity-20",
        day_range_middle: "bg-slate-50",
        day_hidden: "invisible",
        caption_dropdowns: "flex gap-2 items-center font-bold text-slate-800",
        dropdown: "bg-slate-50 border-none text-[13px] font-black text-[#161F5A] outline-none px-2 py-1 cursor-pointer hover:bg-slate-100 rounded-xl transition-all",
        dropdown_month: "flex-1",
        dropdown_year: "flex-1",
        vhidden: "hidden",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
