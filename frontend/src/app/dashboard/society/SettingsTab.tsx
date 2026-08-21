import { useState } from "react";
import { Check, ShieldCheck, Lock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button } from "../../../components/ui/primitives";
import { ChangePasswordModal } from "../../../components/auth/ChangePasswordModal";

export function SettingsTab() {
  const [peakThreshold, setPeakThreshold] = useState("50");
  const [anomalyRatio, setAnomalyRatio] = useState("2.5");
  const [enableEmail, setEnableEmail] = useState(true);
  const [enableSMS, setEnableSMS] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Society Settings & Limits</CardTitle>
            <CardDescription>Configure energy thresholds, baseline metrics and notification parameters</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {saved && (
            <div className="flex items-center gap-2 p-3 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold rounded-xl animate-fade-in">
              <Check size={16} className="text-teal-600" />
              Settings saved successfully.
            </div>
          )}

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
              <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableEmail}
                  onChange={(e) => setEnableEmail(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
                Email Alerts (admin@enera.com)
              </label>
              <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer">
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

          <div className="border-t pt-4 flex gap-2 items-center">
            <Button variant="teal" onClick={handleSave}>
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

      {/* Account Security Card */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Account Security</CardTitle>
            <CardDescription>Manage your login credentials and security parameters</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-200/50">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Account Password</p>
                <p className="text-xs text-slate-400">Update your account login password</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-1.5"
            >
              <Lock size={13} /> Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
}
