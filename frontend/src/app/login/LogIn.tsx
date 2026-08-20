import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, ArrowRight, Eye, EyeOff } from "lucide-react";
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
  { key: "RESIDENT", label: "Flat Owner", demo: "owner001@enera.com" },
  { key: "SOCIETY_ADMIN", label: "Society Admin", demo: "society1@enera.com" },
  { key: "BUILDER_ADMIN", label: "Builder Admin", demo: "builder1@enera.com" },
];

const ROLE_PASSWORDS: Record<Role, string> = {
  RESIDENT: "user1@user2007",
  SOCIETY_ADMIN: "society1@Admin2007",
  BUILDER_ADMIN: "builder1@Admin2007",
  SUPER_ADMIN: "Super@Admin2007",
};

export default function Login() {
  const [role, setRole] = useState<Role>("RESIDENT");
  const [email, setEmail] = useState(ROLES[0].demo);
  const [password, setPassword] = useState(ROLE_PASSWORDS.RESIDENT);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function pickRole(key: Role) {
    setRole(key);
    const option = ROLES.find((r) => r.key === key);
    if (option) {
      setEmail(option.demo);
      setPassword(ROLE_PASSWORDS[key]);
    }
    setError("");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);

      if (user.role !== role && user.role !== "SUPER_ADMIN") {
        const matched = ROLES.find((r) => r.key === user.role);
        setError(matched ? `That account is registered as a ${matched.label}. Try the ${matched.label} tab.` : "Role mismatch for this account.");
        setLoading(false);
        return;
      }

      const roleRoutes: Record<string, string> = {
        RESIDENT: `/flat/${user.flatId}`,
        SOCIETY_ADMIN: `/society/${user.societyId}`,
        BUILDER_ADMIN: `/builder/${user.builderId}`,
        SUPER_ADMIN: `/superAdmin/${user.id}`,
      };
      navigate(roleRoutes[user.role] || "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f5f8] px-4">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-teal-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-amber-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500 shadow-lg shadow-teal-500/20">
            <Zap size={26} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold text-grid-900">Enera</h1>
            <p className="text-sm text-slate-500 mt-1">Smart energy dashboard for your society</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
          {/* Role selector */}
          <div className="mb-5 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
            {ROLES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => pickRole(r.key)}
                className={cn(
                  "rounded-lg px-2 py-2 text-[12px] font-medium transition-all duration-200 cursor-pointer",
                  role === r.key
                    ? "bg-teal-500 text-white font-semibold shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <p className="text-xs font-medium text-high-500">{error}</p>}
            <Button type="submit" variant="teal" disabled={loading} className="mt-2 w-full">
              {loading ? "Signing in…" : "Sign in"} <ArrowRight size={15} />
            </Button>
          </form>

          <div>
            <p className="mt-4 text-center text-[11px] text-slate-400">
              Want to see how it work?{" "}
              <button
                type="button"
                onClick={() => {
                  navigate("/demo")
                }}
                className="font-medium text-teal-400 hover:text-teal-600 cursor-pointer">
                Launch Live Demo Dashboard &rarr;
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
