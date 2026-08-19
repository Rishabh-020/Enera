import { type ButtonHTMLAttributes, type InputHTMLAttributes, type HTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import type { MeterStatus } from "../../lib/types";
import { Search } from "lucide-react";

/* ──────────────────────── Card ──────────────────────── */

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-2xl border border-slate-200/80 bg-white shadow-sm animate-fade-in-up", className)} {...props}>
      {children}
    </div>
  );
}
export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 pt-4 sm:pt-5", className)} {...props}>
      {children}
    </div>
  );
}
export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("font-display text-[15px] font-semibold text-slate-800 tracking-tight", className)} {...props}>
      {children}
    </h3>
  );
}
export function CardDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-slate-500 mt-0.5", className)} {...props}>
      {children}
    </p>
  );
}
export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-5 pb-5 pt-4", className)} {...props}>
      {children}
    </div>
  );
}

const badgeVariants = cva("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide", {
  variants: {
    variant: {
      live: "bg-live-500/10 text-live-500",
      normal: "bg-live-500/10 text-live-500",
      amber: "bg-warn-500/10 text-amber-700",
      warn: "bg-amp-500/10 text-amp-600",
      high: "bg-high-500/10 text-high-500",
      offline: "bg-slate-100 text-slate-500",
      neutral: "bg-slate-100 text-slate-600",
      teal: "bg-teal-500/10 text-teal-600",
      efficient: "bg-emerald-50 text-emerald-600 border border-emerald-200",
      attention: "bg-red-50 text-red-500 border border-red-200",
    },
  },
  defaultVariants: { variant: "neutral" },
});

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> { }

export function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  );
}

/* ──────────────────────── Button ──────────────────────── */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-grid-900 text-white hover:bg-grid-800 shadow-sm",
        amber: "bg-amp-500 text-grid-950 hover:bg-amp-600 font-semibold shadow-sm",
        teal: "bg-teal-500 text-white hover:bg-teal-600 font-semibold shadow-sm",
        outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
        ghost: "text-slate-600 hover:bg-slate-100",
        danger: "bg-high-500 text-white hover:bg-red-700",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-xs",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  }
);

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { }

export function Button({ className, variant, size, children, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </button>
  );
}

/* ──────────────────────── Input / Select ──────────────────────── */

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-colors",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-500 transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

/* ──────────────────────── StatusDot ──────────────────────── */

export function StatusDot({ status }: { status?: MeterStatus | string }) {
  const color =
    status === "live" ? "bg-live-500" : status === "offline" ? "bg-warn-500" : status === "offline-long" ? "bg-high-500" : "bg-slate-300";
  return <span className={cn("inline-block h-2 w-2 rounded-full", color)} />;
}

/* ──────────────────────── Table ──────────────────────── */

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border border-slate-200", className)}>
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}
export function Thead({ children }: { children: ReactNode }) {
  return <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">{children}</thead>;
}
export function Th({ children, className }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("px-4 py-3 font-semibold", className)}>{children}</th>;
}
export function Td({ children, className }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 text-slate-700 border-t border-slate-100", className)}>{children}</td>;
}
export function Tr({ children, className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn("hover:bg-slate-50/80 transition-colors", className)} {...props}>
      {children}
    </tr>
  );
}

/* ──────────────────────── EmptyState / Spinner ──────────────────────── */

export function EmptyState({ title, description, icon }: { title: ReactNode; description?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      {icon}
      <p className="font-display text-sm font-semibold text-slate-700">{title}</p>
      {description && <p className="max-w-sm text-xs text-slate-500">{description}</p>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn("h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-teal-500", className)} />
  );
}

/* ──────────────────────── Breadcrumb ──────────────────────── */

