import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Import emergency egress system to make it available in browser console
import './utils/emergencyEgressStop'

createRoot(document.getElementById("root")!).render(<App />);
