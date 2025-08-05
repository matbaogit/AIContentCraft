import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./disable-runtime-errors";

// Tệp disable-runtime-errors.js đã có đầy đủ các phương pháp
// xử lý lỗi ResizeObserver bằng một cách mạnh mẽ

// Ngăn chặn hiển thị lỗi ResizeObserver và Facebook SDK trong console
const originalError = window.console.error;
window.console.error = function(...args: any[]) {
  if (
    typeof args[0] === 'string' && (
      args[0].includes('ResizeObserver loop') ||
      args[0].includes('Failed to fetch') ||
      args[0].includes('Facebook') ||
      args[0].includes('connect.facebook.net')
    ) ||
    args[0]?.toString?.().includes('ResizeObserver loop') || 
    args[0]?.message?.includes?.('ResizeObserver loop') ||
    args[0]?.toString?.().includes('Failed to fetch') ||
    args[0]?.toString?.().includes('Facebook') ||
    args[0]?.toString?.().includes('connect.facebook.net')
  ) {
    // Không hiển thị lỗi ResizeObserver và Facebook SDK
    return;
  }
  originalError.apply(window.console, args);
};

// Chặn lỗi tại cấp độ window
window.addEventListener('error', (event) => {
  if (
    event.message?.includes('ResizeObserver loop') || 
    event.error?.message?.includes('ResizeObserver loop') ||
    event.message?.includes('Failed to fetch') ||
    event.message?.includes('Facebook') ||
    event.message?.includes('connect.facebook.net')
  ) {
    event.stopImmediatePropagation();
    event.preventDefault();
    event.stopPropagation();
    return true;
  }
}, true);

// Chặn unhandled rejection cho ResizeObserver và Facebook SDK
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason?.message?.includes('ResizeObserver loop') ||
    event.reason?.toString?.().includes('ResizeObserver loop') ||
    event.reason?.message?.includes('Failed to fetch') ||
    event.reason?.toString?.().includes('Facebook') ||
    event.reason?.toString?.().includes('connect.facebook.net')
  ) {
    event.stopImmediatePropagation();
    event.preventDefault();
    event.stopPropagation();
    return true;
  }
}, true);

createRoot(document.getElementById("root")!).render(<App />);
