import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatKwh(n: number): string {
  return `${n.toFixed(1)} kWh`;
}

export function formatKw(n: number): string {
  return `${n.toFixed(2)} kW`;
}

export function formatCost(units: number, rate = 10): string {
  const cost = units * rate;
  return `₹${cost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function timeAgo(d: Date | string | null | undefined): string {
  if (!d) return "Never";
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return "Never";

  const diffMs = Date.now() - dateObj.getTime();
  if (diffMs < 60000) return "Just now";

  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;

  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;

  return dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
