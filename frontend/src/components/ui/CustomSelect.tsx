import { useState, useRef, useEffect, type ReactNode } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "../../lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  sub?: string;
  icon?: ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (SelectOption | string)[];
  placeholder?: string;
  className?: string;
  dropdownClassName?: string;
  icon?: ReactNode;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  disabled?: boolean;
  align?: "left" | "right";
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select option",
  className,
  dropdownClassName,
  icon,
  size = "sm",
  fullWidth = false,
  disabled = false,
  align = "right",
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options
  const normalizedOptions: SelectOption[] = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find((o) => o.value === value) || (value ? {
    value,
    label: value,
  } : null);

  // Close when clicking outside
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

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative select-none",
        fullWidth ? "w-full" : "inline-block text-left",
        className
      )}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          "flex items-center justify-between gap-2.5 rounded-xl border bg-white font-medium text-slate-700 transition-all duration-150 shadow-2xs",
          fullWidth ? "w-full" : "",
          disabled
            ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
            : "cursor-pointer hover:bg-slate-50/80 hover:border-slate-300",
          open && !disabled ? "border-teal-500 ring-2 ring-teal-500/15" : "border-slate-200",
          size === "sm" ? "h-9 px-3 text-xs" : size === "lg" ? "h-11 px-4 text-sm" : "h-10 px-3.5 text-xs"
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className={cn("truncate", !selectedOption ? "text-slate-400 font-normal" : "")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={cn(
            "text-slate-400 shrink-0 transition-transform duration-200",
            open && !disabled && "rotate-180 text-teal-600"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {open && !disabled && (
        <div
          className={cn(
            "absolute z-50 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-slate-100 bg-white/95 backdrop-blur-md p-1 shadow-xl shadow-slate-900/10 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100",
            fullWidth ? "w-full left-0" : align === "left" ? "left-0 min-w-[180px]" : "right-0 min-w-[180px]",
            dropdownClassName
          )}
        >
          {normalizedOptions.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400 italic text-center">
              No options available
            </div>
          ) : (
            normalizedOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors cursor-pointer",
                    isSelected
                      ? "bg-teal-50 text-teal-900 font-semibold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                    {opt.sub && <span className="text-[10px] text-slate-400 font-normal">({opt.sub})</span>}
                  </div>
                  {isSelected && <Check size={13} className="text-teal-600 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
