import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "./store/authStore";

import LabPilotLogin from "./pages/login";
import Layout from "./components/layout";
import Home from "./pages/home";
import LabManagement from "./pages/labManagement";
import ManageReferrers from "./pages/labManagement/manageReferrers";
import ManageStaffs from "./pages/labManagement/manageStaffs";
import ManageTests from "./pages/labManagement/manageTests";
import AddTest from "./pages/labManagement/manageTests/AddTest";
import CreateInvoice from "./pages/createInvoice";
import PrintInvoice from "./pages/createInvoice/PrintInvoice";
import InvoiceList from "./pages/invoices";
import Report from "./pages/report";
import ReportUpload from "./pages/reportUpload";
import ReportDownload from "./pages/reportDownload";
import DeleteInvoices from "./pages/deleteInvoice";
import CashMemo from "./pages/cashmemo";
import Commission from "./pages/commission";
import Help from "./pages/help";
import Transactions from "./pages/transactions";
import Account from "./pages/account";
import SearchInvoice from "./pages/search";
import Billing from "./pages/billing";
import InvoiceMaster from "./pages/invoiceMaster";
import Products from "./pages/labManagement/manageProducts";
import Doctors from "./pages/doctors";
import IndoorPatient from "./pages/indoorPatient";

// ─── Route Wrapper for Protected Pages ──────────────────────────────────────
const ProtectedRoutes = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // If not logged in, kick them to the login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  // If logged in, show the Layout (Sidebar/Navbar) and the requested page
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

// ─── Main App Component ─────────────────────────────────────────────────────
function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <Routes>
      {/* ════ PUBLIC ROUTES (No login required) ════ */}
      {/* If they are already logged in, don't show them the login page again */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LabPilotLogin />} />
      {/* Help is now public and accessible without logging in */}
      <Route path="/help" element={<Help />} />

      {/* ════ PROTECTED ROUTES (Login required) ════ */}
      <Route element={<ProtectedRoutes />}>
        <Route path="/" element={<Home />} />
        <Route path="/cashmemo" element={<CashMemo />} />
        <Route path="/invoice-master" element={<InvoiceMaster />} />
        <Route path="/search-invoice" element={<SearchInvoice />} />
        <Route path="/commission" element={<Commission />} />
        <Route path="/invoice/new" element={<CreateInvoice />} />
        <Route path="/invoice/print/:invoiceId" element={<PrintInvoice />} />
        <Route path="/invoice/all" element={<InvoiceList />} />
        <Route path="/invoice/delete" element={<DeleteInvoices />} />
        <Route path="/report" element={<Report />} />
        <Route path="/report-upload" element={<ReportUpload />} />
        <Route path="/report-download" element={<ReportDownload />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/indoor-patients" element={<IndoorPatient />} />
        <Route path="/account" element={<Account />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/lab-management" element={<LabManagement />} />
        <Route path="/manage-referrers" element={<ManageReferrers />} />
        <Route path="/manage-staffs" element={<ManageStaffs />} />
        <Route path="/manage-tests" element={<ManageTests />} />
        <Route path="/manage-products" element={<Products />} />
        <Route path="/test/add" element={<AddTest />} />
      </Route>
      {/* Catch-all: Redirect unknown URLs to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
