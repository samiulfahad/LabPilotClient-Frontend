import { Routes, Route } from "react-router-dom";

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
import Reports from "./pages/reports";
import UploadReport from "./pages/uploadReport";
import ReportViewer from "./pages/reportViewer";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/invoice/new" element={<CreateInvoice />} />
        <Route path="/invoice/print/:invoiceId" element={<PrintInvoice />} />
        <Route path="/invoice/all" element={<InvoiceList />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/view-report" element={<ReportViewer />} />
        <Route path="/report-upload" element={<UploadReport />} />
        <Route path="/lab-management" element={<LabManagement />} />
        <Route path="/manage-referrers" element={<ManageReferrers />} />
        <Route path="/manage-staffs" element={<ManageStaffs />} />
        <Route path="/manage-tests" element={<ManageTests />} />
        <Route path="/test/add" element={<AddTest />} />
      </Routes>
    </Layout>
  );
}

export default App;