import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ReceiptText,
  FlaskConical,
  Users,
  BarChart3,
  Plus,
  ArrowUpRight,
  Microscope,
  Activity,
  MapPin,
  Phone,
} from "lucide-react";

// ─── helpers ──────────────────────────────────────────────────────────────────
const useClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

// ─── config ──────────────────────────────────────────────────────────────────
const LAB = {
  name: "Digi Lab Health Care",
  tagline: "Advanced Diagnostics & Pathology",
  address: "House 12, Road 4, Dhanmondi, Dhaka",
  phone: "+880 1700-000000",
  id: "123456",
};

const USER = {
  name: "Admin",
  role: "Lab Administrator",
  initials: "AD",
};

// ─── actions ─────────────────────────────────────────────────────────────────
const ACTIONS = [
  {
    to: "/invoice/new",
    icon: Plus,
    label: "New Invoice",
    sub: "Create patient billing",
    grad: "from-violet-500 to-indigo-600",
    glow: "rgba(99,102,241,0.3)",
  },
  {
    to: "/invoice/all",
    icon: ReceiptText,
    label: "Invoices",
    sub: "View & manage records",
    grad: "from-sky-400 to-blue-600",
    glow: "rgba(59,130,246,0.3)",
  },
  {
    to: "/reports",
    icon: FlaskConical,
    label: "Reports",
    sub: "Test results & data",
    grad: "from-teal-400 to-emerald-600",
    glow: "rgba(16,185,129,0.3)",
  },
  {
    to: "/referrers",
    icon: Users,
    label: "Referrers",
    sub: "Doctors & commissions",
    grad: "from-fuchsia-500 to-pink-600",
    glow: "rgba(217,70,239,0.3)",
  },
  {
    to: "/cashmemo",
    icon: BarChart3,
    label: "Cash Memo",
    sub: "Profit & collections",
    grad: "from-amber-400 to-orange-500",
    glow: "rgba(245,158,11,0.3)",
  },
  {
    to: "/lab-management",
    icon: Microscope,
    label: "Lab Settings",
    sub: "Tests & configuration",
    grad: "from-slate-500 to-slate-700",
    glow: "rgba(100,116,139,0.3)",
  },
];

// ─── Action card ─────────────────────────────────────────────────────────────
const Card = ({ to, icon: Icon, label, sub, grad, glow, idx }) => (
  <Link
    to={to}
    className="group relative rounded-2xl overflow-hidden"
    style={{ animation: `cardIn 0.5s cubic-bezier(.22,1,.36,1) ${200 + idx * 55}ms both` }}
  >
    <div className="relative h-full bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl overflow-hidden">
      <div
        className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-2xl"
        style={{ background: glow }}
      />
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
        <div className="w-7 h-7 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200">
          <ArrowUpRight className="w-3.5 h-3.5 text-gray-500" />
        </div>
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900 leading-tight">{label}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
      </div>
      <div className={`absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full bg-gradient-to-r ${grad} transition-all duration-500`} />
    </div>
  </Link>
);

