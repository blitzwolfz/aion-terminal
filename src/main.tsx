import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import './styles/bauhaus.css';

function showStartupError(message: string) {
  const root = document.getElementById('root');
  if (!root) {
    return;
  }

  root.innerHTML = `
    <div style="
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 16px;
      box-sizing: border-box;
      background: #111827;
      color: #f9fafb;
      font-family: monospace;
      white-space: pre-wrap;
      overflow: auto;
    ">
      <h2 style="margin: 0 0 12px; color: #ef4444;">Aion Startup Error</h2>
      <div>${message}</div>
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

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  showStartupError(message);
}
