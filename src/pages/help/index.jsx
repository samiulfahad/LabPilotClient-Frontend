import { Phone, Mail, Clock, MapPin, HelpCircle, MessageSquare } from "lucide-react";

export default function Help() {
  const supportChannels = [
    {
      icon: Phone,
      title: "Phone Support",
      desc: "Call us directly for immediate assistance",
      value: "+880 1711-223344",
      sub: "Available: 9:00 AM - 8:00 PM (EST)",
      grad: "from-blue-500 to-indigo-600",
      glow: "rgba(79, 70, 229, 0.25)",
      delay: "0.1s",
    },
    {
      icon: Mail,
      title: "Email Support",
      desc: "Drop us an email anytime",
      value: "support@labpilot.com",
      sub: "Average response time: 2 hours",
      grad: "from-emerald-400 to-teal-600",
      glow: "rgba(16, 185, 129, 0.25)",
      delay: "0.15s",
    },
    {
      icon: MessageSquare,
      title: "WhatsApp",
      desc: "Text us for quick queries",
      value: "+880 1711-223344",
      sub: "Available: 24/7 Automated + Live Agents",
      grad: "from-green-400 to-emerald-500",
      glow: "rgba(52, 211, 153, 0.25)",
      delay: "0.2s",
    },
    {
      icon: MapPin,
      title: "Corporate Office",
      desc: "Visit us for official queries",
      value: "House 12, Road 4, Dhanmondi",
      sub: "Dhaka, Bangladesh",
      grad: "from-violet-500 to-fuchsia-600",
      glow: "rgba(139, 92, 246, 0.25)",
      delay: "0.25s",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f0f1f7] relative overflow-hidden">
      {/* ── Background blobs ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-48 -left-48 w-[560px] h-[560px] rounded-full opacity-[0.18] blur-3xl"
          style={{ background: "radial-gradient(circle, #818cf8, transparent 70%)" }}
        />
        <div
          className="absolute top-1/2 -right-48 w-[420px] h-[420px] rounded-full opacity-[0.12] blur-3xl"
          style={{ background: "radial-gradient(circle, #34d399, transparent 70%)" }}
        />
      </div>

      {/* ── Fine grid ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,0.035) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(99,102,241,0.035) 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
        }}
      />

      <div className="relative max-w-3xl mx-auto px-4 pt-7 pb-16">
        {/* ══════════════════════════════════════
            HEADER
        ══════════════════════════════════════ */}
        <div
          className="flex items-center gap-3 mb-8"
          style={{ animation: "cardIn 0.4s cubic-bezier(.22,1,.36,1) both" }}
        >
          <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-inner">
              <HelpCircle className="w-[18px] h-[18px] text-white" strokeWidth={2.2} />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">
              Support Center<span className="text-indigo-500">.</span>
            </h1>
            <p className="text-xs text-gray-500 font-medium">How can we help you today?</p>
          </div>
        </div>

        {/* ══════════════════════════════════════
            CONTACT CARDS
        ══════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {supportChannels.map((channel, idx) => {
            const Icon = channel.icon;
            return (
              <div
                key={idx}
                className="group relative bg-white border border-gray-100 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden"
                style={{ animation: `cardIn 0.5s cubic-bezier(.22,1,.36,1) ${channel.delay} both` }}
              >
                {/* Glow effect */}
                <div
                  className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none"
                  style={{ background: channel.glow }}
                />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${channel.grad} flex items-center justify-center shadow-lg shadow-gray-200/50`}
                    >
                      <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-sm font-bold text-gray-900">{channel.title}</p>
                    <p className="text-[11.5px] text-gray-400 mt-0.5">{channel.desc}</p>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-50">
                    <p className="text-base font-black text-gray-800 tracking-tight">{channel.value}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{channel.sub}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <p
          className="text-center text-[11px] text-gray-300 font-medium mt-12"
          style={{ animation: "cardIn 0.5s cubic-bezier(.22,1,.36,1) 0.4s both" }}
        >
          LabPilot · Always here for you
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
}
