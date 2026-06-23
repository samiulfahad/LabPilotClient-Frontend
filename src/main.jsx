import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";

// Load DM Sans (Weights: 400, 500, 600)
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";

// Load DM Mono (Weights: 400, 500)
import "@fontsource/dm-mono/400.css";
import "@fontsource/dm-mono/500.css";

import '@fontsource/outfit/300.css';
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';
import '@fontsource/outfit/800.css';

import '@fontsource/jetbrains-mono/300.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';

// Import Anek Bangla font styles
import "@fontsource/anek-bangla/400.css"; // Regular
import "@fontsource/anek-bangla/500.css"; // Medium
import "@fontsource/anek-bangla/600.css"; // Semi-Bold

// NEW Noto Sans Bengali imports (Body content)
import "@fontsource/noto-sans-bengali/400.css"; // Regular
import "@fontsource/noto-sans-bengali/500.css"; // Medium
import "@fontsource/noto-sans-bengali/600.css"; // Semi-Bold
import "@fontsource/noto-sans-bengali/700.css"; // Bold

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <Router>
    <App />
  </Router>,
  // </StrictMode>,
);
