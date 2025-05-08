
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Enhanced error handling for both static assets and API requests
const handleError = (event: Event | ErrorEvent | PromiseRejectionEvent) => {
  // Skip HMR WebSocket connection errors
  if (event instanceof ErrorEvent && event.message.includes('WebSocket')) {
    return;
  }
  
  // Handle resource loading errors
  if (event instanceof ErrorEvent) {
    console.error('Resource loading error:', event.message);
  }
  
  // Handle unhandled promise rejections (API errors etc.)
  if (event instanceof PromiseRejectionEvent) {
    const error = event.reason;
    console.error('Unhandled Promise Rejection:', error);
    
    // Log API errors more verbosely
    if (error?.message?.includes('API request failed')) {
      console.error('API Error Details:', error);
    }
  }
};

// Add event listeners for different types of errors
window.addEventListener('error', handleError);
window.addEventListener('unhandledrejection', handleError);

createRoot(document.getElementById("root")!).render(<App />);
