import { useState } from "react";
import { AlertTriangle, CheckCircle, Activity, Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button, TabPills } from "../../../components/ui/primitives";
import { cn } from "../../../lib/utils";

interface AlertsTabProps {
  anomalies: any[];
  setAnomalies: React.Dispatch<React.SetStateAction<any[]>>;
}

export function AlertsTab({ anomalies, setAnomalies }: AlertsTabProps) {
  const [alertType, setAlertType] = useState("active");
  const [investigatingId, setInvestigatingId] = useState<string | null>(null);
  const [acknowledgedNotice, setAcknowledgedNotice] = useState(false);

  const filtered = anomalies.filter((a) => alertType === "all" || (alertType === "active" ? !a.resolved : a.resolved));

  const handleAcknowledgeAll = () => {
    setAnomalies(anomalies.map((a) => ({ ...a, resolved: true })));
    setAcknowledgedNotice(true);
    setTimeout(() => setAcknowledgedNotice(false), 3000);
  };

  const handleInvestigate = (id: string) => {
    setInvestigatingId(id);
    setTimeout(() => {
      setInvestigatingId(null);
    }, 2500);
  };

  return (
    <div className="flex flex-col gap-6">
      {acknowledgedNotice && (
        <div className="flex items-center gap-2 p-3 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold rounded-xl animate-fade-in">
          <Check size={16} className="text-teal-600" />
          All active alerts have been acknowledged and resolved.
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <TabPills tabs={["active", "resolved", "all"]} active={alertType} onChange={(type) => setAlertType(type)} />
        <Button
          variant="outline"
          size="sm"
          className="self-start sm:self-auto"
          onClick={handleAcknowledgeAll}
          disabled={anomalies.every((a) => a.resolved)}
        >
          Acknowledge All
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>System Alerts & Anomalies</CardTitle>
            <CardDescription>Track real-time load deviations and device outages</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-2">
              <CheckCircle size={36} className="text-teal-500" />
              <p className="font-medium text-slate-700">No anomalies detected</p>
              <p className="text-xs text-slate-500">Everything is running normally</p>
            </div>
          ) : (
            filtered.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all",
                  a.resolved ? "border-slate-200 bg-slate-50" : "border-red-200 bg-red-50/20"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-xl mt-0.5", a.resolved ? "bg-slate-200 text-slate-500" : "bg-red-100 text-red-500")}>
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{a.flat}</span>
                      <Badge variant={a.resolved ? "neutral" : "high"}>{a.resolved ? "Resolved" : a.multiplier}</Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{a.desc}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Detected at: Today, 2:15 AM</p>
                  </div>
                </div>
                {!a.resolved && (
                  <div className="flex gap-2 shrink-0 items-center">
                    <Button
                      size="sm"
                      variant="teal"
                      onClick={() => handleInvestigate(a.id)}
                      disabled={investigatingId === a.id}
                    >
                      {investigatingId === a.id ? (
                        <>
                          <Activity size={12} className="animate-spin" /> Diagnosing...
                        </>
                      ) : (
                        "Investigate"
                      )}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAnomalies(anomalies.map((an) => (an.id === a.id ? { ...an, resolved: true } : an)))}>
                      False alarm
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
