import { ReactNode, useState } from "react";

interface FABProps {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  disabledReason?: string;
  active?: boolean;
}

export function FAB({ icon, label, onClick, disabled = false, disabledReason, active = false }: FABProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={disabled ? undefined : onClick}
      aria-label={disabled ? (disabledReason ?? label) : label}
      title={disabled ? disabledReason : undefined}
      disabled={disabled}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className={`
        fixed left-1/2 -translate-x-1/2 z-[1000]
        w-14 h-14 rounded-full border-0
        bottom-[calc(env(safe-area-inset-bottom,0px)+40px)]
        flex items-center justify-center text-white cursor-pointer font-[inherit]
        [WebkitTapHighlightColor:transparent]
        transition-[transform,box-shadow] duration-100 ease-out
        ${pressed ? "scale-[0.93] shadow-[var(--shadow-fab-press)]" : "scale-100 shadow-[var(--shadow-fab)]"}
        ${disabled ? "bg-tertiary opacity-50 cursor-not-allowed shadow-none" : "bg-amber"}
        ${active && !disabled ? "ring-2 ring-amber ring-offset-2 ring-offset-white" : ""}
      `}
    >
      {icon}
    </button>
  );
}
