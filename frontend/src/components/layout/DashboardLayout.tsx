import { useState, type ReactNode } from "react";
import { LogOut, LayoutGrid, Cpu, Building2, Bell, ChevronLeft, ChevronRight, BarChart3, AlertTriangle, Users, CreditCard, Settings, Home, FileText, Menu, X, KeyRound } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
// This cn method is used to add flexibility in the css like when we have to make the website reponsive then we have
// to select between the two css with respect to the width as we are use boolean to check for the colaps nav then
// this is helpfull
import type { Role } from "../../lib/types";
import { Avatar, SearchBar, SwitchViewToggle } from "../ui/primitives";
import { ChangePasswordModal } from "../auth/ChangePasswordModal";


const ROLE_CONFIG: Record<Role, { label: string; demoView: "Resident" | "Admin" | "Builder" }> = {
  RESIDENT: { label: "Resident", demoView: "Resident" },
  SOCIETY_ADMIN: { label: "Society Admin", demoView: "Admin" },
  BUILDER_ADMIN: { label: "Builder Admin", demoView: "Builder" },
  SUPER_ADMIN: { label: "Super Admin", demoView: "Admin" },
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
  const { user, logout, isDemoMode, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleSwitchView = async (option: string) => {
    if (isDemoMode && (option === "Resident" || option === "Admin" || option === "Builder")) {
      try {
        const newUser = await switchDemoRole(option as "Resident" | "Admin" | "Builder");
        const routes: Record<string, string> = {
          Resident: `/flat/${newUser.flatId || "1"}`,
          Admin: `/society/${newUser.societyId || "1"}`,
          Builder: `/builder/${newUser.builderId || "1"}`,
        };
        navigate(routes[option] || "/");
      } catch (err) {
        console.error("Failed to switch demo role:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f8]">
      <div className="flex">
        {/* ─── Sidebar (dark charcoal) ─── */}
        <aside
          className={cn(
            "sticky top-0 hidden h-screen shrink-0 flex-col bg-grid-900 md:flex transition-all duration-300 ease-in-out overflow-hidden z-20 border-r border-white/5",
            collapsed ? "w-[68px]" : "w-60"
          )}
        >
          <div className={cn("px-4 py-5", collapsed && "px-3")}>
            {/* Brand */}
            <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500 shrink-0">
                <img src="/efficiency.png" alt="Enera" className="h-5 w-5 object-contain" />
              </div>
              {!collapsed && (
                <span className="font-display text-lg font-bold text-white sidebar-fade-in">Enera</span>
              )}
            </div>

            {/* Section label */}
            {!collapsed && (
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500 sidebar-fade-in">
                {user ? ROLE_CONFIG[user.role].label : ""}
              </p>
            )}
          </div>

          {/* Nav items */}
          <nav className={cn("mt-1 flex flex-1 flex-col gap-0.5 px-3 overflow-y-auto", collapsed && "px-2")}>
            {nav.map((item) => (
              <button
                key={item.key}
                onClick={() => onNav?.(item.key)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer select-none",
                  collapsed && "justify-center px-0",
                  activeKey === item.key
                    ? "bg-teal-500/12 text-teal-400 font-semibold"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                <span className={cn(
                  "shrink-0 transition-colors",
                  activeKey === item.key && "text-teal-400"
                )}>
                  {item.icon}
                </span>
                {!collapsed && <span className="sidebar-fade-in truncate">{item.label}</span>}
              </button>
            ))}
          </nav>

          {/* Bottom section */}
          <div className={cn("mt-auto px-3 pb-4 flex flex-col gap-3.5", collapsed && "px-2 pb-3")}>
            {/* User card */}
            <div className={cn(
              "rounded-xl bg-grid-800/80 border border-white/5 p-3 transition-colors hover:bg-grid-800",
              collapsed && "p-2 flex items-center justify-center"
            )}>
              {collapsed ? (
                <button
                  onClick={() => setShowPasswordModal(true)}
                  title="Change Password"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <Avatar name={user?.name ?? "U"} size="sm" />
                </button>
              ) : (
                <div className="flex items-center justify-between gap-2 sidebar-fade-in min-w-0">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Avatar name={user?.name ?? "U"} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">{user?.name ?? "User"}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user?.email ?? ""}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                    title="Change Password"
                  >
                    <KeyRound size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Collapse / Logout */}
            <div className={cn(
              "flex items-center pt-1 border-t border-white/5",
              collapsed ? "justify-center" : "justify-between"
            )}>
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer py-1 px-1.5 rounded-lg hover:bg-white/5"
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <ChevronRight size={15} />
                ) : (
                  <>
                    <ChevronLeft size={15} />
                    <span className="sidebar-fade-in">Collapse</span>
                  </>
                )}
              </button>
              {!collapsed && (
                <button
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-rose-400 transition-colors cursor-pointer py-1 px-1.5 rounded-lg hover:bg-white/5 sidebar-fade-in"
                >
                  <LogOut size={13} /> Logout
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile drawer backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Mobile drawer sidebar */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 bg-grid-900 flex flex-col transition-transform duration-300 ease-in-out md:hidden shadow-2xl",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500">
                <img src="/efficiency.png" alt="Enera" className="h-5 w-5 object-contain" />
              </div>
              <span className="font-display text-lg font-bold text-white">Enera</span>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="px-4 pt-3 pb-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
              {user ? ROLE_CONFIG[user.role].label : ""}
            </p>
          </div>

          {/* Mobile Nav list */}
          <nav className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1">
            {nav.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  onNav?.(item.key);
                  setMobileOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 cursor-pointer w-full text-left",
                  activeKey === item.key
                    ? "bg-teal-500/15 text-teal-400 font-semibold"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                )}
              >
                <span className={cn(activeKey === item.key && "text-teal-400")}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Mobile drawer bottom */}
          <div className="p-4 border-t border-white/5 flex flex-col gap-3.5 bg-grid-950/50">
            {isDemoMode && (
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                  Switch View (Demo)
                </p>
                <SwitchViewToggle
                  options={["Resident", "Admin", "Builder"]}
                  active={user ? ROLE_CONFIG[user.role].demoView : "Admin"}
                  onChange={(opt) => {
                    handleSwitchView(opt);
                    setMobileOpen(false);
                  }}
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={user?.name ?? "U"} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setShowPasswordModal(true);
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-white/5 transition-colors cursor-pointer"
                  title="Change Password"
                >
                  <KeyRound size={16} />
                </button>
                <button
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
                  title="Log Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Main content ─── */}
        <main className="min-h-screen flex-1 min-w-0">
          {/* Top bar (desktop) */}
          <div className="sticky top-0 z-10 hidden items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-sm px-6 py-2.5 md:flex">
            <div className="w-[360px] max-w-full">
              <SearchBar placeholder="Search flats, residents, or devices..." />
            </div>
            <div className="flex items-center gap-3">
              {/* Demo Mode Role Switcher in Topbar */}
              {isDemoMode && (
                <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 px-2 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" /> Demo:
                  </span>
                  <div className="flex items-center gap-1">
                    {(["Resident", "Admin", "Builder"] as const).map((opt) => {
                      const isActive = user && ROLE_CONFIG[user.role].demoView === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleSwitchView(opt)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                            isActive
                              ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
                              : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/60"
                          )}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Role badge */}
              <div className="flex items-center gap-1.5 rounded-full bg-grid-900 px-3 py-1.5 text-xs font-medium text-slate-200">
                <span className="text-teal-400">✦</span>
                {user ? ROLE_CONFIG[user.role].label : ""}
              </div>
              {/* Notification bell */}
              <button className="relative p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer" aria-label="Notifications">
                <Bell size={18} className="text-slate-500" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-teal-500 ring-2 ring-white" />
              </button>
            </div>
          </div>

          {/* Mobile topbar */}
          <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="p-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center"
                aria-label="Open Navigation Menu"
              >
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500">
                  <img src="/efficiency.png" alt="Enera" className="h-4.5 w-4.5 object-contain" />
                </div>
                <span className="font-display text-base font-bold text-grid-900">Enera</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 cursor-pointer flex items-center gap-1"
                title="Change Password"
              >
                <span>{user ? ROLE_CONFIG[user.role].label : ""}</span>
                <KeyRound size={12} className="text-slate-500" />
              </button>
              <button className="relative p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer">
                <Bell size={17} />
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-teal-500" />
              </button>
            </div>
          </div>

          {banner}

          <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8">{children}</div>
        </main>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
}

/* ─── Nav icon presets ─── */

export const NAV_ITEMS_RESIDENT: NavItem[] = [
  { key: "dashboard", label: "My Dashboard", icon: <Home size={16} /> },
  { key: "bills", label: "My Bills", icon: <FileText size={16} /> },
  { key: "alerts", label: "Alerts", icon: <AlertTriangle size={16} /> },
  { key: "settings", label: "Settings", icon: <Settings size={16} /> },
];

export const NAV_ITEMS_SOCIETY: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: <LayoutGrid size={16} /> },
  { key: "analytics", label: "Analytics", icon: <BarChart3 size={16} /> },
  { key: "alerts", label: "Alerts", icon: <AlertTriangle size={16} /> },
  { key: "devices", label: "Devices", icon: <Cpu size={16} /> },
  { key: "residents", label: "Residents", icon: <Users size={16} /> },
  { key: "billing", label: "Billing", icon: <CreditCard size={16} /> },
  { key: "settings", label: "Settings", icon: <Settings size={16} /> },
];

export const NAV_ITEMS_BUILDER: NavItem[] = [
  { key: "portfolio", label: "Portfolio", icon: <Building2 size={16} /> },
  { key: "analytics", label: "Analytics", icon: <BarChart3 size={16} /> },
];

export const NAV_ITEMS_SUPER_ADMIN: NavItem[] = [
  { key: "overview", label: "Overview", icon: <LayoutGrid size={16} /> },
  { key: "builders", label: "Builders", icon: <Building2 size={16} /> },
  { key: "societies", label: "Societies", icon: <Home size={16} /> },
  { key: "topology", label: "Topology & Blocks", icon: <Cpu size={16} /> },
];

export const NAV_ICON: Record<string, ReactNode> = {
  grid: <LayoutGrid size={16} />,
  device: <Cpu size={16} />,
  society: <Building2 size={16} />,
};
