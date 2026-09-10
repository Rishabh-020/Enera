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
    iconBg: "bg-rose-50 text-rose-600 border border-rose-200/80",
    pill: "bg-rose-50 text-rose-700 border border-rose-200/60",
    barColor: "bg-rose-500",
    accentLeft: "border-l-rose-500",
    defaultTitle: "Action Failed",
  },
  success: {
    icon: CheckCircle2,
    iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-200/80",
    pill: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
    barColor: "bg-emerald-500",
    accentLeft: "border-l-emerald-500",
    defaultTitle: "Success",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-50 text-amber-600 border border-amber-200/80",
    pill: "bg-amber-50 text-amber-700 border border-amber-200/60",
    barColor: "bg-amber-500",
    accentLeft: "border-l-amber-500",
    defaultTitle: "Warning",
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-50 text-blue-600 border border-blue-200/80",
    pill: "bg-blue-50 text-blue-700 border border-blue-200/60",
    barColor: "bg-blue-500",
    accentLeft: "border-l-blue-500",
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
      className="fixed bottom-4 right-4 z-[99999] flex flex-col-reverse gap-2 max-w-[250px] w-full pointer-events-none px-2 sm:px-0 items-end"
    >
      {toasts.map((t) => {
        const config = TYPE_CONFIGS[t.type] || TYPE_CONFIGS.info;
        const IconComponent = config.icon;
        const displayTitle = t.title || config.defaultTitle;

        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto relative w-full overflow-hidden rounded-lg border border-slate-200/90 bg-white/95 px-2.5 py-2 shadow-md shadow-slate-900/5 backdrop-blur-md transition-all duration-200 animate-toast-slide-in border-l-[3px] ${config.accentLeft}`}
          >
            <div className="flex items-start gap-1.5">
              {/* Icon */}
              <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded ${config.iconBg}`}>
                <IconComponent className="w-3 h-3" />
              </div>

              {/* Text Body */}
              <div className="flex-1 min-w-0 pr-0.5">
                <div className="flex items-center gap-1 mb-0.5">
                  <h4 className="text-[10px] font-bold text-slate-900 tracking-tight leading-none truncate">
                    {displayTitle}
                  </h4>
                  <span className={`inline-flex items-center px-1 py-0.2 rounded text-[7px] font-bold uppercase tracking-wider ${config.pill}`}>
                    {t.type}
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 leading-tight break-words font-medium">
                  {t.message}
                </p>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => toast.dismiss(t.id)}
                className="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
                aria-label="Close notification"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>

            {/* Countdown Progress Bar */}
            {t.duration && t.duration > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-100 overflow-hidden">
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
