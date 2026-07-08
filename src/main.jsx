import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";

// Latin UI text
import "@fontsource/dm-sans/400.css";

// Bengali UI text
import "@fontsource/noto-sans-bengali/400.css";
import "@fontsource/anek-bangla/600.css"; // menu labels only

// Monospace (data/numbers)
import "@fontsource/jetbrains-mono/400.css";

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <Router>
    <App />
  </Router>,
  // </StrictMode>,
);
