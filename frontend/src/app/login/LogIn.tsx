import { useState, type FormEvent, type ReactNode, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Home, Building2, Layers, Zap, BarChart3, Bell } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";
import type { Role } from "../../lib/types";

interface RoleOption {
  key: Role;
  label: string;
  demo: string;
  icon: ReactNode;
  description: string;
}

const ROLES: RoleOption[] = [
  {
    key: "RESIDENT",
    label: "Flat Owner",
    demo: "demoOwner@enera.com",
    icon: <Home size={20} />,
    description: "View your flat's energy",
  },
  {
    key: "SOCIETY_ADMIN",
    label: "Society Admin",
    demo: "demoSociety@enera.com",
    icon: <Building2 size={20} />,
    description: "Manage society meters",
  },
  {
    key: "BUILDER_ADMIN",
    label: "Builder Admin",
    demo: "demoBuilder@enera.com",
    icon: <Layers size={20} />,
    description: "Portfolio overview",
  },
];

const ROLE_PASSWORDS: Record<Role, string> = {
  RESIDENT: "demoOwner@owner2007",
  SOCIETY_ADMIN: "demoSociety1@society2007",
  BUILDER_ADMIN: "demoBuilder1@builder2007",
  SUPER_ADMIN: "Super@Admin2007",
};

const FEATURES = [
  {
    icon: <Zap size={18} className="text-teal-200" />,
    title: "Live Energy Telemetry",
    desc: "Real-time kW readings from every smart meter in your society",
  },
  {
    icon: <BarChart3 size={18} className="text-teal-200" />,
    title: "Monthly Billing Insights",
    desc: "Automated cost estimates and consumption breakdowns per flat",
  },
  {
    icon: <Bell size={18} className="text-teal-200" />,
    title: "Instant Anomaly Alerts",
    desc: "Get notified the moment any meter spikes or goes offline",
  },
];

