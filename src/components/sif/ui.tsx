import { cn } from "@/lib/utils";

/** Compact bordered panel — the SIF SENTINEL container primitive. */
export function Panel({
  title,
  sub,
  right,
  className,
  bodyClassName,
  children,
}: {
  title?: React.ReactNode;
  sub?: string;
  right?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-md border border-border bg-card shadow-[0_1px_2px_rgba(15,18,25,0.04)]",
        className,
      )}
    >
      {(title || right) && (
        <header className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-2.5">
          <div className="min-w-0">
            <h2 className="truncate text-[13px] font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            {sub && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{sub}</p>}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </header>
      )}
      <div className={cn("px-4 py-3.5", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Micro all-caps section label with emoji marker. */
export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "font-mono-tech text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

const TONES = {
  critical: "bg-critical text-white",
  attention: "bg-attention text-white",
  watch: "bg-watch text-foreground",
  controlled: "bg-controlled text-white",
  ink: "bg-foreground text-background",
} as const;

/** Small solid chip with level dot — used for status pills. */
export function RiskPill({
  tone,
  children,
  className,
}: {
  tone: keyof typeof TONES;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-semibold tracking-wide",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Solid-colour square used in the site heatmap. */
export function HeatSquare({
  level,
  selected,
  onClick,
  ariaLabel,
}: {
  level: "low" | "medium" | "high";
  selected?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const bg =
    level === "high"
      ? "bg-critical/85 hover:bg-critical"
      : level === "medium"
        ? "bg-attention/75 hover:bg-attention"
        : "bg-controlled/25 hover:bg-controlled/40";
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "h-9 w-full rounded-[3px] transition-all duration-150",
        bg,
        selected && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
      )}
    />
  );
}

/** Live engine status dot. */
export function SignalDot({ tone = "controlled", blink = false }: { tone?: keyof typeof TONES; blink?: boolean }) {
  return (
    <span
      className={cn(
        "inline-block size-1.5 rounded-full",
        TONES[tone].split(" ")[0],
        blink ? "animate-blink-dot" : "animate-pulse-dot",
      )}
    />
  );
}