export interface BreadcrumbItem {
  label: ReactNode;
  onClick?: () => void;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-sm">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-slate-300">/</span>}
          {item.onClick ? (
            <button onClick={item.onClick} className="text-slate-500 hover:text-grid-900 hover:underline underline-offset-2">
              {item.label}
            </button>
          ) : (
            <span className="font-medium text-slate-800">{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NEW COMPONENTS — VoltWise-inspired
   ═══════════════════════════════════════════════════════════════ */

/* ──────────────────────── TabPills ──────────────────────── */

interface TabPillsProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}

export function TabPills({ tabs, active, onChange }: TabPillsProps) {
  return (
    <div className="inline-flex max-w-full overflow-x-auto items-center gap-1 rounded-xl bg-slate-100 p-1 no-scrollbar scroll-smooth">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            "shrink-0 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap",
            active === tab
              ? "bg-white text-slate-900 shadow-sm font-semibold"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

/* ──────────────────────── FilterChips ──────────────────────── */

interface FilterChipsProps {
  chips: string[];
  active: string;
  onChange: (chip: string) => void;
}

export function FilterChips({ chips, active, onChange }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
      {chips.map((chip) => (
        <button
          key={chip}
          onClick={() => onChange(chip)}
          className={cn(
            "rounded-full px-3 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold transition-all duration-200 border cursor-pointer whitespace-nowrap",
            active === chip
              ? "bg-teal-500/10 text-teal-600 border-teal-300 shadow-2xs"
              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          )}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}

/* ──────────────────────── ProgressStat ──────────────────────── */

interface ProgressStatProps {
  label: string;
  value: string;
  pct: number; // 0–100
  color?: string;
}

export function ProgressStat({ label, value, pct, color = "#0d9488" }: ProgressStatProps) {
  return (
    <div className="flex items-center gap-4">
      <span className="min-w-[140px] text-xs text-slate-600">{label}</span>
      <div className="flex-1 progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }}
        />
      </div>
      <span className="min-w-[80px] text-right text-xs font-semibold text-slate-800">{value}</span>
    </div>
  );
}

/* ──────────────────────── SearchBar ──────────────────────── */

interface SearchBarProps extends InputHTMLAttributes<HTMLInputElement> {
  shortcut?: string;
}

export function SearchBar({ className, shortcut = "⌘K", ...props }: SearchBarProps) {
  return (
    <div className="relative">
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        className={cn(
          "h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-14 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 focus:bg-white transition-all",
          className
        )}
        {...props}
      />
      <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
        {shortcut}
      </kbd>
    </div>
  );
}

/* ──────────────────────── Avatar ──────────────────────── */

const AVATAR_COLORS = [
  "bg-teal-500", "bg-amber-500", "bg-rose-500", "bg-indigo-500",
  "bg-emerald-500", "bg-violet-500", "bg-sky-500", "bg-orange-500",
];

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initial = name?.charAt(0)?.toUpperCase() || "?";
  const colorIndex = name ? name.charCodeAt(0) % AVATAR_COLORS.length : 0;
  const sizeClass = size === "sm" ? "h-7 w-7 text-xs" : size === "lg" ? "h-10 w-10 text-base" : "h-8 w-8 text-sm";

  return (
    <div className={cn(
      "flex items-center justify-center rounded-full font-semibold text-white shrink-0",
      AVATAR_COLORS[colorIndex],
      sizeClass
    )}>
      {initial}
    </div>
  );
}

/* ──────────────────────── SwitchViewToggle ──────────────────────── */

interface SwitchViewToggleProps {
  options: string[];
  active: string;
  onChange?: (option: string) => void;
}

export function SwitchViewToggle({ options, active, onChange }: SwitchViewToggleProps) {
  return (
    <div className="grid grid-cols-3 w-full gap-1 rounded-xl bg-grid-800/90 p-1 border border-white/5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange?.(opt)}
          className={cn(
            "w-full rounded-lg py-1.5 px-1 text-[11px] font-medium transition-all duration-200 cursor-pointer text-center truncate select-none",
            active === opt
              ? "bg-teal-500 text-white font-semibold shadow-sm shadow-teal-500/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