export default function Login() {
  const [role, setRole] = useState<Role>("RESIDENT");
  const [email, setEmail] = useState(ROLES[0].demo);
  const [password, setPassword] = useState(ROLE_PASSWORDS.RESIDENT);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const { login, demoLogin } = useAuth();
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
        setError(
          matched
            ? `That account is registered as a ${matched.label}. Try the ${matched.label} tab.`
            : "Role mismatch for this account."
        );
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

  async function handleLaunchDemo() {
    setError("");
    setDemoLoading(true);
    try {
      const user = await demoLogin();
      navigate(`/flat/${user.flatId || "1"}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to launch demo.");
    } finally {
      setDemoLoading(false);
    }
  }

  return (
    <>
      {/* Inject particle animation keyframes */}
      <style>{`
        @keyframes particle-rise {
          0%   { transform: translateY(0) scale(1);   opacity: 0; }
          10%  { opacity: 1; }
          80%  { opacity: 0.6; }
          100% { transform: translateY(-110vh) scale(0.4); opacity: 0; }
        }
        @keyframes particle-sway {
          0%   { margin-left: 0px; }
          25%  { margin-left: 18px; }
          50%  { margin-left: -14px; }
          75%  { margin-left: 20px; }
          100% { margin-left: 0px; }
        }
        @keyframes float-up {
          0% { transform: translateY(8px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .particle {
          position: absolute;
          border-radius: 50%;
          animation: particle-rise var(--dur) ease-in infinite var(--delay),
                     particle-sway calc(var(--dur) * 0.6) ease-in-out infinite var(--delay);
        }
        .hero-float {
          animation: float-up 0.7s ease-out forwards;
        }
      `}</style>

      <div className="flex min-h-screen">
        {/* ── LEFT PANEL (55%) ── */}
        <div
          className="hidden lg:flex lg:w-[55%] relative flex-col overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0f766e 0%, #0d9488 35%, #059669 70%, #047857 100%)",
          }}
        >
          {/* Floating Particle Animation */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[
              { left: "8%",  size: 5,  dur: "7s",  delay: "0s",   color: "rgba(255,255,255,0.55)" },
              { left: "18%", size: 3,  dur: "10s", delay: "1.2s", color: "rgba(167,243,208,0.65)" },
              { left: "28%", size: 6,  dur: "8s",  delay: "2.5s", color: "rgba(255,255,255,0.40)" },
              { left: "38%", size: 4,  dur: "12s", delay: "0.7s", color: "rgba(110,231,183,0.70)" },
              { left: "48%", size: 7,  dur: "9s",  delay: "3.1s", color: "rgba(255,255,255,0.35)" },
              { left: "58%", size: 3,  dur: "11s", delay: "1.8s", color: "rgba(167,243,208,0.60)" },
              { left: "68%", size: 5,  dur: "7.5s",delay: "4.2s", color: "rgba(255,255,255,0.50)" },
              { left: "78%", size: 4,  dur: "13s", delay: "0.3s", color: "rgba(110,231,183,0.55)" },
              { left: "88%", size: 6,  dur: "8.5s",delay: "2.0s", color: "rgba(255,255,255,0.45)" },
              { left: "13%", size: 3,  dur: "10.5s",delay:"5.0s", color: "rgba(167,243,208,0.70)" },
              { left: "23%", size: 8,  dur: "9.5s",delay: "1.5s", color: "rgba(255,255,255,0.25)" },
              { left: "33%", size: 3,  dur: "14s", delay: "3.8s", color: "rgba(110,231,183,0.65)" },
              { left: "43%", size: 5,  dur: "8s",  delay: "6.1s", color: "rgba(255,255,255,0.50)" },
              { left: "53%", size: 4,  dur: "11.5s",delay:"2.3s", color: "rgba(167,243,208,0.55)" },
              { left: "63%", size: 6,  dur: "7s",  delay: "4.7s", color: "rgba(255,255,255,0.40)" },
              { left: "73%", size: 3,  dur: "12.5s",delay:"1.0s", color: "rgba(110,231,183,0.70)" },
              { left: "83%", size: 5,  dur: "9s",  delay: "5.5s", color: "rgba(255,255,255,0.45)" },
              { left: "93%", size: 4,  dur: "10s", delay: "3.3s", color: "rgba(167,243,208,0.60)" },
              { left: "5%",  size: 9,  dur: "15s", delay: "0.9s", color: "rgba(255,255,255,0.20)" },
              { left: "95%", size: 3,  dur: "8s",  delay: "7.0s", color: "rgba(110,231,183,0.65)" },
            ].map((p, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: p.left,
                  bottom: "-10px",
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  background: p.color,
                  boxShadow: `0 0 ${p.size * 2}px ${p.size}px ${p.color}`,
                  "--dur": p.dur,
                  "--delay": p.delay,
                } as CSSProperties}
              />
            ))}
          </div>

          {/* Left panel content */}
          <div className="relative z-10 flex flex-col h-full px-12 py-10">
            {/* Brand */}
            <div className="flex items-center gap-3 mb-auto">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
                <img src="/efficiency.png" alt="Enera" className="h-6 w-6 object-contain" />
              </div>
              <span className="font-display text-xl font-bold text-white tracking-tight">Enera</span>
            </div>

            {/* Hero text */}
            <div className="flex flex-col gap-6 pb-16">
              <div className="hero-float" style={{ animationDelay: "0ms" }}>
                <p className="text-teal-200 text-sm font-semibold uppercase tracking-widest mb-3">
                  IoT Smart Energy Platform
                </p>
                <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight">
                  Smart Energy.<br />
                  <span className="text-teal-200">Smarter Living.</span>
                </h1>
                <p className="mt-4 text-teal-100/80 text-base leading-relaxed max-w-sm">
                  Real-time monitoring, automated billing, and intelligent insights for
                  modern residential societies.
                </p>
              </div>

              {/* Feature bullets */}
              <div className="flex flex-col gap-4 mt-2">
                {FEATURES.map((f, i) => (
                  <div
                    key={f.title}
                    className="hero-float flex items-start gap-3"
                    style={{ animationDelay: `${150 + i * 120}ms` }}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 border border-white/20 mt-0.5">
                      {f.icon}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{f.title}</p>
                      <p className="text-teal-100/70 text-xs mt-0.5 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom badge */}
              <div className="hero-float mt-4" style={{ animationDelay: "500ms" }}>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                  <span className="text-xs font-medium text-white">Live monitoring across 420+ smart meters</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL (45%) ── */}
        <div className="flex flex-1 lg:w-[45%] items-center justify-center bg-[#f4f5f8] px-4 py-12 relative">
          {/* Mobile top brand */}
          <div className="absolute top-6 left-0 right-0 flex justify-center lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500">
                <img src="/efficiency.png" alt="Enera" className="h-5 w-5 object-contain" />
              </div>
              <span className="font-display text-lg font-bold text-slate-800">Enera</span>
            </div>
          </div>

          {/* Subtle background blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-teal-500/6 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-emerald-500/6 blur-3xl" />
          </div>

          <div className="relative w-full max-w-[400px]">
            {/* Form header */}
            <div className="mb-7 text-center lg:text-left">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
              <p className="text-sm text-slate-500 mt-1">Sign in to your Enera dashboard</p>
            </div>

            {/* White card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">

              {/* Role selector — icon cards */}
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
                Sign in as
              </p>
              <div className="grid grid-cols-3 gap-2.5 mb-6">
                {ROLES.map((r) => {
                  const isSelected = role === r.key;
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => pickRole(r.key)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 px-2 transition-all duration-200 cursor-pointer group",
                        isSelected
                          ? "border-teal-500 bg-teal-50"
                          : "border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/40"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200",
                          isSelected
                            ? "bg-teal-500 text-white"
                            : "bg-slate-100 text-slate-500 group-hover:bg-teal-100 group-hover:text-teal-600"
                        )}
                      >
                        {r.icon}
                      </div>
                      <span
                        className={cn(
                          "text-[11px] font-semibold leading-tight text-center transition-colors",
                          isSelected ? "text-teal-700" : "text-slate-600"
                        )}
                      >
                        {r.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Login form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 pr-10 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-colors"
                      placeholder="••••••••"
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

                {error && (
                  <p className="text-xs font-medium text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || demoLoading}
                  className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-500 text-sm font-semibold text-white shadow-sm hover:bg-teal-600 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Demo link */}
              <p className="mt-5 text-center text-[11px] text-slate-400">
                Want to explore without an account?{" "}
                <button
                  type="button"
                  disabled={demoLoading || loading}
                  onClick={handleLaunchDemo}
                  className="font-semibold text-teal-500 hover:text-teal-700 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {demoLoading ? "Launching…" : "Launch Live Demo →"}
                </button>
              </p>
            </div>

            {/* Footer note */}
            <p className="mt-5 text-center text-[11px] text-slate-400">
              Enera · Smart IoT Energy Platform · v2.0
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
