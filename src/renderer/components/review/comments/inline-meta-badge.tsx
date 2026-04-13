import { cn } from "@/lib/utils";

export function InlineMetaBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-mono text-[10px] leading-none",
        className,
      )}
    >
      {children}
    </span>
  );
}
