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
        bottom-[calc(env(safe-area-inset-bottom,0px)+12px)]
        h-[68px] min-w-[152px] rounded-[30px] border
        px-4 flex items-center justify-center gap-2.5 text-white cursor-pointer font-[inherit]
        [WebkitTapHighlightColor:transparent]
        transition-[transform,box-shadow,background,border-color] duration-200 ease-out
        ${pressed ? "scale-[0.985] shadow-[0_6px_18px_rgba(15,23,42,0.24)]" : "scale-100 shadow-[0_12px_30px_rgba(15,23,42,0.32)]"}
        ${disabled ? "bg-tertiary/70 opacity-55 cursor-not-allowed border-transparent shadow-none" : "border-white/15 bg-[linear-gradient(180deg,#2F3D56_0%,#1A2638_100%)]"}
        ${active && !disabled ? "ring-2 ring-white/65 ring-offset-2 ring-offset-page" : ""}
      `}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/18 bg-white/10">{icon}</span>
      <span className="text-[13px] font-semibold tracking-[-0.01em] leading-[1.1] whitespace-pre-line text-left">
        {label}
      </span>
    </button>
  );
}
