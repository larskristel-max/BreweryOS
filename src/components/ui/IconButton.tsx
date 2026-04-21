import { ReactNode } from "react";

type IconButtonVariant = "primary" | "secondary" | "ghost";

interface IconButtonProps {
  icon: ReactNode;
  variant?: IconButtonVariant;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  primary:   "bg-amber text-white",
  secondary: "bg-amber-tint text-amber",
  ghost:     "bg-transparent text-amber",
};

export function IconButton({ icon, variant = "secondary", label, onClick, disabled = false }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`
        interactive w-11 h-11 rounded-full border-0 flex items-center justify-center
        cursor-pointer shrink-0 font-[inherit]
        [WebkitTapHighlightColor:transparent]
        ${disabled ? "opacity-40 cursor-not-allowed" : ""}
        ${VARIANT_CLASSES[variant]}
      `}
    >
      {icon}
    </button>
  );
}
