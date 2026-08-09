import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button, Input } from "../../components/ui/primitives";
import { cn } from "../../lib/utils";
import type { Role } from "../../lib/types";

interface RoleOption {
  key: Role;
  label: string;
  demo: string;
}

const ROLES: RoleOption[] = [
  { key: "RESIDENT", label: "Flat Owner", demo: "rishabh.owner@enra.io" },
  { key: "SOCIETY_ADMIN", label: "Society Admin", demo: "admin.s1@demo.io" },
  { key: "BUILDER_ADMIN", label: "Builder Admin", demo: "builder@demo.io" },
];

export default function Login() {
  const [role, setRole] = useState<Role>("RESIDENT");
  const [email, setEmail] = useState(ROLES[0].demo);
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function pickRole(key: Role) {
    setRole(key);
    setEmail(ROLES.find((r) => r.key === key)!.demo);
    setError("");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role !== role) {
        setError(`That account is registered as a different role. Try the ${ROLES.find((r) => r.key === user.role)?.label} tab.`);
        setLoading(false);
        return;
      }
      if (user.role === "RESIDENT") navigate(`/flat/${user.flatId}`);
      else if (user.role === "SOCIETY_ADMIN") navigate(`/society/${user.societyId}`);
      else navigate(`/builder/${user.builderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-grid-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amp-500">
            <Zap size={22} className="text-grid-950" strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-white">Amperly</h1>
            <p className="text-sm text-slate-400">Energy dashboard for Palm Meadows &amp; Cedar Heights</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-grid-900 p-6 shadow-xl">
          <div className="mb-5 grid grid-cols-3 gap-1 rounded-xl bg-grid-800 p-1">
            {ROLES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => pickRole(r.key)}
                className={cn(
                  "rounded-lg px-2 py-2 text-[12px] font-medium text-slate-400 transition-colors",
                  role === r.key && "bg-amp-500 text-grid-950 font-semibold"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} className="bg-grid-800 border-grid-700 text-white placeholder:text-slate-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-grid-800 border-grid-700 text-white"
              />
            </div>
            {error && <p className="text-xs font-medium text-high-500">{error}</p>}
            <Button type="submit" variant="amber" disabled={loading} className="mt-2 w-full">
              {loading ? "Signing in…" : "Sign in"} <ArrowRight size={15} />
            </Button>
          </form>

          <p className="mt-4 text-center text-[11px] text-slate-500">
            Demo password for every seeded account: <span className="font-mono-data text-slate-300">demo123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
