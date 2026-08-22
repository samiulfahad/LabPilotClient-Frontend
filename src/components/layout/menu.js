import {
  Home,
  ReceiptText,
  CalendarClock,
  Stethoscope,
  BedDouble,
  Wallet,
  ClipboardList,
  Activity,
  CreditCard,
  UserCircle,
  Settings,
  HelpCircle,
  FolderKanban,
} from "lucide-react";

// `module: null` means the item is always visible (no module gate) — Home,
// My Activity, Account, Help. Everything else maps 1:1 to the module names
// coming out of ALLOWED_PERMISSIONS on the backend (see staticData.js) and
// used by RequireModules in App.jsx, so a nav item only ever links somewhere
// the route gate will actually let the person into.
export const hospitalMenu = [
  { label: "প্রধান পাতা", path: "/", icon: Home, module: null },
  { label: "নতুন ইনভয়েস", path: "/outdoor/invoice/new", icon: ReceiptText, module: "invoice" },
  { label: "ডেইলি রিপোর্টস", path: "/daily-reports", icon: CalendarClock, module: "dailyReport" },
  { label: "আউটডোর রোগী", path: "/outdoor/", icon: Stethoscope, module: "invoice" },
  { label: "ইনডোর রোগী", path: "/ipd-master", icon: BedDouble, module: "indoorPatient" },
  { label: "খরচ ও ব্যয়", path: "/expense", icon: Wallet, module: "expense" },
  { label: "টেস্ট রিপোর্টস", path: "/report", icon: ClipboardList, module: "testReport" },
  { label: "আমার এক্টিভিটি", path: "/my-activity", icon: Activity, module: null },
  { label: "মাসিক বিলিং", path: "/billing", icon: CreditCard, module: "billing" },
  { label: "অ্যাকাউন্ট", path: "/account", icon: UserCircle, module: null },
  { label: "সেটআপ", path: "/setup", icon: Settings, module: "setup" },
  { label: "হেল্প সেন্টার", path: "/help", icon: HelpCircle, module: null },
];

export const diagnosticCenterMenu = [
  { label: "প্রধান পাতা", path: "/", icon: Home, module: null },
  { label: "নতুন ইনভয়েস", path: "/outdoor/invoice/new", icon: ReceiptText, module: "invoice" },
  { label: "ডেইলি রিপোর্টস", path: "/daily-reports", icon: CalendarClock, module: "dailyReport" },
  { label: "ইনভয়েস মাস্টার", path: "/invoice-master", icon: FolderKanban, module: "invoice" },
  { label: "খরচ ও ব্যয়", path: "/expense", icon: Wallet, module: "expense" },
  { label: "টেস্ট রিপোর্টস", path: "/report", icon: ClipboardList, module: "testReport" },
  { label: "আমার এক্টিভিটি", path: "/my-activity", icon: Activity, module: null },
  { label: "মাসিক বিলিং", path: "/billing", icon: CreditCard, module: "billing" },
  { label: "অ্যাকাউন্ট", path: "/account", icon: UserCircle, module: null },
  { label: "সেটআপ", path: "/setup", icon: Settings, module: "setup" },
  { label: "হেল্প সেন্টার", path: "/help", icon: HelpCircle, module: null },
];

// Plain helper (not a hook) — picks the right array by lab.type, then
// filters to items the current user actually has module access to. Same
// admin-bypass + `modules.includes` rule as RequireModules in App.jsx.
export const getMenuForLabType = (labType, user) => {
  const menu = labType === "hospital" ? hospitalMenu : diagnosticCenterMenu;
  const isAdmin = user?.role === "admin";

  return menu.filter((item) => item.module === null || isAdmin || user?.modules?.includes(item.module));
};
