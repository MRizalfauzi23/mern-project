"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useMemo, useState } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
  leaving: boolean;
};

type ToastApi = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastApi | null>(null);
const TOAST_DURATION = 2600;
const TOAST_EXIT = 240;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const api = useMemo(
    () => ({
      showToast(message, type: ToastType = "success") {
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
