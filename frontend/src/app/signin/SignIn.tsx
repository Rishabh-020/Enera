import { useEffect, useRef, useState } from "react";
import {
  Zap, Home, Building2, HardHat, Mail, Lock, Eye, EyeOff, ArrowRight, Activity, TrendingDown,
  ShieldCheck,
} from "lucide-react";
import {
  GlassInput,
  useSubmitGuard,
  validateEmail,
  validatePassword,
} from "../../components/auth/AuthShared";

/* ── Ultra-Dynamic Interactive Energy Grid Canvas (No boxed boundary) ─────── */
const DynamicEnergyGridBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Mouse interactive force field
    let mouse = { x: -1000, y: -1000, radius: 180 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    type Node = {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      vx: number;
      vy: number;
      radius: number;
      energy: number;
      color: string;
    };

    const COLORS = ["#0fff87", "#f59e0b", "#3b82f6", "#a855f7", "#104336"];
    const density = 14000;
    const count = Math.max(50, Math.floor((window.innerWidth * window.innerHeight) / density));

    const nodes: Node[] = Array.from({ length: count }, () => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      return {
        x,
        y,
        baseX: x,
        baseY: y,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2.5 + 1.5,
        energy: Math.random(),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      };
    });

    // High speed laser energy beams
    type Beam = {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      progress: number;
      speed: number;
      color: string;
    };
    const beams: Beam[] = [];

    const triggerBeam = () => {
      if (nodes.length < 2) return;
      const n1 = nodes[Math.floor(Math.random() * nodes.length)];
      let closeNodes: Node[] = [];
      nodes.forEach((n2) => {
        if (n1 === n2) return;
        const d = Math.hypot(n1.x - n2.x, n1.y - n2.y);
        if (d < 220) closeNodes.push(n2);
      });

      if (closeNodes.length > 0) {
        const n2 = closeNodes[Math.floor(Math.random() * closeNodes.length)];
        beams.push({
          x1: n1.x,
          y1: n1.y,
          x2: n2.x,
          y2: n2.y,
          progress: 0,
          speed: 0.03 + Math.random() * 0.04,
          color: n1.color,
        });
      }
    };

    const beamTimer = setInterval(triggerBeam, 200);

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Node physics & movement
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // Mouse repelling/attraction physics
        const dx = mouse.x - node.x;
        const dy = mouse.y - node.y;
        const dist = Math.hypot(dx, dy);

        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          node.x -= (dx / dist) * force * 3;
          node.y -= (dy / dist) * force * 3;
        }
      });

      // Connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.hypot(dx, dy);

          if (dist < 180) {
            const alpha = (1 - dist / 180) * 0.25;
            ctx.strokeStyle = `rgba(16, 67, 54, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Render Laser Beams
      for (let i = beams.length - 1; i >= 0; i--) {
        const b = beams[i];
        b.progress += b.speed;
        if (b.progress >= 1) {
          beams.splice(i, 1);
          continue;
        }

        const headX = b.x1 + (b.x2 - b.x1) * b.progress;
        const headY = b.y1 + (b.y2 - b.y1) * b.progress;
        const tailX = b.x1 + (b.x2 - b.x1) * Math.max(0, b.progress - 0.25);
        const tailY = b.y1 + (b.y2 - b.y1) * Math.max(0, b.progress - 0.25);

        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = b.color;
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.stroke();
        ctx.restore();
      }

      // Draw Nodes
      nodes.forEach((node) => {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = node.color;
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(beamTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    />
  );
};

/* ── Role Types ─────────────────────────────────────────────────────────── */
type Role = "resident" | "society_admin" | "builder";

const roles: { id: Role; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "resident", label: "Resident", icon: <Home size={16} />, desc: "Your flat's energy" },
  { id: "society_admin", label: "Society Admin", icon: <Building2 size={16} />, desc: "Manage your society" },
  { id: "builder", label: "Builder", icon: <HardHat size={16} />, desc: "Project oversight" },
];

// const ACCENT = "#f59e0b";

export default function SignIn() {
  const [activeRole, setActiveRole] = useState<Role>("resident");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const { guard, isLocked, cooldownSec } = useSubmitGuard();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const emailErr = validateEmail(email);
    const pwErr = validatePassword(password);

    if (emailErr || pwErr) {
      setErrors({ email: emailErr, password: pwErr });
      return;
    }

    try {
      await guard(async () => {
        setLoading(true);
        await new Promise((r) => setTimeout(r, 900));
        alert(`Signed in as ${activeRole.replace('_', ' ')} (${email})`);
      });
    } catch {
      setErrors({ general: "Invalid credentials. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const quickDemo = (role: Role) => {
    setActiveRole(role);
    setEmail(
      role === "resident" ? "resident@enera.io"
        : role === "society_admin" ? "admin@enera.io"
          : "builder@enera.io"
    );
    setPassword("demo1234");
    setErrors({});
  };

  return (
    <>
      <title>Sign In — Enera IoT Platform</title>
      <meta name="description" content="Sign in to Enera - The IoT Energy Monitoring Platform." />

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f3f1ec",
          fontFamily: "var(--font-inter)",
          position: "relative",
          overflow: "hidden",
          padding: "32px 24px",
        }}
      >
        <DynamicEnergyGridBackground />

        {/* Seamless Full Page Layout — Floating without boxed enclosure */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: "1100px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: "48px",
            alignItems: "center",
          }}
        >
          {/* LEFT SIDE: Floating Brand Showcase */}
          <div style={{ padding: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  background: "linear-gradient(135deg, #104336, #0fff87)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 20px rgba(15,255,135,0.4)",
                }}
              >
                <Zap size={22} color="#104336" fill="#104336" />
              </div>
              <span
                style={{
                  fontFamily: "var(--font-polysans)",
                  fontWeight: 700,
                  fontSize: "22px",
                  letterSpacing: "0.08em",
                  color: "#104336",
                  textTransform: "uppercase",
                }}
              >
                ENERA
              </span>
            </div>

            <h1
              style={{
                fontFamily: "var(--font-polysans)",
                fontWeight: 700,
                fontSize: "clamp(32px, 4vw, 46px)",
                lineHeight: 1.15,
                color: "#101f1e",
                marginBottom: "20px",
                letterSpacing: "-0.02em",
              }}
            >
              Smart Energy Telemetry for Housing Societies
            </h1>

            <p style={{ fontSize: "16px", color: "#535e5d", lineHeight: 1.65, marginBottom: "36px" }}>
              Connect hardware smart meters, track real-time 15-minute consumption, and automate resident billing effortlessly.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {[
                {
                  icon: <Activity size={20} color="#104336" />,
                  title: "Live IoT Telemetry",
                  desc: "Real-time updates directly from society smart meters",
                },
                {
                  icon: <TrendingDown size={20} color="#104336" />,
                  title: "Wastage Prevention",
                  desc: "Automated peak load warnings & 18% average cost savings",
                },
                {
                  icon: <ShieldCheck size={20} color="#104336" />,
                  title: "Role-Based Access Control",
                  desc: "Dedicated portals for Residents, Society Admins, and Builders",
                },
              ].map(({ icon, title, desc }) => (
                <div key={title} style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      background: "rgba(16,67,54,0.08)",
                      border: "1px solid rgba(16,67,54,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {icon}
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-polysans)", fontWeight: 700, fontSize: "15px", color: "#101f1e" }}>
                      {title}
                    </p>
                    <p style={{ fontSize: "13px", color: "#535e5d" }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE: Floating Glass Card (Form only) */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              border: "1.5px solid #afc4bf",
              borderRadius: "24px",
              padding: "40px 36px",
              boxShadow: "0 10px 36px rgba(16, 31, 30, 0.06)",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-polysans)",
                fontWeight: 700,
                fontSize: "24px",
                color: "#101f1e",
                marginBottom: "6px",
              }}
            >
              Sign In
            </h2>
            <p style={{ fontSize: "14px", color: "#535e5d", marginBottom: "24px" }}>
              Access your role-gated telemetry portal
            </p>

            {/* Role selector tabs */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "6px",
                background: "rgba(0,0,0,0.03)",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: "12px",
                padding: "4px",
                marginBottom: "24px",
              }}
            >
              {roles.map(({ id, label, icon }) => {
                const active = activeRole === id;
                return (
                  <button
                    key={id}
                    id={`signin-role-${id}`}
                    type="button"
                    onClick={() => setActiveRole(id)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                      padding: "8px 4px",
                      borderRadius: "8px",
                      border: "none",
                      background: active ? "rgba(16,67,54,0.12)" : "transparent",
                      color: active ? "#104336" : "#535e5d",
                      cursor: "pointer",
                      fontFamily: "var(--font-polysans)",
                      fontWeight: 600,
                      fontSize: "11px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {icon}
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Errors */}
            {errors.general && (
              <div
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  marginBottom: "16px",
                  fontSize: "12px",
                  color: "#DC2626",
                }}
              >
                {errors.general}
              </div>
            )}

            {isLocked && (
              <div
                style={{
                  background: "rgba(245,158,11,0.1)",
                  border: "1px solid rgba(245,158,11,0.3)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  marginBottom: "16px",
                  fontSize: "12px",
                  color: "#B45309",
                }}
              >
                Too many failed attempts. Try again in {cooldownSec}s.
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label
                  htmlFor="signin-email"
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "#535e5d",
                    marginBottom: "6px",
                  }}
                >
                  Email
                </label>
                <GlassInput
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@enera.io"
                  icon={<Mail size={16} />}
                  accentColor="#104336"
                  required
                />
                {errors.email && (
                  <p style={{ fontSize: "11px", color: "#DC2626", marginTop: "4px" }}>{errors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="signin-password"
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "#535e5d",
                    marginBottom: "6px",
                  }}
                >
                  Password
                </label>
                <GlassInput
                  id="signin-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                  icon={<Lock size={16} />}
                  accentColor="#104336"
                  required
                  suffix={
                    <button
                      type="button"
                      id="signin-toggle-pw"
                      onClick={() => setShowPw((p) => !p)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#9CA3AF",
                        display: "flex",
                        padding: 0,
                      }}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
                {errors.password && (
                  <p style={{ fontSize: "11px", color: "#DC2626", marginTop: "4px" }}>{errors.password}</p>
                )}
              </div>

              <div style={{ textAlign: "right" }}>
                <a
                  href="#forgot"
                  onClick={(e) => { e.preventDefault(); alert("Password reset requested"); }}
                  style={{ fontSize: "12px", color: "#104336", textDecoration: "none", fontWeight: 600 }}
                >
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                id="signin-submit-btn"
                disabled={loading || isLocked}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "13px",
                  borderRadius: "10px",
                  border: "none",
                  background: loading || isLocked ? "rgba(0,0,0,0.06)" : "#104336",
                  color: loading || isLocked ? "#9CA3AF" : "#0fff87",
                  fontFamily: "var(--font-polysans)",
                  fontWeight: 700,
                  fontSize: "14px",
                  letterSpacing: "0.03em",
                  cursor: loading || isLocked ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  marginTop: "4px",
                }}
              >
                {loading ? "Signing in…" : <><span>Sign in</span> <ArrowRight size={16} /></>}
              </button>
            </form>

            {/* Quick Demo Fill */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "20px 0 12px" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(0,0,0,0.08)" }} />
              <span style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CA3AF" }}>
                Quick Demo Fill
              </span>
              <div style={{ flex: 1, height: "1px", background: "rgba(0,0,0,0.08)" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
              {roles.map(({ id, label, icon }) => (
                <button
                  key={id}
                  id={`signin-demo-${id}`}
                  type="button"
                  onClick={() => quickDemo(id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    padding: "8px 2px",
                    borderRadius: "8px",
                    border: "1px solid rgba(0,0,0,0.08)",
                    background: "rgba(255,255,255,0.6)",
                    color: "#535e5d",
                    cursor: "pointer",
                    fontFamily: "var(--font-inter)",
                    fontSize: "11px",
                    fontWeight: 500,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#104336";
                    e.currentTarget.style.color = "#0fff87";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.6)";
                    e.currentTarget.style.color = "#535e5d";
                  }}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
