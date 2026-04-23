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
        bottom-[calc(env(safe-area-inset-bottom,0px)+32px)]
        w-16 h-16 rounded-full border border-white/15
        px-1.5 flex flex-col items-center justify-center gap-0.5 text-white cursor-pointer font-[inherit]
        [WebkitTapHighlightColor:transparent]
        transition-[transform,box-shadow,background] duration-150 ease-out
        ${pressed ? "scale-[0.97] shadow-[var(--shadow-fab-press)]" : "scale-100 shadow-[var(--shadow-fab)]"}
        ${disabled ? "bg-tertiary opacity-50 cursor-not-allowed shadow-none border-transparent" : "bg-amber bg-[linear-gradient(180deg,#253044_0%,#111827_100%)]"}
        ${active && !disabled ? "ring-2 ring-white/45 ring-offset-2 ring-offset-page" : ""}
      `}
    >
      <span className="flex items-center justify-center">{icon}</span>
      <span className="text-[9px] font-semibold tracking-[-0.01em] leading-[1.04] whitespace-pre-line text-center">{label}</span>
    </button>
  );
}
