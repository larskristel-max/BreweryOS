interface DividerProps {
  /** When true, applies standard iOS-style list inset (left-aligned content indentation). */
  inset?: boolean;
}

export function Divider({ inset = false }: DividerProps) {
  return (
    <div className={`h-px bg-hairline ${inset ? "ml-14" : ""}`} />
  );
}
