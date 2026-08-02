/**
 * AuthShared.tsx — Shared auth primitives (light glassmorphism theme)
 * Single source of truth. Fixes: C1-C3, C7-C8, C10, S2-S5, S7-S8, U1-U2
 */
import { useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────────────
   UTILITY
───────────────────────────────────────────────────────────────── */
export function hexAlpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/* ─────────────────────────────────────────────────────────────────
   VALIDATION  (Fix S3, S4)
───────────────────────────────────────────────────────────────── */
export const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export function validateEmail(v: string): string {
  if (!v.trim()) return "Email is required.";
  if (!EMAIL_RE.test(v)) return "Enter a valid email address.";
  return "";
}

export function validatePassword(v: string): string {
  if (!v) return "Password is required.";
  if (v.length < 8) return "Password must be at least 8 characters.";
  return "";
}

/* ─────────────────────────────────────────────────────────────────
   ENERGY BACKGROUND — light theme canvas  (Fix C2, C7)
   Renders soft glowing orbs + rising particles on a WHITE page.
   No lightning on light backgrounds (too harsh).
───────────────────────────────────────────────────────────────── */
export interface OrbConfig {
  x: number; y: number; r: number; color: string;
}

export const DEFAULT_ORBS: OrbConfig[] = [
  { x: 0.12, y: 0.20, r: 260, color: "#f59e0b" },
  { x: 0.88, y: 0.75, r: 300, color: "#4ade80" },
  { x: 0.55, y: 0.05, r: 180, color: "#60a5fa" },
];

interface EnergyBackgroundProps {
  orbs?: OrbConfig[];
}

export const EnergyBackground = ({ orbs = DEFAULT_ORBS }: EnergyBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0; // Fix C7

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    type Particle = {
      x: number; y: number; r: number;
      vx: number; vy: number; alpha: number; color: string;
    };
    type AnimOrb = OrbConfig & { pulse: number; dir: number };

    /* ── Rising energy particles (subtle on white) ── */
    const COLORS = ["#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#14b8a6"];
    const particles: Particle[] = Array.from({ length: 55 }, () => ({
      x:     Math.random() * window.innerWidth,
      y:     Math.random() * window.innerHeight,
      r:     Math.random() * 3 + 1,
      vx:    (Math.random() - 0.5) * 0.3,
      vy:    -(Math.random() * 0.5 + 0.2),
      alpha: Math.random() * 0.18 + 0.06, // very subtle on white
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    /* ── Animated orbs ── */
    const animOrbs: AnimOrb[] = orbs.map((o, i) => ({
      ...o,
      pulse: i * 0.9,
      dir:   i % 2 === 0 ? 1 : -1,
    }));

    /* ── Render loop ── */
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Orbs — very soft on white; alpha max 0.12
      animOrbs.forEach((o) => {
        o.pulse += 0.015 * o.dir;
        if (Math.abs(o.pulse) > 2.5) o.dir *= -1;
        const px  = o.x * canvas.width  + Math.sin(o.pulse * 0.6) * 30;
        const py  = o.y * canvas.height + Math.cos(o.pulse * 0.4) * 22;
        const rad = o.r + o.pulse * 12;
        if (rad <= 0) return;
        const g = ctx.createRadialGradient(px, py, 0, px, py, rad);
        g.addColorStop(0,   hexAlpha(o.color, 0.22));
        g.addColorStop(0.5, hexAlpha(o.color, 0.08));
        g.addColorStop(1,   hexAlpha(o.color, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, rad, 0, Math.PI * 2);
        ctx.fill();
      });

      // Particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10)               p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur  = 14;
        ctx.shadowColor = p.color;
        ctx.fillStyle   = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(tick);
    };

    tick();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [orbs]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    />
  );
};

/* ─────────────────────────────────────────────────────────────────
   GLASS INPUT — light theme  (Fix C3, C8, C10, U1, U2)
───────────────────────────────────────────────────────────────── */
interface GlassInputProps {
  id: string;
  type: React.HTMLInputTypeAttribute;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  suffix?: React.ReactNode;
  required?: boolean;
  maxLength?: number;
  autoComplete?: string;
  accentColor?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

export const GlassInput = ({
  id, type, value, onChange, placeholder, icon, suffix,
  required, maxLength, autoComplete,
  accentColor = "#f59e0b",
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: GlassInputProps) => {
  const [focused, setFocused] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: focused ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.7)",
        border: `1.5px solid ${focused ? accentColor : "rgba(0,0,0,0.1)"}`,
        borderRadius: "12px",
        padding: "0 14px",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        transition: "all 0.2s ease",
        boxShadow: focused
          ? `0 0 0 3px ${hexAlpha(accentColor, 0.15)}, 0 2px 8px rgba(0,0,0,0.06)`
          : "0 1px 4px rgba(0,0,0,0.05)",
      }}
    >
      <span
        style={{
          color: focused ? accentColor : "#9CA3AF",
          display: "flex",
          flexShrink: 0,
          transition: "color 0.2s",
        }}
        aria-hidden="true"
      >
        {icon}
      </span>

      {/* Fix U1: placeholder colour on light bg */}
      <style>{`#${id}::placeholder { color: #C0C4CC; font-size: 14px; }`}</style>

      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        autoComplete={autoComplete}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1,
          background: "none",
          border: "none",
          outline: "none",
          fontFamily: "'Inter', sans-serif",
          fontSize: "14px",
          color: "#111827",
          padding: "13px 0",
          minWidth: 0,
        }}
      />
      {suffix && <span style={{ display: "flex", flexShrink: 0 }}>{suffix}</span>}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   SUBMISSION GUARD  (Fix S2, S5)
───────────────────────────────────────────────────────────────── */
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS   = 30_000;

export function useSubmitGuard() {
  const submittingRef                 = useRef(false);
  const [attempts, setAttempts]       = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number>(0);
  const [cooldownSec, setCooldownSec] = useState(0);

  useEffect(() => {
    if (lockedUntil === 0) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setCooldownSec(left);
      if (left === 0) { setLockedUntil(0); clearInterval(id); }
    }, 500);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const isLocked = Date.now() < lockedUntil;

  const guard = async (fn: () => Promise<void>): Promise<boolean> => {
    if (submittingRef.current) return false;
    if (isLocked)              return false;
    submittingRef.current = true;
    try {
      await fn();
      setAttempts(0);
      return true;
    } catch (err) {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_MS);
        setCooldownSec(LOCKOUT_MS / 1000);
      }
      throw err;
    } finally {
      submittingRef.current = false;
    }
  };

  return { guard, isLocked, attemptsLeft: Math.max(0, MAX_ATTEMPTS - attempts), cooldownSec };
}
