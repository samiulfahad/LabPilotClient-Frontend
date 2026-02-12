import { Routes, Route } from "react-router-dom";

import Layout from "./components/layout";
import Home from "./pages/home";
import LabManagement from "./pages/labManagement";
import ManageReferrers from "./pages/labManagement/manageReferrers";
import ManageStaffs from "./pages/labManagement/manageStaffs";
import ManageTests from "./pages/labManagement/manageTests";
import AddTest from "./pages/labManagement/manageTests/AddTest";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/labManagement" element={<LabManagement />} />
        <Route path="/manage-referrers" element={<ManageReferrers />} />
        <Route path="/manage-staffs" element={<ManageStaffs />} />
        <Route path="/manage-testList" element={<ManageTests />} />
        <Route path="/test/add" element={<AddTest />} />
      </Routes>
    </Layout>
  );
}

export default App;
