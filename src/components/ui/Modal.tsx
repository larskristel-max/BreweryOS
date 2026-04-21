import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  open: boolean;
  onDismiss: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function Modal({ open, onDismiss, title, children, actions }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onDismiss}
          className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-black/40"
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.88, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface rounded-card w-full max-w-[340px] overflow-hidden shadow-card"
          >
            <div className="p-5 pb-4">
              <h2 className="text-headline font-semibold text-primary m-0 mb-2 text-center">
                {title}
              </h2>
              <div className="text-subhead text-secondary leading-relaxed text-center">
                {children}
              </div>
            </div>
            {actions && (
              <div className="border-t border-hairline flex">{actions}</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
