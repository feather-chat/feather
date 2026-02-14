import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { setApiBase } from '@feather/api-client';
import './index.css';
import App from './App.tsx';

const apiBase = import.meta.env.VITE_API_BASE;
if (apiBase) {
  setApiBase(apiBase);
}

// Suppress the browser's native context menu app-wide
document.addEventListener('contextmenu', (e) => e.preventDefault());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
