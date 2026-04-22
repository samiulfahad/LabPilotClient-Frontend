import {
  Home,
  Receipt,
  FilePlus,
  Trash2,
  LayoutList,
  FileText,
  ArrowLeftRight,
  Percent,
  CreditCard,
  UserCircle,
  FlaskConical,
  HelpCircle,
  Search
} from "lucide-react";



const menu = [
  { label: "Home", path: "/", icon: Home },
  { label: "Cashmemo", path: "/cashmemo", icon: Receipt },
  { label: "Invoice Master", path: "/invoice-master", icon: Receipt },
  { label: "New Invoice", path: "/invoice/new", icon: FilePlus },
  { label: "Reports", path: "/report", icon: FileText },
  { label: "Transactions", path: "/transactions", icon: ArrowLeftRight },
  { label: "Commission", path: "/commission", icon: Percent },
  { label: "Billing", path: "/billing", icon: CreditCard },
  { label: "Account", path: "/account", icon: UserCircle },
  { label: "Lab Management", path: "/lab-management", icon: FlaskConical },
  { label: "Help", path: "/help", icon: HelpCircle },
];

export default menu;
