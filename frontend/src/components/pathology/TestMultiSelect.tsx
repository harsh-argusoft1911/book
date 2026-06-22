import React, { useState } from "react";
import { X, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TestMultiSelectProps {
  selectedValues: string[];
  onChange: (values: string[]) => void;
  availableTests: any[];
}

export const TestMultiSelect = ({ selectedValues, onChange, availableTests }: TestMultiSelectProps) => {
  const [open, setOpen] = useState(false);

  const handleUnselect = (id: string) => {
    onChange(selectedValues.filter((i) => i !== id));
  };

  const handleSelect = (id: string) => {
    if (selectedValues.includes(id)) {
      handleUnselect(id);
    } else {
      onChange([...selectedValues, id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1 items-center min-h-[40px]">
      {selectedValues.map((id) => {
        const test = availableTests.find((t) => t.id === id);
        return (
          <Badge
            key={id}
            variant="secondary"
            className="bg-primary/5 text-primary border-primary/10 pl-2 pr-1 py-1 flex items-center gap-1 group hover:bg-primary/10 transition-colors"
          >
            <span className="text-[10px] font-bold">{test?.name}</span>
            <button
              className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={() => handleUnselect(id)}
            >
              <X className="h-3 w-3 text-primary/60 group-hover:text-primary transition-colors" />
            </button>
          </Badge>
        );
      })}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            role="combobox"
            aria-expanded={open}
            className="flex items-center justify-between px-3 py-1 text-xs font-medium text-slate-400 hover:text-primary transition-colors bg-slate-50 border border-slate-100 rounded-lg ml-1"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Test
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tests..." />
            <CommandList>
              <CommandEmpty>No test found.</CommandEmpty>
              <CommandGroup>
                {availableTests.map((test) => (
                  <CommandItem
                    key={test.id}
                    onSelect={() => handleSelect(test.id)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-4 h-4 border border-slate-200 rounded flex items-center justify-center transition-colors",
                        selectedValues.includes(test.id) ? "bg-primary border-primary" : "bg-white"
                      )}>
                        {selectedValues.includes(test.id) && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="text-sm">{test.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">₹{test.price}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
