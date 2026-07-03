import { Users, Pill, FlaskConical, Package, MoreHorizontal } from "lucide-react";

export const fmt = (n) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", minimumFractionDigits: 0 }).format(n || 0);

export const fmtNum = (n) => (typeof n === "number" ? n.toLocaleString("en-IN") : "0");

export const formatDateTime = (ts) => {
  const d = new Date(ts);
  const day = d.getDate();
  const suffix =
    day % 10 === 1 && day % 100 !== 11
      ? "st"
      : day % 10 === 2 && day % 100 !== 12
        ? "nd"
        : day % 10 === 3 && day % 100 !== 13
          ? "rd"
          : "th";
  const h = d.getHours();
  return {
    date: `${day}${suffix} ${d.toLocaleString("default", { month: "short" })}, ${d.getFullYear()}`,
    time: `${h % 12 === 0 ? 12 : h % 12}:${String(d.getMinutes()).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`,
  };
};

export const headingLabel = (timeRange) => {
  if (!timeRange) return "";
  const s = new Date(timeRange.start);
  const e = new Date(timeRange.end);
  const day = (d) => {
    const n = d.getDate();
    const sfx =
      n % 10 === 1 && n % 100 !== 11
        ? "st"
        : n % 10 === 2 && n % 100 !== 12
          ? "nd"
          : n % 10 === 3 && n % 100 !== 13
            ? "rd"
            : "th";
    return `${n}${sfx}`;
  };
  const monthYear = (d) => `${d.toLocaleString("en-US", { month: "long" })}, ${d.getFullYear()}`;
  if (s.toDateString() === e.toDateString()) return `${day(s)} ${monthYear(s)}`;
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  if (sameMonth) return `${s.getDate()} – ${e.getDate()} ${monthYear(s)}`;
  return `${s.toLocaleString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
};

export const EXPENSE_TYPES = [
  { key: "staffSalary", label: "স্টাফ বেতন", icon: Users, color: "#1E4FA0" },
  { key: "medicine", label: "মেডিসিন", icon: Pill, color: "#C0312B" },
  { key: "testKit", label: "টেস্ট কিট", icon: FlaskConical, color: "#0F6E5C" },
  { key: "products", label: "প্রোডাক্টস", icon: Package, color: "#9C6B1F" },
  { key: "others", label: "অন্যান্য", icon: MoreHorizontal, color: "#6F756F" },
];

export const typeConfig = (key) => EXPENSE_TYPES.find((t) => t.key === key) ?? EXPENSE_TYPES[4];
