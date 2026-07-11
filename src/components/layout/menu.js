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

export const hospitalMenu = [
  { label: "প্রধান পাতা", path: "/", icon: Home },
  { label: "নতুন ইনভয়েস", path: "/outdoor/invoice/new", icon: ReceiptText },
  { label: "ডেইলি রিপোর্টস", path: "/daily-reports", icon: CalendarClock },
  { label: "আউটডোর রোগী", path: "/outdoor/", icon: Stethoscope },
  { label: "ইনডোর রোগী", path: "/ipd-master", icon: BedDouble },
  { label: "খরচ ও ব্যয়", path: "/expense", icon: Wallet },
  { label: "টেস্ট রিপোর্টস", path: "/report", icon: ClipboardList },
  { label: "আমার এক্টিভিটি", path: "/my-activity", icon: Activity },
  { label: "মাসিক বিলিং", path: "/billing", icon: CreditCard },
  { label: "অ্যাকাউন্ট", path: "/account", icon: UserCircle },
  { label: "সেটআপ", path: "/setup", icon: Settings },
  { label: "সাহায্য", path: "/help", icon: HelpCircle },
];

export const diagnosticCenterMenu = [
  { label: "প্রধান পাতা", path: "/", icon: Home },
  { label: "নতুন ইনভয়েস", path: "/outdoor/invoice/new", icon: ReceiptText },
  { label: "ডেইলি রিপোর্টস", path: "/daily-reports", icon: CalendarClock },
  { label: "ইনভয়েস মাস্টার", path: "/invoice-master", icon: FolderKanban },
  { label: "খরচ ও ব্যয়", path: "/expense", icon: Wallet },
  { label: "টেস্ট রিপোর্টস", path: "/report", icon: ClipboardList },
  { label: "আমার এক্টিভিটি", path: "/my-activity", icon: Activity },
  { label: "মাসিক বিলিং", path: "/billing", icon: CreditCard },
  { label: "অ্যাকাউন্ট", path: "/account", icon: UserCircle },
  { label: "সেটআপ", path: "/setup", icon: Settings },
  { label: "সাহায্য", path: "/help", icon: HelpCircle },
];

// Plain helper (not a hook) — picks the right array by lab.type.
export const getMenuForLabType = (labType) => (labType === "hospital" ? hospitalMenu : diagnosticCenterMenu);
