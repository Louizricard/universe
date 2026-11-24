import React from "react";
import { motion } from "motion/react";
import { clsx } from "clsx";
import { MOTION } from "./motion";

export interface TactileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "signal" | "module" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export const TactileButton = React.forwardRef<HTMLButtonElement, TactileButtonProps>(
  ({ variant = "module", size = "md", icon, className, children, disabled, ...rest }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[6px] font-medium select-none cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed transition-[background-color,border-color,color,transform] duration-100 active:scale-[0.98] disabled:active:scale-100";

    const variants: Record<NonNullable<TactileButtonProps["variant"]>, string> = {
      signal:
        "bg-[var(--accent-signal)] text-white hover:bg-[var(--accent-signal-hover)] border border-transparent shadow-xs",
      module:
        "bg-[var(--bg-module)] text-[var(--text-primary)] border border-[var(--border-strong)] hover:bg-[var(--bg-hover)]",
      ghost:
        "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-transparent",
      danger:
        "bg-[var(--status-err)] text-white hover:opacity-90 border border-transparent",
    };

    const sizes: Record<NonNullable<TactileButtonProps["size"]>, string> = {
      sm: "h-7 px-2.5 text-[12px]",
      md: "h-9 px-3.5 text-[13px]",
      lg: "h-10 px-4 text-[14px]",
    };

    return (
      <button
        ref={ref}
        type={rest.type ?? "button"}
        disabled={disabled}
        className={clsx(base, variants[variant], sizes[size], className)}
        {...rest}
      >
        {icon && <span className="inline-flex shrink-0 items-center">{icon}</span>}
        {children}
      </button>
    );
  }
);
TactileButton.displayName = "TactileButton";

export interface StatusLedProps {
  tone?: "ok" | "warn" | "err" | "signal" | "idle";
  size?: "sm" | "md";
  color?: string;
  label?: string;
}

/**
 * Steady industrial LED indicator — never pulses on idle (follows motion-no-idle-loops).
 */
export function StatusLed({ tone = "idle", size = "sm", color, label }: StatusLedProps) {
  const toneColor: Record<NonNullable<StatusLedProps["tone"]>, string> = {
    ok: "var(--status-ok)",
    warn: "var(--status-warn)",
    err: "var(--status-err)",
    signal: "var(--accent-signal)",
    idle: "var(--text-muted)",
  };
  const resolved = color ?? toneColor[tone];
  const dim = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";

  return (
    <span
      className={clsx("inline-block shrink-0 rounded-full", dim)}
      style={{
        backgroundColor: resolved,
        boxShadow: tone !== "idle" || color ? `0 0 0 2px color-mix(in srgb, ${resolved} 22%, transparent)` : undefined,
      }}
      aria-label={label}
      title={label}
    />
  );
}

export function KeyCap({ keys }: { keys: string[] }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {keys.map((k) => (
        <span
          key={k}
          className="font-mono-tech inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] px-1 text-[10px] font-medium leading-none"
          style={{ backgroundColor: "var(--keycap-bg)", color: "var(--keycap-text)" }}
        >
          {k}
        </span>
      ))}
    </span>
  );
}

export interface MechanicalSwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function MechanicalSwitch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: MechanicalSwitchProps) {
  return (
    <label className="flex items-center justify-between gap-3 py-1.5 cursor-pointer select-none">
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-[var(--text-primary)]">{label}</span>
        {description && (
          <span className="block text-[11px] text-[var(--text-secondary)]">{description}</span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 transition-colors duration-150 cursor-pointer disabled:opacity-45",
          checked
            ? "bg-[var(--accent-signal)] border-transparent"
            : "bg-[var(--bg-recessed)] border-[var(--border-strong)]"
        )}
      >
        <motion.span
          layout
          transition={MOTION.springSnappy}
          className="block h-[18px] w-[18px] rounded-full bg-white shadow-xs"
          style={{ marginLeft: checked ? "auto" : 0 }}
        />
      </button>
    </label>
  );
}

export interface PrecisionSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  disabled?: boolean;
}

export function PrecisionSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
  disabled,
}: PrecisionSliderProps) {
  const pct = ((value - min) / Math.max(1, max - min)) * 100;
  return (
    <div className="space-y-1.5 py-1">
      <div className="flex items-center justify-between text-[12px]">
        <span className="font-medium text-[var(--text-primary)]">{label}</span>
        <span className="font-mono-tech text-[12px] font-medium text-[var(--accent-signal)]">
          {value}
          {unit}
        </span>
      </div>
      <div className="relative flex items-center h-6">
        <div className="w-full h-1.5 rounded-full bg-[var(--bg-recessed)] border border-[var(--border-subtle)] overflow-hidden">
          <div
            className="h-full bg-[var(--accent-signal)]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
          className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <span
          className="pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-[var(--bg-module)] border-2 border-[var(--accent-signal)] shadow-xs"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between font-mono-tech text-[10px] text-[var(--text-muted)]">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {Math.round((min + max) / 2)}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}

export interface SegmentedDialOption<T extends string> {
  value: T;
  label: string;
}

export function SegmentedDial<T extends string>({
  id,
  options,
  value,
  onChange,
  label,
}: {
  id: string;
  options: SegmentedDialOption<T>[];
  value: T;
  onChange: (next: T) => void;
  label?: string;
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <span className="block text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-secondary)]">
          {label}
        </span>
      )}
      <div
        role="radiogroup"
        aria-label={label ?? id}
        className="relative grid rounded-[8px] bg-[var(--bg-recessed)] p-1 border border-[var(--border-subtle)]"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              className={clsx(
                "relative z-10 h-7 rounded-[6px] px-2 text-[12px] font-medium whitespace-nowrap cursor-pointer transition-colors duration-100",
                active ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              {active && (
                <motion.span
                  layoutId={`dial-${id}`}
                  transition={MOTION.springSnappy}
                  className="absolute inset-0 -z-10 rounded-[6px] bg-[var(--bg-module)] border border-[var(--border-subtle)] shadow-xs"
                />
              )}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
