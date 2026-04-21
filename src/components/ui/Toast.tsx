import { useCallback, useState, createContext, useContext, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ToastVariant = "success" | "warning" | "danger" | "info";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  show: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: "bg-success-text text-white",
  warning: "bg-warning-text text-white",
  danger:  "bg-danger-text  text-white",
  info:    "bg-info-text    text-white",
};

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = ++counter;
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-[2000]
                   bottom-[calc(env(safe-area-inset-bottom,0px)+90px)]
                   flex flex-col items-center gap-2 pointer-events-none"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className={`
                rounded-pill px-4 py-2.5 text-footnote font-medium whitespace-nowrap
                shadow-card font-[inherit]
                ${VARIANT_CLASSES[toast.variant]}
              `}
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
