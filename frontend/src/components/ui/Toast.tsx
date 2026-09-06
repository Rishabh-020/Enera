import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "error" | "success" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: ToastListener[] = [];

  subscribe(listener: ToastListener) {
    this.listeners.push(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  show(type: ToastType, message: string, title?: string, duration: number = 4500) {
    if (!message) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newToast: ToastItem = { id, type, message, title, duration };

    // Prevent identical consecutive duplicate messages
    if (this.toasts.length > 0 && this.toasts[this.toasts.length - 1].message === message) {
      return;
    }

    // Keep max 5 toasts on screen
    if (this.toasts.length >= 5) {
      this.toasts.shift();
    }

    this.toasts.push(newToast);
    this.notify();

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  error(message: string, title?: string, duration?: number) {
    this.show("error", message, title || "Error", duration);
  }

  success(message: string, title?: string, duration?: number) {
    this.show("success", message, title || "Success", duration);
  }

  warning(message: string, title?: string, duration?: number) {
    this.show("warning", message, title || "Warning", duration);
  }

  info(message: string, title?: string, duration?: number) {
    this.show("info", message, title || "Information", duration);
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  clear() {
    this.toasts = [];
    this.notify();
  }
}

export const toast = new ToastManager();

const TYPE_CONFIGS = {
  error: {
    icon: AlertCircle,
    iconBg: "bg-rose-50 border border-rose-200/80 text-rose-600",
    pill: "bg-rose-100/80 text-rose-800 border border-rose-200/60",
    barColor: "bg-gradient-to-r from-rose-500 to-rose-600",
    accentLeft: "border-l-4 border-l-rose-500",
    defaultTitle: "Action Failed",
  },
  success: {
    icon: CheckCircle2,
    iconBg: "bg-emerald-50 border border-emerald-200/80 text-emerald-600",
    pill: "bg-emerald-100/80 text-emerald-800 border border-emerald-200/60",
    barColor: "bg-gradient-to-r from-teal-500 to-emerald-500",
    accentLeft: "border-l-4 border-l-emerald-500",
    defaultTitle: "Success",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-50 border border-amber-200/80 text-amber-600",
    pill: "bg-amber-100/80 text-amber-800 border border-amber-200/60",
    barColor: "bg-gradient-to-r from-amber-500 to-amber-600",
    accentLeft: "border-l-4 border-l-amber-500",
    defaultTitle: "Warning",
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-50 border border-blue-200/80 text-blue-600",
    pill: "bg-blue-100/80 text-blue-800 border border-blue-200/60",
    barColor: "bg-gradient-to-r from-blue-500 to-indigo-500",
    accentLeft: "border-l-4 border-l-blue-500",
    defaultTitle: "Notice",
  },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toast.subscribe(setToasts);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[99999] flex flex-col-reverse gap-3 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0 items-end"
    >
      {toasts.map((t) => {
        const config = TYPE_CONFIGS[t.type] || TYPE_CONFIGS.info;
        const IconComponent = config.icon;
        const displayTitle = t.title || config.defaultTitle;

        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto relative w-full overflow-hidden rounded-2xl border border-white/80 bg-white/75 p-4 shadow-[0_12px_36px_rgba(15,23,42,0.12),0_2px_8px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/[0.05] backdrop-blur-xl backdrop-saturate-180 transition-all duration-300 transform translate-y-0 opacity-100 hover:bg-white/85 hover:shadow-[0_16px_42px_rgba(15,23,42,0.16)] animate-toast-slide-in ${config.accentLeft}`}
          >
            {/* Specular glass highlight reflection */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent opacity-80" />

            <div className="relative z-10 flex items-start gap-3.5">
              {/* Icon Container */}
              <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl backdrop-blur-md shadow-xs ${config.iconBg}`}>
                <IconComponent className="w-5 h-5" />
              </div>

              {/* Text Body */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight leading-none">
                    {displayTitle}
                  </h4>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs ${config.pill}`}>
                    {t.type}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed break-words font-medium">
                  {t.message}
                </p>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => toast.dismiss(t.id)}
                className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors focus:outline-none cursor-pointer"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Countdown Progress Bar */}
            {t.duration && t.duration > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200/60 overflow-hidden">
                <div
                  className={`h-full ${config.barColor} animate-toast-progress`}
                  style={{ animationDuration: `${t.duration}ms` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
