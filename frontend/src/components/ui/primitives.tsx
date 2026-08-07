import type { ButtonHTMLAttributes, InputHTMLAttributes, HTMLAttributes, ReactNode, SelectHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import type { MeterStatus } from "../../lib/types";

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white shadow-sm", className)} {...props}>
      {children}
    </div>
  );
}
export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-5 pt-5", className)} {...props}>
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

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-grid-900 text-white hover:bg-grid-800",
        amber: "bg-amp-500 text-grid-950 hover:bg-amp-600 font-semibold",
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

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-grid-700 focus:ring-2 focus:ring-grid-700/10",
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
        "h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-grid-700",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function StatusDot({ status }: { status?: MeterStatus | string }) {
  const color =
    status === "live" ? "bg-live-500" : status === "offline" ? "bg-warn-500" : status === "offline-long" ? "bg-high-500" : "bg-slate-300";
  return <span className={cn("inline-block h-2 w-2 rounded-full", color)} />;
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border border-slate-200", className)}>
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}
export function Thead({ children }: { children: ReactNode }) {
  return <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">{children}</thead>;
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
    <div className={cn("h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-grid-800", className)} />
  );
}

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
