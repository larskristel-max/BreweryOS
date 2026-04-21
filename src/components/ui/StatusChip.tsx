type ChipVariant = "success" | "warning" | "danger" | "info" | "neutral";

interface StatusChipProps {
  variant: ChipVariant;
  label: string;
}

const VARIANT_CLASSES: Record<ChipVariant, string> = {
  success: "bg-success-tint text-success-text",
  warning: "bg-warning-tint text-warning-text",
  danger:  "bg-danger-tint  text-danger-text",
  info:    "bg-info-tint    text-info-text",
  neutral: "bg-neutral-tint text-secondary",
};

export function StatusChip({ variant, label }: StatusChipProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-pill px-2 py-[3px]
        text-caption font-medium leading-[1.4] tracking-[0.01em] whitespace-nowrap
        ${VARIANT_CLASSES[variant]}
      `}
    >
      {label}
    </span>
  );
}
