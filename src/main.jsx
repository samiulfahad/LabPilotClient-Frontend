import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css'
import App from './App.jsx'

// Import Anek Bangla font styles
import '@fontsource/anek-bangla/400.css' // Regular
import '@fontsource/anek-bangla/500.css' // Medium
import '@fontsource/anek-bangla/600.css' // Semi-Bold

// NEW Noto Sans Bengali imports (Body content)
import '@fontsource/noto-sans-bengali/400.css' // Regular
import '@fontsource/noto-sans-bengali/500.css' // Medium
import '@fontsource/noto-sans-bengali/600.css' // Semi-Bold
import '@fontsource/noto-sans-bengali/700.css' // Bold


createRoot(document.getElementById('root')).render(
  // <StrictMode>
    <Router>
      <App />
    </Router>
  // </StrictMode>,
)