// ─── Home ────────────────────────────────────────────────────────────────────
const Home = () => {
  const clock = useClock();

  return (
    <div className="min-h-screen bg-[#f0f1f7] relative overflow-hidden">

      {/* ── Background blobs ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-48 -left-48 w-[560px] h-[560px] rounded-full opacity-[0.18] blur-3xl"
          style={{ background: "radial-gradient(circle, #818cf8, transparent 70%)" }} />
        <div className="absolute top-1/2 -right-48 w-[420px] h-[420px] rounded-full opacity-[0.12] blur-3xl"
          style={{ background: "radial-gradient(circle, #34d399, transparent 70%)" }} />
      </div>

      {/* ── Fine grid ── */}
      <div className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,0.035) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(99,102,241,0.035) 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
        }}
      />

      <div className="relative max-w-3xl mx-auto px-4 pt-7 pb-16">

        {/* ══════════════════════════════════════
            TOP NAV BAR
        ══════════════════════════════════════ */}
        <div className="flex items-center justify-between mb-5"
          style={{ animation: "cardIn 0.4s cubic-bezier(.22,1,.36,1) both" }}>

          {/* Brand mark */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <Microscope className="w-[17px] h-[17px] text-white" strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[11px] font-black text-gray-900 tracking-widest uppercase leading-none">LabPilot</p>
              <p className="text-[9.5px] text-gray-400 leading-none mt-0.5">Lab Management</p>
            </div>
          </div>

          {/* Clock only */}
          <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur border border-gray-100 rounded-xl px-3 py-2 shadow-sm">
            <Activity className="w-3 h-3 text-emerald-500" />
            <span className="text-xs font-mono font-bold text-gray-700 tabular-nums">{clock}</span>
          </div>
        </div>

        {/* ══════════════════════════════════════
            LAB CARD
        ══════════════════════════════════════ */}
        <div className="mb-4 rounded-2xl overflow-hidden relative shadow-sm"
          style={{ animation: "cardIn 0.55s cubic-bezier(.22,1,.36,1) 0.06s both",
                   background: "linear-gradient(135deg, #f8f7ff 0%, #ffffff 50%, #f0fdfa 100%)",
                   border: "1px solid rgba(99,102,241,0.1)" }}>

          {/* top gradient line */}
          <div className="h-[3px] w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-teal-400" />

          {/* corner glow */}
          <div className="absolute top-0 right-0 w-52 h-52 pointer-events-none"
            style={{ background: "radial-gradient(circle at top right, rgba(129,140,248,0.08), transparent 65%)" }} />

          <div className="px-5 py-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">

              {/* Left — logo + all text */}
              <div className="flex items-start">
                {/* Text block */}
                <div>
                  <p className="text-[9.5px] font-bold text-indigo-400 uppercase tracking-[0.14em] leading-none mb-1.5">
                    Powered by LabPilot
                  </p>
                  <h2 className="text-lg font-black text-gray-900 leading-tight tracking-tight">
                    {LAB.name}
                  </h2>
                  <p className="text-[11.5px] text-gray-400 font-medium mt-0.5 mb-2.5">{LAB.tagline}</p>

                  {/* Address + Phone inline */}
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-md bg-indigo-50 flex items-center justify-center">
                        <MapPin className="w-2.5 h-2.5 text-indigo-400" />
                      </div>
                      <span className="text-[11px] text-gray-500">{LAB.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-md bg-teal-50 flex items-center justify-center">
                        <Phone className="w-2.5 h-2.5 text-teal-500" />
                      </div>
                      <span className="text-[11px] text-gray-500">{LAB.phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right — Lab ID + status */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="px-3 py-2 rounded-xl text-right"
                  style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.12)" }}>
                  <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest leading-none">Lab ID</p>
                  <p className="text-base font-black text-indigo-700 leading-tight mt-0.5">{LAB.id}</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                  style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.15)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-600">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* User strip */}
          <div className="px-5 py-2.5 flex items-center justify-between gap-3 flex-wrap"
            style={{ background: "rgba(0,0,0,0.025)", borderTop: "1px solid rgba(99,102,241,0.07)" }}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0">
                <span className="text-[8px] font-black text-white">{USER.initials}</span>
              </div>
              <span className="text-[11.5px] font-bold text-gray-700">{USER.name}</span>
              <span className="text-gray-200 text-xs">|</span>
              <span className="text-[11px] text-gray-400">{USER.role}</span>
            </div>
            <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest">Full Admin</span>
          </div>
        </div>

        {/* ══════════════════════════════════════
            QUICK ACCESS
        ══════════════════════════════════════ */}
        <div className="flex items-center gap-3 mb-3"
          style={{ animation: "cardIn 0.5s cubic-bezier(.22,1,.36,1) 0.15s both" }}>
          <p className="text-[10.5px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
            Quick Access
          </p>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ACTIONS.map((action, idx) => (
            <Card key={action.to} {...action} idx={idx} />
          ))}
        </div>

        {/* ── Footer ── */}
        <p className="text-center text-[11px] text-gray-300 font-medium mt-10">
          LabPilot · Diagnostic Lab Management System
        </p>
      </div>

      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Home;