import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "./store/authStore";

import LabPilotLogin from "./pages/login";
import Layout from "./components/layout";
import Home from "./pages/home";
import Setup from "./pages/setup";
import ManageReferrers from "./pages/setup/manageReferrers";
import ManageStaffs from "./pages/setup/manageStaffs";
import ManageTests from "./pages/setup/manageTests";
import AddTest from "./pages/setup/manageTests/AddTest";
import Report from "./pages/report";
import ReportUpload from "./pages/reportUpload";
import ReportDownload from "./pages/reportDownload";
import Help from "./pages/help";
import Account from "./pages/account";
import Billing from "./pages/billing";
import Products from "./pages/setup/manageProducts";
import Doctors from "./pages/doctors";
import ManageSpaces from "./pages/setup/manageAdmissionSpace";

// Daily Reports
import DailyReports from "./pages/dailyReports";
import CashMemo from "./pages/dailyReports/cashmemo";
import SalesReport from "./pages/dailyReports/salesReport";
import CommissionReport from "./pages/dailyReports/commissionReport";
import CollectionReport from "./pages/dailyReports/collectionReport";

// Outdoor Patient
import OutdoorPatientHub from "./pages/outdoorPatient";
import CreateInvoice from "./pages/outdoorPatient/createInvoice";
import SearchInvoice from "./pages/outdoorPatient/searchInvoice";
import InvoiceList from "./pages/outdoorPatient/invoices";
import DeleteInvoices from "./pages/outdoorPatient/deleteInvoice";
import PrintInvoice from "./pages/outdoorPatient/createInvoice/PrintInvoice";

// Indoor Patient
import IndoorPatientHub from "./pages/indoorPatient/index";
import AdmitPatient from "./pages/indoorPatient/AdmitPatient";
import SearchPatient from "./pages/indoorPatient/SearchPatient";
import PatientList from "./pages/indoorPatient/PatientList";
import PatientDetails from "./pages/indoorPatient/PatientDetails";
import AddItemsToPatient from "./pages/indoorPatient/AddItemsToPatient";

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

        {/* Daily Reports */}
        <Route path="/daily-reports" element={<DailyReports />} />
        <Route path="/cashmemo" element={<CashMemo />} />
        <Route path="/sales-report" element={<SalesReport />} />
        <Route path="/commission-report" element={<CommissionReport />} />
        <Route path="/collection-report" element={<CollectionReport />} />

        {/* Outdoor Patient */}
        <Route path="/outdoor" element={<OutdoorPatientHub />} />
        <Route path="/outdoor/search-invoice" element={<SearchInvoice />} />
        <Route path="/outdoor/invoice/new" element={<CreateInvoice />} />
        <Route path="/outdoor/invoice/print/:invoiceId" element={<PrintInvoice />} />
        <Route path="/outdoor/invoice/all" element={<InvoiceList />} />
        <Route path="/outdoor/invoice/delete" element={<DeleteInvoices />} />

        {/* Indoor Patient */}
        <Route path="/ipd-master" element={<IndoorPatientHub />} />
        <Route path="/ipd/admit" element={<AdmitPatient />} />
        <Route path="/ipd/search" element={<SearchPatient />} />
        <Route path="/ipd/patients" element={<PatientList />} />
        <Route path="/ipd/patient/:id" element={<PatientDetails />} />
        <Route path="/ipd/add-items" element={<AddItemsToPatient />} />

        {/* Pathological Report */}
        <Route path="/report" element={<Report />} />
        <Route path="/report-upload" element={<ReportUpload />} />
        <Route path="/report-download" element={<ReportDownload />} />

        <Route path="/doctors" element={<Doctors />} />
        <Route path="/account" element={<Account />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/manage-referrers" element={<ManageReferrers />} />
        <Route path="/manage-staffs" element={<ManageStaffs />} />
        <Route path="/manage-tests" element={<ManageTests />} />
        <Route path="/manage-spaces" element={<ManageSpaces />} />
        <Route path="/manage-products" element={<Products />} />
        <Route path="/test/add" element={<AddTest />} />
      </Route>
      {/* Catch-all: Redirect unknown URLs to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
