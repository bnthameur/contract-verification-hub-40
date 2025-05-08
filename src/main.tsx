
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Error handling for fetching static assets
const handleFetchError = (event: Event) => {
  // Only log errors that aren't about the HMR WebSocket connection
  if (event instanceof ErrorEvent && !event.message.includes('WebSocket')) {
    console.error('Resource loading error:', event.message);
  }
};

window.addEventListener('error', handleFetchError);

createRoot(document.getElementById("root")!).render(<App />);
