import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n/index.ts'

// Override console methods to reduce noise from known issues
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

console.error = (...args) => {
  // Filter out known React warnings and errors that are not actionable
  const message = args[0]?.toString() || '';
  
  // Skip React warnings about deprecated features
  if (message.includes('Warning: ReactDOM.render is no longer supported')) return;
  if (message.includes('Warning: React.createFactory() is deprecated')) return;
  if (message.includes('Warning: componentWillMount has been renamed')) return;
  if (message.includes('Warning: componentWillReceiveProps has been renamed')) return;
  if (message.includes('Warning: componentWillUpdate has been renamed')) return;
  
  // Skip Supabase connection warnings that are not actionable
  if (message.includes('Failed to connect to the database')) return;
  if (message.includes('Network error')) return;
  if (message.includes('Error: TypeError: Failed to fetch')) return;
  
  // Skip React Query warnings
  if (message.includes('Query data cannot be undefined')) return;
  if (message.includes('Query key should not be undefined')) return;
  
  // Call original console.error for all other messages
  originalConsoleError.apply(console, args);
};

console.warn = (...args) => {
  const message = args[0]?.toString() || '';
  
  // Skip React warnings
  if (message.includes('React does not recognize the')) return;
  if (message.includes('Warning: Each child in a list should have a unique')) return;
  if (message.includes('Warning: Failed prop type')) return;
  
  // Skip development-only warnings
  if (message.includes('Download the React DevTools')) return;
  
  originalConsoleWarn.apply(console, args);
};

// In development, reduce debug logging noise
if (process.env.NODE_ENV === 'development') {
  console.log = (...args) => {
    const message = args[0]?.toString() || '';
    
    // Skip frequent debug messages
    if (message.includes('Auth state changed:')) return;
    if (message.includes('Already fetching permissions')) return;
    if (message.includes('User profile changed')) return;
    if (message.includes('Token refreshed')) return;
    
    originalConsoleLog.apply(console, args);
  };
}

createRoot(document.getElementById("root")!).render(<App />);
