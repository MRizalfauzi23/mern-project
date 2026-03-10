import { createContext, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);
const TOAST_DURATION = 2600;
const TOAST_EXIT = 240;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const api = useMemo(
    () => ({
      showToast(message, type = "success") {
        const id = `${Date.now()}-${Math.random()}`;
        setToasts((prev) => [...prev, { id, message, type, leaving: false }]);
        const leaveDelay = Math.max(0, TOAST_DURATION - TOAST_EXIT);
        setTimeout(() => {
          setToasts((prev) =>
            prev.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast))
          );
        }, leaveDelay);
        setTimeout(() => {
          setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, TOAST_DURATION);
      }
    }),
    []
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-wrap">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast ${toast.type} ${toast.leaving ? "toast-leave" : ""}`}
          >
            <span className="toast-message">{toast.message}</span>
            <span className="toast-progress" aria-hidden="true" />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
