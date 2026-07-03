import {
  Home,
  Receipt,
  FilePlus,
  FileArchive,
  Trash2,
  LayoutList,
  FileText,
  ArrowLeftRight,
  Percent,
  CreditCard,
  UserCircle,
  FlaskConical,
  HelpCircle,
  Search,
  HeartPlus,
} from "lucide-react";

const menu = [
  { label: "প্রধান পাতা", path: "/", icon: Home },
  { label: "নতুন ইনভয়েস", path: "/outdoor/invoice/new", icon: FilePlus },
  { label: "ডেইলি রিপোর্টস", path: "/daily-reports", icon: FileArchive },
  { label: "আউটডোর রোগী", path: "/outdoor/", icon: Receipt },
  { label: "ইনডোর রোগী", path: "/ipd-master", icon: HeartPlus },
  { label: "খরচ ও ব্যয়", path: "/expense", icon: HeartPlus },
  { label: "টেস্ট রিপোর্টস", path: "/report", icon: FileText },
  { label: "আমার এক্টিভিটি", path: "/my-activity", icon: FileText },
  { label: "মাসিক বিলিং", path: "/billing", icon: CreditCard },
  { label: "অ্যাকাউন্ট", path: "/account", icon: UserCircle },
  { label: "সেটআপ", path: "/setup", icon: FlaskConical },
  { label: "সাহায্য", path: "/help", icon: HelpCircle },
];

export default menu;
