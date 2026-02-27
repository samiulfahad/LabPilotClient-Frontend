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
} from "lucide-react";

const menu = [
  { label: "Home", path: "/", icon: Home },
  { label: "Cash Memo", path: "/cashmemo", icon: Receipt },
  { label: "New Invoice", path: "/invoice/new", icon: FilePlus },
  { label: "Upload Report", path: "/upload-report", icon: Upload },
  { label: "Invoice List", path: "/invoice/all", icon: List },
  { label: "Delete Invoice", path: "/deleteInvoice", icon: Trash2 },
  { label: "Commission", path: "/commission", icon: DollarSign },
  { label: "Billing", path: "/billing", icon: CreditCard },
  { label: "Lab Management", path: "/lab-management", icon: FlaskConical },
  { label: "Support", path: "/support", icon: HelpCircle },
];

export default menu;
