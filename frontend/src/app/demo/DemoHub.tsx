import { useState } from "react";
import { Zap, Building2, Home, ShieldCheck, ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useWebSocketReading } from "../../context/WebSocketContext";
import type { Role } from "../../lib/types";

interface DemoRoleItem {
    role: Role;
    title: string;
    desc: string;
    email: string;
    password: string;
    target: string;
    icon: any;
    tag: string;
}


const DEMO_ROLES: DemoRoleItem[] = [
    {
        role: "RESIDENT",
        title: "Resident Dashboard",
        desc: "Live flat power usage, appliance spikes",
        email: "owner001@enera.com",
        password: "user1@user2007",
        target: "/flat/1",
        icon: Home,
        tag: "Flat 001",
    },
    {
        role: "SOCIETY_ADMIN",
        title: "Society Admin Dashboard",
        desc: "Live common areas (Lifts, Pumps, Gym) & DG generators for Society 1.",
        email: "society1@enera.com",
        password: "society1@Admin2007",
        target: "/society/1",
        icon: ShieldCheck,
        tag: "Society 1",
    },
    {
        role: "BUILDER_ADMIN",
        title: "Builder Admin Dashboard",
        desc: "Portfolio overview, multi-society load benchmarking & analytics.",
        email: "builder1@enera.com",
        password: "builder1@Admin2007",
        target: "/builder/1",
        icon: Building2,
        tag: "Builder Portfolio",
    },
];

export default function DemoHub() {
    const { isConnected, latestReading } = useWebSocketReading();
    const [loadingRole, setLoadingRole] = useState<string | null>(null);
    const { loginDemo } = useAuth();
    const navigate = useNavigate();

    const handleLaunch = (item: DemoRoleItem) => {
        loginDemo({
            id: 999,
            name: item.title,
            email: item.email,
            role: item.role,
            flatId: item.role === "RESIDENT" ? "1" : null,
            societyId: item.role === "SOCIETY_ADMIN" ? "1" : null,
            builderId: item.role === "BUILDER_ADMIN" ? "1" : null,
        });
        navigate(item.target);
    };


    return (
        <div className="min-h-screen bg-[#f4f5f8] flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-4xl">
                <button
                    onClick={() => navigate("/login")}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 cursor-pointer"
                >
                    <ArrowLeft size={14} /> Back to Sign In
                </button>
                {/* Live WebSocket Status Pill */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Enera Live Demo</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Select any role to view live telemetry simulated from the backend.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-xs">
                        <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                        <span className="font-medium text-slate-700">
                            {isConnected ? "WebSocket Live (5s tick)" : "WebSocket Disconnected"}
                        </span>
                    </div>
                </div>
                {/* 3 Role Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {DEMO_ROLES.map((card) => (
                        <div
                            key={card.role}
                            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="h-11 w-11 rounded-xl bg-teal-500/10 text-teal-700 flex items-center justify-center">
                                        <card.icon size={22} />
                                    </div>
                                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                        {card.tag}
                                    </span>
                                </div>
                                <h3 className="text-base font-bold text-slate-900">{card.title}</h3>
                                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{card.desc}</p>
                            </div>
                            <button
                                type="button"
                                disabled={loadingRole !== null}
                                onClick={() => handleLaunch(card)}
                                className="mt-6 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 px-4 rounded-xl cursor-pointer disabled:opacity-50 transition-all"
                            >
                                {loadingRole === card.role ? "Authenticating..." : "Explore View"} <ArrowRight size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}