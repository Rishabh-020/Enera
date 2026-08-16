import type { ReactNode } from "react";
import { Card } from "../ui/primitives";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <Card className="py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          {icon}
        </div>
        <p className="font-display text-sm font-semibold text-slate-700">{title}</p>
        <p className="max-w-sm text-xs text-slate-500">{description}</p>
      </div>
    </Card>
  );
}
