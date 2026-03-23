"use client";

import { useToast, type Toast } from "@/lib/hooks/useToast";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
} as const;

const styleMap = {
  success: "bg-success/10 border-success/30 text-success",
  error: "bg-error/10 border-error/30 text-error",
  info: "bg-primary/10 border-primary/30 text-primary",
} as const;

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto z-50 flex flex-col space-y-2 max-w-sm md:ml-auto">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast: Toast) => {
          const Icon = iconMap[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.2 }}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg ${styleMap[toast.type]}`}
            >
              <Icon className="shrink-0" size={18} />
              <span className="flex-1 text-sm">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Close toast"
              >
                <X size={16} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
