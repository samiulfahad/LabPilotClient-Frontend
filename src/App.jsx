import { Routes, Route } from "react-router-dom";

import Layout from "./components/layout";
import Home from "./pages/home";
import LabManagement from "./pages/labManagement";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/labManagement" element={<LabManagement />} />
      </Routes>
    </Layout>
  );
}

export default App;
