import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BottomSheetProps {
  open: boolean;
  onDismiss: () => void;
  children: ReactNode;
  title?: string;
}

export function BottomSheet({ open, onDismiss, children, title }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onDismiss}
            className="fixed inset-0 z-[1100] bg-black/40"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onDismiss();
            }}
            className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-[24px] z-[1200]
                       max-h-[90dvh] overflow-y-auto
                       pb-[env(safe-area-inset-bottom,16px)]"
          >
            <div className={`flex justify-center ${title ? "pt-2.5 pb-1.5" : "py-2.5"}`}>
              <div className="w-9 h-[5px] rounded-pill bg-neutral-tint" />
            </div>

            {title && (
              <div className="px-4 pb-3.5 border-b border-hairline text-headline font-semibold text-primary text-center">
                {title}
              </div>
            )}

            <div className="p-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
