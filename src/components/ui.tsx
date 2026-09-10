import Link from "next/link";
import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-(--border) bg-(--surface) p-5 sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-xs font-medium uppercase tracking-widest text-(--muted-2) mb-3">
      {children}
    </div>
  );
}

export type StatusColor = "green" | "yellow" | "red" | "blue" | "neutral";

const statusStyles: Record<StatusColor, string> = {
  green: "bg-(--green-dim) text-(--green) border-(--green)/30",
  yellow: "bg-(--yellow-dim) text-(--yellow) border-(--yellow)/30",
  red: "bg-(--red-dim) text-(--red) border-(--red)/30",
  blue: "bg-(--blue-dim) text-(--blue) border-(--blue)/30",
  neutral: "bg-(--surface-raised) text-(--muted) border-(--border)",
};

export function Badge({
  children,
  color = "neutral",
  className = "",
}: {
  children: ReactNode;
  color?: StatusColor;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase ${statusStyles[color]} ${className}`}
    >
      {children}
    </span>
  );
}

export function verdictColor(verdict: "GREEN" | "YELLOW" | "RED"): StatusColor {
  if (verdict === "GREEN") return "green";
  if (verdict === "YELLOW") return "yellow";
  return "red";
}

export function StatCard({
  label,
  value,
  sub,
  color = "neutral",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  color?: StatusColor;
}) {
  const valueColorClass: Record<StatusColor, string> = {
    green: "text-(--green)",
    yellow: "text-(--yellow)",
    red: "text-(--red)",
    blue: "text-(--blue)",
    neutral: "text-(--foreground)",
  };
  return (
    <div className="rounded-lg border border-(--border) bg-(--surface) p-4 sm:p-5">
      <div className="text-xs uppercase tracking-widest text-(--muted-2) mb-2">{label}</div>
      <div className={`font-mono-num text-2xl sm:text-3xl font-semibold ${valueColorClass[color]}`}>
        {value}
      </div>
      {sub ? <div className="mt-1 text-xs text-(--muted)">{sub}</div> : null}
    </div>
  );
}

export function PrimaryButton({
  href,
  onClick,
  children,
  type = "button",
  disabled,
  className = "",
}: {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const classes = `inline-flex items-center justify-center rounded-md bg-(--foreground) text-(--background) px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed ${className}`;
  if (href && !disabled) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}

export function SecondaryButton({
  href,
  onClick,
  children,
  type = "button",
  className = "",
}: {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  type?: "button" | "submit";
  className?: string;
}) {
  const classes = `inline-flex items-center justify-center rounded-md border border-(--border) bg-transparent text-(--foreground) px-5 py-2.5 text-sm font-medium transition-colors hover:bg-(--surface-raised) ${className}`;
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}

export function ProgressSteps({
  steps,
  currentIndex,
}: {
  steps: string[];
  currentIndex: number;
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-4 mb-8 overflow-x-auto">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                i < currentIndex
                  ? "bg-(--green) text-black"
                  : i === currentIndex
                    ? "bg-(--foreground) text-(--background)"
                    : "border border-(--border) text-(--muted-2)"
              }`}
            >
              {i < currentIndex ? "✓" : i + 1}
            </div>
            <span
              className={`text-sm whitespace-nowrap ${
                i === currentIndex ? "text-(--foreground) font-medium" : "text-(--muted)"
              }`}
            >
              {step}
            </span>
          </div>
          {i < steps.length - 1 ? <div className="h-px w-6 sm:w-10 bg-(--border)" /> : null}
        </div>
      ))}
    </div>
  );
}

export function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-(--foreground) mb-1.5">
        {label}
        {required ? <span className="text-(--red)"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="block mt-1 text-xs text-(--muted)">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-(--border) bg-(--surface-raised) px-3 py-2 text-sm text-(--foreground) placeholder:text-(--muted-2) focus:outline-none focus:ring-1 focus:ring-(--foreground)/40";
