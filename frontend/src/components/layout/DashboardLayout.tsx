import type { ReactNode } from "react";
import { Zap, LogOut, LayoutGrid, Cpu, Building2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
import type { Role } from "../../lib/types";

const ROLE_LABEL: Record<Role, string> = {
  flat_owner: "Flat Owner",
  society_admin: "Society Admin",
  builder_admin: "Builder Admin",
};

export interface NavItem {
  key: string;
  label: string;
  icon?: ReactNode;
}

interface DashboardLayoutProps {
  nav?: NavItem[];
  activeKey?: string;
  onNav?: (key: string) => void;
  banner?: ReactNode;
  children: ReactNode;
}

export function DashboardLayout({ nav = [], activeKey, onNav, banner, children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f4f5f8]">
      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-grid-900 px-4 py-6 md:flex">
          <div className="flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amp-500">
              <Zap size={16} className="text-grid-950" strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg font-semibold text-white">Amperly</span>
          </div>
          <p className="mt-1 px-2 text-[11px] uppercase tracking-widest text-slate-500">Energy Ops</p>

          <nav className="mt-8 flex flex-1 flex-col gap-1">
            {nav.map((item) => (
              <button
                key={item.key}
                onClick={() => onNav?.(item.key)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white",
                  activeKey === item.key && "bg-white/10 text-white"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto rounded-xl bg-grid-800 p-3">
            <p className="text-xs font-medium text-white">{user?.name}</p>
            <p className="text-[11px] text-slate-400">{user && ROLE_LABEL[user.role]}</p>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-amp-400"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="min-h-screen flex-1">
          {/* mobile topbar */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amp-500">
                <Zap size={14} className="text-grid-950" />
              </div>
              <span className="font-display text-base font-semibold text-grid-900">Amperly</span>
            </div>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="text-xs font-medium text-slate-500"
            >
              Sign out
            </button>
          </div>

          {banner}

          <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

export const NAV_ICON: Record<string, ReactNode> = {
  grid: <LayoutGrid size={16} />,
  device: <Cpu size={16} />,
  society: <Building2 size={16} />,
};
