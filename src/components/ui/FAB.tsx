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
        bottom-[calc(env(safe-area-inset-bottom,0px)+76px)]
        min-w-[186px] h-14 rounded-pill border border-amber/35
        px-4 flex items-center justify-center gap-2.5 text-white cursor-pointer font-[inherit]
        [WebkitTapHighlightColor:transparent]
        transition-[transform,box-shadow,background] duration-150 ease-out
        ${pressed ? "scale-[0.97] shadow-[var(--shadow-fab-press)]" : "scale-100 shadow-[var(--shadow-fab)]"}
        ${disabled ? "bg-tertiary opacity-50 cursor-not-allowed shadow-none border-transparent" : "bg-amber"}
        ${active && !disabled ? "ring-2 ring-amber/30 ring-offset-2 ring-offset-page" : ""}
      `}
    >
      <span className="flex items-center justify-center">{icon}</span>
      <span className="text-[15px] font-semibold tracking-[0.01em]">{label}</span>
      {!disabled && <span className="w-1.5 h-1.5 rounded-full bg-white/90" aria-hidden="true" />}
    </button>
  );
}
