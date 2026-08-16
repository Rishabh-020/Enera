import { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  className?: string;
  label?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DatePicker({ value, onChange, className, label }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial date or default to today
  const selectedDate = value ? new Date(value + "T00:00:00") : new Date();
  const [viewDate, setViewDate] = useState<Date>(selectedDate);

  // Sync viewDate when value changes
  useEffect(() => {
    if (value) {
      setViewDate(new Date(value + "T00:00:00"));
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  // Days in month
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const handleSelectDay = (day: number) => {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${year}-${mm}-${dd}`);
    setOpen(false);
  };

  const handleSetToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}`);
    setViewDate(today);
    setOpen(false);
  };

  // Formatted display string
  const formatDisplay = (val?: string) => {
    if (!val) return "Select date";
    const d = new Date(val + "T00:00:00");
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    const d = new Date(value + "T00:00:00");
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
  };

  return (
    <div ref={containerRef} className={cn("relative inline-block text-left select-none", className)}>
      {label && <span className="block text-[11px] font-medium text-slate-500 mb-1">{label}</span>}
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-9 items-center gap-2 rounded-xl border bg-white px-3 text-xs font-medium text-slate-700 transition-all duration-150 cursor-pointer shadow-2xs hover:bg-slate-50/80 hover:border-slate-300",
          open ? "border-teal-500 ring-2 ring-teal-500/15" : "border-slate-200"
        )}
      >
        <CalendarIcon size={14} className="text-teal-600 shrink-0" />
        <span className="font-mono-data text-slate-800 font-semibold">{formatDisplay(value)}</span>
      </button>

      {/* Modern Floating Calendar Popover */}
      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-64 max-w-[calc(100vw-24px)] rounded-2xl border border-slate-100 bg-white/95 backdrop-blur-md p-3.5 shadow-2xl shadow-slate-900/15 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="font-display text-xs font-bold text-slate-800">
              {MONTHS[month]} {year}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAYS_OF_WEEK.map((d) => (
              <span key={d} className="text-[10px] font-semibold text-slate-400 uppercase">
                {d}
              </span>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Trailing days of previous month */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <span
                key={`prev-${i}`}
                className="flex h-7 w-7 items-center justify-center text-[11px] text-slate-300"
              >
                {daysInPrevMonth - firstDayIndex + i + 1}
              </span>
            ))}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const selected = isSelected(day);
              const today = isToday(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer",
                    selected
                      ? "bg-teal-600 text-white font-bold shadow-sm shadow-teal-600/30 scale-105"
                      : today
                      ? "bg-teal-50 text-teal-700 font-semibold border border-teal-200"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer with Today Shortcut */}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
            <button
              type="button"
              onClick={() => {
                onChange("2026-08-09");
                setViewDate(new Date("2026-08-09T00:00:00"));
                setOpen(false);
              }}
              className="text-teal-600 font-medium hover:underline cursor-pointer"
            >
              09 Aug (DB data)
            </button>
            <button
              type="button"
              onClick={handleSetToday}
              className="rounded-lg bg-slate-100 px-2 py-0.5 font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
