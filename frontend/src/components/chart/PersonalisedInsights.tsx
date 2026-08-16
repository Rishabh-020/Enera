import { Lightbulb, Clock, Sun } from "lucide-react";
import { Card, CardHeader, CardTitle } from "../ui/primitives";
import type { ReactNode } from "react";

interface Insight {
  icon: ReactNode;
  text: string;
}

interface PersonalisedInsightsProps {
  insights?: Insight[];
  loading?: boolean;
}

const DEFAULT_INSIGHTS: Insight[] = [
  {
    icon: <Sun size={14} className="text-amber-500" />,
    text: "Running your geyser at 6 AM instead of 7 PM could reduce your peak load by ~30%.",
  },
  {
    icon: <Clock size={14} className="text-red-400" />,
    text: "Your weekday evening usage (7–9 PM) accounts for 35% of your weekly load.",
  },
  {
    icon: <Lightbulb size={14} className="text-teal-500" />,
    text: "Your quietest day was Sunday — just 2.1 kWh. Can you replicate that on other days?",
  },
];

export function PersonalisedInsights({
  insights = DEFAULT_INSIGHTS,
  loading = false,
}: PersonalisedInsightsProps) {
  if (loading) {
    return <Card className="h-52 animate-pulse bg-slate-50" />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb size={16} className="text-amber-500" />
          <CardTitle>Personalised insights</CardTitle>
        </div>
      </CardHeader>
      <div className="px-5 pb-5 pt-2 flex flex-col gap-3">
        {insights.map((insight, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 transition-colors hover:bg-slate-100/80"
          >
            <div className="mt-0.5 shrink-0">{insight.icon}</div>
            <p className="text-xs text-slate-700 leading-relaxed">{insight.text}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
