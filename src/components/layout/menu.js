import {
  Home,
  Receipt,
  FilePlus,
  Upload,
  List,
  Trash2,
  DollarSign,
  CreditCard,
  FlaskConical,
  HelpCircle,
  Search,
  File,
} from "lucide-react";

const menu = [
  { label: "Home", path: "/", icon: Home },
  { label: "Cashmemo", path: "/cashmemo", icon: Receipt },
  { label: "New Invoice", path: "/invoice/new", icon: FilePlus },
  { label: "Delete Invoice", path: "/invoice/delete", icon: Trash2 },
  { label: "Invoice List", path: "/invoice/all", icon: List },
  { label: "Reports", path: "/report", icon: File },
  { label: "Commission", path: "/commission", icon: DollarSign },
  { label: "Billing", path: "/billing", icon: CreditCard },
  { label: "Lab Management", path: "/lab-management", icon: FlaskConical },
  { label: "Support", path: "/support", icon: HelpCircle },
];

export default menu;
