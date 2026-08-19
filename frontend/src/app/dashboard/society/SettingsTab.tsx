import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button } from "../../../components/ui/primitives";

export function SettingsTab() {
  const [peakThreshold, setPeakThreshold] = useState("50");
  const [anomalyRatio, setAnomalyRatio] = useState("2.5");
  const [enableEmail, setEnableEmail] = useState(true);
  const [enableSMS, setEnableSMS] = useState(false);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div>
          <CardTitle>Society Settings & Limits</CardTitle>
          <CardDescription>Configure energy thresholds, baseline metrics and notification parameters</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-800">Peak Demand Threshold (kW)</label>
          <p className="text-xs text-slate-400">Trigger system warning when active society consumption exceeds this value</p>
          <Input type="number" value={peakThreshold} onChange={(e) => setPeakThreshold(e.target.value)} className="w-32" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-800">Anomaly Deviation Threshold (x usual)</label>
          <p className="text-xs text-slate-400">Factor of current consumption compared to historical hourly baseline to flag as anomaly</p>
          <Input type="number" step="0.1" value={anomalyRatio} onChange={(e) => setAnomalyRatio(e.target.value)} className="w-32" />
        </div>

        <div className="flex flex-col gap-2 border-t pt-4">
          <label className="text-sm font-semibold text-slate-800">Alert Notifications</label>
          <p className="text-xs text-slate-400">Configure where system warnings and critical spikes are dispatched</p>
          <div className="flex flex-col gap-3 mt-3">
            <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={enableEmail}
                onChange={(e) => setEnableEmail(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
              />
              Email Alerts (suresh@voltwise.app / admin)
            </label>
            <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={enableSMS}
                onChange={(e) => setEnableSMS(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
              />
              SMS Alerts (Registered phone number)
            </label>
          </div>
        </div>

        <div className="border-t pt-4 flex gap-2">
          <Button variant="teal" onClick={() => alert("Settings saved successfully!")}>
            Save Settings
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setPeakThreshold("50");
              setAnomalyRatio("2.5");
              setEnableEmail(true);
              setEnableSMS(false);
            }}
          >
            Reset Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
