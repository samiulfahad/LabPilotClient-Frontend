import { Link } from "react-router-dom";
import { FlaskConical, Package, Users, UserCheck, BedDouble, Stethoscope } from "lucide-react";

const CARDS = [
  {
    title: "টেস্ট ব্যবস্থাপনা",
    subtitle: "Tests",
    icon: FlaskConical,
    link: "/manage-tests",
    accent: "#1E4FA0",
    bg: "#EEF2FA",
    border: "rgba(30,79,160,0.2)",
  },
  {
    title: "পণ্য তালিকা",
    subtitle: "Products",
    icon: Package,
    link: "/manage-products",
    accent: "#B07D1A",
    bg: "#FAF3E0",
    border: "rgba(176,125,26,0.2)",
  },
  {
    title: "কর্মী ব্যবস্থাপনা",
    subtitle: "Staff",
    icon: Users,
    link: "/manage-staffs",
    accent: "#0F6E5C",
    bg: "#E5F4F0",
    border: "rgba(15,110,92,0.2)",
  },
  {
    title: "রেফারার ব্যবস্থাপনা",
    subtitle: "Referrers",
    icon: UserCheck,
    link: "/manage-referrers",
    accent: "#6B3FA0",
    bg: "#F2ECFA",
    border: "rgba(107,63,160,0.2)",
  },
  {
    title: "ভর্তি স্থান",
    subtitle: "Spaces",
    icon: BedDouble,
    link: "/manage-spaces",
    accent: "#0E7090",
    bg: "#E5F4F8",
    border: "rgba(14,112,144,0.2)",
  },
  {
    title: "কর্তব্যরত চিকিৎসক",
    subtitle: "Doctors",
    icon: Stethoscope,
    link: "/manage-doctors",
    accent: "#C0312B",
    bg: "#FEF0EF",
    border: "rgba(192,49,43,0.2)",
    badge: "নিয়োগকৃত",
  },
];

const SetupCard = ({ card }) => (
  <Link
    to={card.link}
    className="block bg-white border border-[#E3E0D6] rounded-[3px] hover:shadow-sm transition-all"
    style={{ borderLeft: `2px solid ${card.accent}` }}
  >
    <div className="p-4 pb-3">
      {/* Icon + title */}
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-8 h-8 rounded-[3px] flex items-center justify-center shrink-0"
          style={{ background: card.bg, border: `1px solid ${card.border}` }}
        >
          <card.icon style={{ width: 15, height: 15, color: card.accent }} />
        </div>
        <div>
          <p
            className="font-['IBM_Plex_Mono'] text-[9px] uppercase tracking-[.07em] mb-0"
            style={{ color: card.accent }}
          >
            {card.subtitle}
          </p>
          <p className="font-['IBM_Plex_Sans'] text-[13px] font-semibold text-[#1C1F1E] leading-tight">{card.title}</p>
        </div>
      </div>

      {/* Footer chip row */}
      <div className="flex items-center justify-between border-t border-[#EDEBE3] pt-2.5">
        <span
          className="inline-flex items-center gap-1 font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wide border rounded-[2px] px-2 py-0.5"
          style={{ color: card.accent, borderColor: card.border }}
        >
          পরিচালনা করুন →
        </span>
        {card.badge && (
          <span className="font-['IBM_Plex_Mono'] text-[9px] uppercase tracking-[.05em] text-[#A8ACA3] bg-[#F5F4EF] border border-[#E3E0D6] rounded-[2px] px-1.5 py-0.5">
            {card.badge}
          </span>
        )}
      </div>
    </div>
  </Link>
);

const Setup = () => (
  <section
    className="min-h-screen px-6 py-6 font-noto"
    style={{
      backgroundColor: "#F5F4EF",
      backgroundImage: "radial-gradient(circle, rgba(28,31,30,0.05) 1px, transparent 1px)",
      backgroundSize: "18px 18px",
    }}
  >
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[.07em] text-[#0F6E5C] mb-1">ল্যাব অপারেশন</p>
        <h1 className="font-['IBM_Plex_Sans'] text-2xl sm:text-3xl font-semibold text-[#1C1F1E] tracking-tight">
          ল্যাব ম্যানেজমেন্ট
        </h1>
        <p className="font-['IBM_Plex_Mono'] text-xs text-[#A8ACA3] mt-1">সিস্টেম কনফিগারেশন ও ব্যবস্থাপনা</p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {CARDS.map((card) => (
          <SetupCard key={card.link} card={card} />
        ))}
      </div>

      <p className="font-['IBM_Plex_Mono'] text-center text-xs text-[#A8ACA3] mt-6 pb-4">
        LabPilotPro · ল্যাব ম্যানেজমেন্ট সিস্টেম
      </p>
    </div>
  </section>
);

export default Setup;
