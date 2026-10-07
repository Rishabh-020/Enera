import { Zap, Loader2 } from "lucide-react";

export function PageLoadingFallback() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50/50 p-4">
      <div className="relative flex flex-col items-center gap-4 p-8 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-sm max-w-xs w-full text-center animate-fade-in">
        <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600">
          <Zap className="w-6 h-6 animate-pulse" />
          <div className="absolute inset-0 rounded-xl border border-teal-500/20 animate-ping opacity-25" />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-sm font-semibold text-slate-800 tracking-tight">Loading View</h3>
          <p className="text-xs text-slate-400">Preparing dashboard modules...</p>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div className="bg-teal-500 h-full w-2/3 rounded-full animate-[shimmer_1.5s_infinite_linear]" />
        </div>
      </div>
    </div>
  );
}

export function ComponentLoadingFallback({ message = "Loading component..." }: { message?: string }) {
  return (
    <div className="w-full py-12 flex flex-col items-center justify-center gap-3 text-slate-400 animate-fade-in">
      <Loader2 className="w-6 h-6 animate-spin text-teal-600/70" />
      <span className="text-xs font-medium text-slate-500">{message}</span>
    </div>
  );
}
