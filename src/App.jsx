import { Routes, Route, Navigate } from "react-router-dom";
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

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) return <LabPilotLogin />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cashmemo" element={<CashMemo />} />
        <Route path="/commission" element={<Commission />} />
        <Route path="/invoice/new" element={<CreateInvoice />} />
        <Route path="/invoice/print/:invoiceId" element={<PrintInvoice />} />
        <Route path="/invoice/all" element={<InvoiceList />} />
        <Route path="/invoice/delete" element={<DeleteInvoices />} />
        <Route path="/report" element={<Report />} />
        <Route path="/report-upload" element={<ReportUpload />} />
        <Route path="/report-download" element={<ReportDownload />} />
        <Route path="/lab-management" element={<LabManagement />} />
        <Route path="/manage-referrers" element={<ManageReferrers />} />
        <Route path="/manage-staffs" element={<ManageStaffs />} />
        <Route path="/manage-tests" element={<ManageTests />} />
        <Route path="/test/add" element={<AddTest />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
