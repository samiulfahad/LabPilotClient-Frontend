import { Routes, Route } from "react-router-dom";

import Layout from "./components/layout";
import Home from "./pages/home";
import LabManagement from "./pages/labManagement";
import ManageReferrer from "./pages/labManagement/manageReferrer";
import ManageStaff from "./pages/labManagement/manageStaff";
import ManageLabTest from "./pages/labManagement/manageLabTest";
import AddLabTest from "./pages/labManagement/manageLabTest/AddLabTest";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/labManagement" element={<LabManagement />} />
        <Route path="/manage-referrers" element={<ManageReferrer />} />
        <Route path="/manage-staffs" element={<ManageStaff />} />
        <Route path="/manage-testList" element={<ManageLabTest />} />
        <Route path="/labTest/add" element={<AddLabTest />} />
      </Routes>
    </Layout>
  );
}

export default App;
