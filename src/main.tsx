import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import './styles/bauhaus.css';

function showStartupError(message: string) {
  const root = document.getElementById('root');
  if (!root) return;

  root.innerHTML = `
    <div style="
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 24px;
      box-sizing: border-box;
      background: #F5F0E8;
      color: #1A1A1A;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 13px;
      white-space: pre-wrap;
      overflow: auto;
    ">
      <h2 style="margin: 0 0 12px; color: #DC2626; font-family: Syne, sans-serif; text-transform: uppercase; letter-spacing: 0.1em;">Aion Startup Error</h2>
      <div style="padding: 12px; border: 2px solid #DC2626; background: #FEE2E2;">${message}</div>
    </div>
  `;
}

window.addEventListener('error', (event) => {
  const message = event.error instanceof Error ? event.error.stack ?? event.error.message : String(event.message);
  showStartupError(message);
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message = reason instanceof Error ? reason.stack ?? reason.message : String(reason);
  showStartupError(`Unhandled Promise Rejection:\n${message}`);
});

try {
  const root = document.getElementById('root');
  if (!root) {
    throw new Error('Root element not found');
  }

  ReactDOM.createRoot(root).render(<App />);
} catch (error) {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  showStartupError(message);
}
