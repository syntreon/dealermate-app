import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

export type DateRangePickerProps = {
  className?: string;
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  showPresets?: boolean;
};

export function DateRangePicker({
  className,
  value,
  onChange,
  placeholder = "Select date range",
  showPresets = true,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Predefined date ranges - using useMemo to recalculate fresh dates
  const presets = React.useMemo(() => [
    {
      id: "today",
      name: "Today",
      dateRange: {
        from: new Date(),
        to: new Date(),
      },
    },
    {
      id: "yesterday",
      name: "Yesterday",
      dateRange: (() => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          from: yesterday,
          to: new Date(yesterday),
        };
      })(),
    },
    {
      id: "last7days",
      name: "Last 7 days",
      dateRange: (() => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        return {
          from: sevenDaysAgo,
          to: new Date(),
        };
      })(),
    },
    {
      id: "last30days",
      name: "Last 30 days",
      dateRange: (() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
        return {
          from: thirtyDaysAgo,
          to: new Date(),
        };
      })(),
    },
    {
      id: "thisMonth",
      name: "This month",
      dateRange: {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(),
      },
    },
    {
      id: "lastMonth",
      name: "Last month",
      dateRange: (() => {
        const now = new Date();
        return {
          from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          to: new Date(now.getFullYear(), now.getMonth(), 0),
        };
      })(),
    },
  ], []);

  // Handle preset selection
  const handlePresetChange = (presetId: string) => {
    try {
      const preset = presets.find((p) => p.id === presetId);
      if (preset) {
        onChange(preset.dateRange);
        setIsOpen(false); // Close the popover after selection
      }
    } catch (error) {
      console.error('Error applying date preset:', error);
    }
  };

  // Handle calendar date selection
  const handleDateSelect = (range: DateRange | undefined) => {
    if (!range) {
      onChange(undefined);
      return;
    }

    // If user selects the same date for both from and to, keep it as a single date
    if (range.from && range.to && format(range.from, "yyyy-MM-dd") === format(range.to, "yyyy-MM-dd")) {
      onChange({
        from: range.from,
        to: range.from, // Same date for both
      });
    } else {
      onChange(range);
    }
  };

  // Handle "Today" quick selection
  const handleTodaySelect = () => {
    const today = new Date();
    onChange({
      from: today,
      to: today,
    });
  };

  // Format the date range for display
  const formatDateRange = (range: DateRange | undefined) => {
    if (!range) {
      return placeholder;
    }

    if (range.from && range.to) {
      if (format(range.from, "yyyy-MM-dd") === format(range.to, "yyyy-MM-dd")) {
        return format(range.from, "MMM d, yyyy");
      }
      return `${format(range.from, "MMM d, yyyy")} - ${format(range.to, "MMM d, yyyy")}`;
    }

    if (range.from) {
      return `From ${format(range.from, "MMM d, yyyy")}`;
    }

    if (range.to) {
      return `Until ${format(range.to, "MMM d, yyyy")}`;
    }

    return placeholder;
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange(value)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col sm:flex-row">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={value?.from}
              selected={value}
              onSelect={handleDateSelect}
              numberOfMonths={2}
              className="border-r"
              disabled={(date) => {
                // Disable future dates (tomorrow and beyond)
                const today = new Date();
                today.setHours(23, 59, 59, 999); // Set to end of today
                return date > today;
              }}
            />
            {showPresets && (
              <div className="p-3 border-t sm:border-t-0 sm:border-l">
                <Select
                  onValueChange={handlePresetChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {presets.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex mt-4 space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      onChange(undefined);
                      setIsOpen(false);
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => setIsOpen(false)}
                  >
                    Apply
                  </Button>
                </div>
                <div className="mt-3 text-center">
                  <button
                    onClick={handleTodaySelect}
                    className="text-sm text-primary hover:underline"
                  >
                    Today
                  </button>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}