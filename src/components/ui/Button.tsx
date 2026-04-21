import { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  size?: "default" | "sm";
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:   "bg-amber text-white",
  secondary: "bg-amber-tint text-amber",
  ghost:     "bg-transparent text-amber",
};

export function Button({
  children,
  variant = "primary",
  fullWidth = true,
  disabled = false,
  onClick,
  type = "button",
  size = "default",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        interactive inline-flex items-center justify-center gap-2
        rounded-button border-0 font-semibold font-[inherit] cursor-pointer
        text-headline tracking-[-0.01em]
        [WebkitTapHighlightColor:transparent]
        ${fullWidth ? "w-full" : ""}
        ${size === "sm" ? "min-h-[44px] px-4 py-2" : "min-h-[44px] px-5 py-3"}
        ${disabled ? "opacity-40 cursor-not-allowed" : ""}
        ${VARIANT_CLASSES[variant]}
      `}
    >
      {children}
    </button>
  );
}
