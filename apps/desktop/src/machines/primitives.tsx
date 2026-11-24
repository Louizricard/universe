import { motion, useReducedMotion } from "motion/react";
import type { MachineArchetype, MachinePhase, MachineTelemetry } from "@/registry/types";
import { MOTION } from "@/design-system/motion";

export interface MachinePrimitiveProps {
  phase: MachinePhase;
  progress: number; // 0..1
  accentColor: string;
  fileLabel?: string;
  telemetry?: MachineTelemetry;
}

/**
 * 1. HYDRAULIC PRESS — Prensa Hidráulica / Prensa de Rolos / Empacotadora
 * Piston descends proportionally to real job progress, compressing the file stack elastically
 * while the calibrated analog manometer needle rises.
 */
export function HydraulicPressVisual({
  phase,
  progress,
  accentColor,
  fileLabel,
}: MachinePrimitiveProps) {
  const reduced = useReducedMotion();
  const isRunning = phase === "running";
  const isSuccess = phase === "success";
  const isError = phase === "error";
  const isHover = phase === "hover";

  const p = isSuccess ? 1 : isRunning ? progress : isHover ? 0.08 : 0;
  const pistonY = reduced ? 0 : p * 54;
  const stackScaleY = reduced ? 1 : 1 - p * 0.56;
  const stackScaleX = reduced ? 1 : 1 + p * 0.08;
  const gaugeAngle = -115 + p * 230;

  return (
    <svg viewBox="0 0 360 220" className="w-full h-full max-h-[240px]" aria-hidden="true">
      {/* Frame pillars */}
      <rect x="44" y="18" width="14" height="184" rx="3" fill="var(--bg-module)" stroke="var(--border-strong)" strokeWidth="1.5" />
      <rect x="302" y="18" width="14" height="184" rx="3" fill="var(--bg-module)" stroke="var(--border-strong)" strokeWidth="1.5" />
      {/* Top crossbar */}
      <rect x="36" y="14" width="288" height="22" rx="5" fill="var(--bg-module)" stroke="var(--border-strong)" strokeWidth="1.5" />
      {/* Base anvil */}
      <rect x="36" y="186" width="288" height="20" rx="5" fill="var(--bg-module)" stroke="var(--border-strong)" strokeWidth="1.5" />

      {/* Guide rail calibration ticks */}
      {[54, 74, 94, 114, 134, 154].map((y) => (
        <g key={y} stroke="var(--border-strong)" strokeWidth="1">
          <line x1="60" y1={y} x2="67" y2={y} />
          <line x1="293" y1={y} x2="300" y2={y} />
        </g>
      ))}

      {/* Analog Manometer (pressure dial) */}
      <g transform="translate(262, 62)">
        <circle r="22" fill="var(--bg-module)" stroke="var(--border-strong)" strokeWidth="1.5" />
        <path
          d="M -14 10 A 17 17 0 1 1 14 10"
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 5 -16 A 17 17 0 0 1 14 10"
          fill="none"
          stroke={isError ? "var(--status-err)" : accentColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <motion.g
          data-mech
          animate={{ rotate: reduced ? (isSuccess ? 80 : -80) : gaugeAngle }}
          transition={MOTION.springMechanical}
        >
          <line x1="0" y1="3" x2="0" y2="-15" stroke={isError ? "var(--status-err)" : "var(--text-primary)"} strokeWidth="2" strokeLinecap="round" />
          <circle r="3" fill="var(--text-primary)" />
        </motion.g>
      </g>

      {/* Hydraulic Piston Assembly */}
      <motion.g
        animate={{ y: pistonY }}
        transition={MOTION.springHeavy}
      >
        {/* Central rod */}
        <rect x="166" y="36" width="28" height="44" rx="2" fill="var(--bg-recessed)" stroke="var(--border-strong)" strokeWidth="1.5" />
        {/* Press platen */}
        <rect
          x="84"
          y="76"
          width="192"
          height="20"
          rx="4"
          fill="var(--bg-module)"
          stroke={isError ? "var(--status-err)" : isRunning || isSuccess ? accentColor : "var(--border-strong)"}
          strokeWidth="1.8"
        />
        {/* Warning/industrial chevron strip */}
        <line x1="94" y1="86" x2="266" y2="86" stroke={isError ? "var(--status-err)" : accentColor} strokeWidth="3" strokeDasharray="10 8" opacity={isRunning || isSuccess ? 0.95 : 0.45} />
      </motion.g>

      {/* Target File Stack being compressed on the anvil */}
      <motion.g
        style={{ transformOrigin: "180px 186px" }}
        animate={{
          scaleY: stackScaleY,
          scaleX: stackScaleX,
          opacity: phase === "idle" ? 0.45 : 1,
        }}
        transition={MOTION.springHeavy}
      >
        <rect x="112" y="130" width="136" height="16" rx="3" fill="var(--bg-module)" stroke="var(--border-strong)" strokeWidth="1.4" />
        <rect x="108" y="148" width="144" height="17" rx="3" fill="var(--bg-module)" stroke="var(--border-strong)" strokeWidth="1.4" />
        <rect x="104" y="167" width="152" height="18" rx="3" fill="var(--bg-module)" stroke={isSuccess ? "var(--status-ok)" : accentColor} strokeWidth="1.6" />
        <text
          x="180"
          y="179"
          textAnchor="middle"
          fontSize="9"
          fontFamily="JetBrains Mono, monospace"
          fill="var(--text-secondary)"
        >
          {fileLabel ? fileLabel.slice(0, 18) : "CARGA PRONTA"}
        </text>
      </motion.g>
    </svg>
  );
}

/**
 * 2. GUILLOTINE CUTTER — Guilhotina de Precisão / Moviola / Tesoura
 */
export function GuillotineVisual({ phase, progress, accentColor }: MachinePrimitiveProps) {
  const reduced = useReducedMotion();
  const isRunning = phase === "running";
  const isSuccess = phase === "success";
  const p = isSuccess ? 1 : isRunning ? progress : 0;

  const bladeY = reduced ? 0 : isRunning ? Math.sin(p * Math.PI) * 56 : isSuccess ? 10 : 0;
  const splitGap = reduced ? (isSuccess ? 12 : 0) : p * 22;

  return (
    <svg viewBox="0 0 360 220" className="w-full h-full max-h-[240px]" aria-hidden="true">
      {/* Cutting bed */}
      <rect x="34" y="156" width="292" height="34" rx="6" fill="var(--bg-module)" stroke="var(--border-strong)" strokeWidth="1.5" />
      {/* Ruler marks */}
      {Array.from({ length: 13 }).map((_, idx) => {
        const x = 54 + idx * 21;
        return (
          <line
            key={x}
            x1={x}
            y1="156"
            x2={x}
            y2={idx % 2 === 0 ? 168 : 163}
            stroke="var(--border-strong)"
            strokeWidth="1.2"
          />
        );
      })}

      {/* Laser guide line */}
      <line
        x1="180"
        y1="32"
        x2="180"
        y2="162"
        stroke={accentColor}
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity={phase === "idle" ? 0.35 : 0.9}
      />

      {/* Left & Right document/clip halves */}
      <motion.g animate={{ x: -splitGap }} transition={MOTION.springMechanical}>
        <rect x="82" y="108" width="96" height="46" rx="4" fill="var(--bg-module)" stroke="var(--border-strong)" strokeWidth="1.5" />
        <line x1="94" y1="124" x2="160" y2="124" stroke="var(--border-strong)" strokeWidth="2" />
        <line x1="94" y1="136" x2="146" y2="136" stroke="var(--border-subtle)" strokeWidth="2" />
      </motion.g>
      <motion.g animate={{ x: splitGap }} transition={MOTION.springMechanical}>
        <rect x="182" y="108" width="96" height="46" rx="4" fill="var(--bg-module)" stroke={isSuccess ? "var(--status-ok)" : accentColor} strokeWidth="1.5" />
        <line x1="194" y1="124" x2="262" y2="124" stroke="var(--border-strong)" strokeWidth="2" />
        <line x1="194" y1="136" x2="244" y2="136" stroke="var(--border-subtle)" strokeWidth="2" />
      </motion.g>

      {/* Precision Blade Carriage */}
      <motion.g animate={{ y: bladeY }} transition={MOTION.springSnappy}>
        <rect x="108" y="24" width="144" height="22" rx="4" fill="var(--bg-module)" stroke="var(--border-strong)" strokeWidth="1.5" />
        <polygon points="116,46 244,46 238,68 122,60" fill="var(--bg-recessed)" stroke={accentColor} strokeWidth="1.6" />
        <circle cx="128" cy="35" r="3" fill={accentColor} />
        <circle cx="232" cy="35" r="3" fill={accentColor} />
      </motion.g>
    </svg>
  );
}

/**
 * 3. OPTICAL SCANNER — Scanner de Mesa OCR / Filtro de Espectro / Lupa / Mira QR
 */
export function OpticalScannerVisual({ phase, progress, accentColor }: MachinePrimitiveProps) {
  const reduced = useReducedMotion();
  const isRunning = phase === "running";
  const isSuccess = phase === "success";
  const beamY = reduced ? 105 : 46 + (isSuccess ? 1 : isRunning ? progress : 0.15) * 114;

  return (
    <svg viewBox="0 0 360 220" className="w-full h-full max-h-[240px]" aria-hidden="true">
      {/* Scanner platen frame */}
      <rect x="64" y="24" width="232" height="172" rx="10" fill="var(--bg-module)" stroke="var(--border-strong)" strokeWidth="1.5" />
      <rect x="82" y="40" width="196" height="140" rx="6" fill="var(--bg-recessed)" stroke="var(--border-subtle)" strokeWidth="1" />

      {/* Optical corner reticles */}
      <g stroke={isSuccess ? "var(--status-ok)" : accentColor} strokeWidth="2" fill="none">
        <path d="M 92 58 L 92 48 L 102 48" />
        <path d="M 268 58 L 268 48 L 258 48" />
        <path d="M 92 162 L 92 172 L 102 172" />
        <path d="M 268 162 L 268 172 L 258 172" />
      </g>

      {/* Recognized text/data lines lighting up as scanner beam sweeps past */}
      {[62, 82, 102, 122, 142, 158].map((lineY, idx) => {
        const scanned = isSuccess || (isRunning && beamY >= lineY);
        return (
          <g key={lineY}>
            <rect
              x="108"
              y={lineY}
              width={idx % 2 === 0 ? 142 : 112}
              height="8"
              rx="2"
              fill={scanned ? accentColor : "var(--border-strong)"}
              opacity={scanned ? 0.8 : 0.35}
            />
          </g>
        );
      })}

      {/* Moving Scanner Beam */}
      <motion.g animate={{ y: beamY - 46 }} transition={MOTION.easeTechnical}>
        <rect x="74" y="42" width="212" height="8" rx="3" fill={accentColor} opacity={isRunning ? 0.95 : 0.45} />
        <rect x="82" y="50" width="196" height="14" fill={accentColor} opacity={isRunning ? 0.14 : 0.04} />
      </motion.g>
    </svg>
  );
}

/**
 * 4. VAULT TUMBLER — Trava de Cofre / Chave de Desbloqueio / Tambor de Senhas / Desmagnetizador
 */
export function VaultTumblerVisual({ phase, progress, accentColor }: MachinePrimitiveProps) {
  const reduced = useReducedMotion();
  const isRunning = phase === "running";
  const isSuccess = phase === "success";
  const dialRot = reduced ? 0 : isRunning ? progress * 360 : isSuccess ? 90 : 0;

  return (
    <svg viewBox="0 0 360 220" className="w-full h-full max-h-[240px]" aria-hidden="true">
      {/* Armored plate */}
      <rect x="86" y="24" width="188" height="172" rx="14" fill="var(--bg-module)" stroke="var(--border-strong)" strokeWidth="1.5" />
      {/* Corner rivets */}
      {[
        [102, 40],
        [258, 40],
        [102, 180],
        [258, 180],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.5" fill="var(--border-strong)" />
      ))}

      {/* Outer calibrated ring */}
      <circle cx="180" cy="110" r="62" fill="var(--bg-recessed)" stroke="var(--border-strong)" strokeWidth="1.5" />
      <circle
        cx="180"
        cy="110"
        r="54"
        fill="none"
        stroke={isSuccess ? "var(--status-ok)" : accentColor}
        strokeWidth="2.5"
        strokeDasharray="6 10"
      />

      {/* Rotating Tumbler Wheel */}
      <motion.g
        data-mech
        animate={{ rotate: dialRot }}
        transition={MOTION.springMechanical}
      >
        <circle cx="180" cy="110" r="40" fill="var(--bg-module)" stroke="var(--border-strong)" strokeWidth="2" />
        <line x1="180" y1="74" x2="180" y2="88" stroke={accentColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="180" y1="132" x2="180" y2="146" stroke="var(--border-strong)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="144" y1="110" x2="158" y2="110" stroke="var(--border-strong)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="202" y1="110" x2="216" y2="110" stroke="var(--border-strong)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="180" cy="110" r="12" fill="var(--bg-recessed)" stroke={isSuccess ? "var(--status-ok)" : accentColor} strokeWidth="2" />
      </motion.g>

      {/* Lock Indicator LED */}
      <circle cx="180" cy="39" r="4.5" fill={isSuccess ? "var(--status-ok)" : isRunning ? accentColor : "var(--text-muted)"} />
    </svg>
  );
}

/**
 * 5. REEL CAPTURE — Carretel de Captura / Bobinas de Vídeo & Áudio / Flipbook
 */
export function ReelCaptureVisual({ phase, progress, accentColor }: MachinePrimitiveProps) {
  const reduced = useReducedMotion();
  const isRunning = phase === "running";
  const isSuccess = phase === "success";
  const angle = reduced ? 0 : progress * 720;

  return (
    <svg viewBox="0 0 360 220" className="w-full h-full max-h-[240px]" aria-hidden="true">
      {/* Tape Deck Chassis */}
      <rect x="42" y="34" width="276" height="152" rx="12" fill="var(--bg-module)" stroke="var(--border-strong)" strokeWidth="1.5" />
      {/* Tape path bar */}
      <rect x="82" y="146" width="196" height="18" rx="4" fill="var(--bg-recessed)" stroke="var(--border-subtle)" strokeWidth="1" />
      <motion.rect
        x="84"
        y="148"
        height="14"
        rx="3"
        fill={isSuccess ? "var(--status-ok)" : accentColor}
        animate={{ width: Math.max(8, (isSuccess ? 1 : progress) * 192) }}
        transition={MOTION.easeTechnical}
      />

      {/* Left & Right Spools */}
      {[124, 236].map((cx) => (
        <motion.g
          key={cx}
          data-mech
          animate={{ rotate: angle }}
          transition={{ duration: 0.12, ease: "linear" }}
        >
          <circle cx={cx} cy="96" r="36" fill="var(--bg-recessed)" stroke="var(--border-strong)" strokeWidth="1.5" />
          <circle cx={cx} cy="96" r="24" fill="none" stroke={isRunning || isSuccess ? accentColor : "var(--border-strong)"} strokeWidth="2" strokeDasharray="10 8" />
          <circle cx={cx} cy="96" r="9" fill="var(--bg-module)" stroke="var(--border-strong)" strokeWidth="1.5" />
          <line x1={cx} y1="68" x2={cx} y2="82" stroke="var(--text-secondary)" strokeWidth="2" />
          <line x1={cx - 24} y1="110" x2={cx - 12} y2="103" stroke="var(--text-secondary)" strokeWidth="2" />
          <line x1={cx + 24} y1="110" x2={cx + 12} y2="103" stroke="var(--text-secondary)" strokeWidth="2" />
        </motion.g>
      ))}
    </svg>
  );
}

/**
 * 6. MATRIX ASSEMBLER — Matriz de Pinos QR / Achatador JSON / Plotter / Encadernadora
 */
export function MatrixAssemblerVisual({ phase, progress, accentColor }: MachinePrimitiveProps) {
  const isRunning = phase === "running";
  const isSuccess = phase === "success";
  const p = isSuccess ? 1 : isRunning ? progress : 0.2;
  const cols = 7;
  const rows = 5;
  const total = cols * rows;

  return (
    <svg viewBox="0 0 360 220" className="w-full h-full max-h-[240px]" aria-hidden="true">
      <rect x="74" y="28" width="212" height="164" rx="10" fill="var(--bg-module)" stroke="var(--border-strong)" strokeWidth="1.5" />
      <g transform="translate(96, 48)">
        {Array.from({ length: total }).map((_, idx) => {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          const threshold = (col + row) / (cols + rows - 2);
          const active = isSuccess ? (idx * 7) % 3 !== 0 : threshold <= p;
          return (
            <rect
              key={idx}
              x={col * 25}
              y={row * 26}
              width="18"
              height="18"
              rx="3"
              fill={active ? (isSuccess ? "var(--status-ok)" : accentColor) : "var(--bg-recessed)"}
              stroke="var(--border-subtle)"
              strokeWidth="1"
              opacity={active ? 0.92 : 0.65}
            />
          );
        })}
      </g>
    </svg>
  );
}

/**
 * 7. PRECISION CUTOUT — Mesa de Recorte Óptico / Moldura Pantográfica / Rasterizador
 */
export function PrecisionCutoutVisual({ phase, progress, accentColor }: MachinePrimitiveProps) {
  const reduced = useReducedMotion();
  const isRunning = phase === "running";
  const isSuccess = phase === "success";
  const p = isSuccess ? 1 : isRunning ? progress : 0;
  const inset = reduced ? 0 : p * 14;

  return (
    <svg viewBox="0 0 360 220" className="w-full h-full max-h-[240px]" aria-hidden="true">
      <defs>
        <pattern id="checker-bg" width="14" height="14" patternUnits="userSpaceOnUse">
          <rect width="7" height="7" fill="var(--bg-recessed)" />
          <rect x="7" y="7" width="7" height="7" fill="var(--bg-recessed)" />
          <rect x="7" width="7" height="7" fill="var(--bg-module)" />
          <rect y="7" width="7" height="7" fill="var(--bg-module)" />
        </pattern>
      </defs>

      {/* Checkerboard transparency table */}
      <rect x="72" y="28" width="216" height="164" rx="10" fill="url(#checker-bg)" stroke="var(--border-strong)" strokeWidth="1.5" />

      {/* Pantograph Frame */}
      <motion.rect
        x={96 + inset}
        y={48 + inset * 0.7}
        width={168 - inset * 2}
        height={124 - inset * 1.4}
        rx="6"
        fill="none"
        stroke={isSuccess ? "var(--status-ok)" : accentColor}
        strokeWidth="2"
        strokeDasharray="6 4"
        transition={MOTION.springMechanical}
      />

      {/* Isolated foreground subject */}
      <motion.g
        animate={{ y: reduced ? 0 : isSuccess ? -6 : 0 }}
        transition={MOTION.springMechanical}
      >
        <circle
          cx="180"
          cy="110"
          r="34"
          fill="var(--bg-module)"
          stroke={isSuccess ? "var(--status-ok)" : accentColor}
          strokeWidth="2.2"
        />
        <polygon points="164,122 180,90 198,122" fill={accentColor} opacity="0.85" />
      </motion.g>
    </svg>
  );
}

export function renderMachinePrimitive(
  archetype: MachineArchetype,
  props: MachinePrimitiveProps
) {
  switch (archetype) {
    case "press":
      return <HydraulicPressVisual {...props} />;
    case "guillotine":
      return <GuillotineVisual {...props} />;
    case "scanner":
      return <OpticalScannerVisual {...props} />;
    case "vault":
      return <VaultTumblerVisual {...props} />;
    case "reel":
      return <ReelCaptureVisual {...props} />;
    case "matrix":
      return <MatrixAssemblerVisual {...props} />;
    case "cutout":
      return <PrecisionCutoutVisual {...props} />;
  }
}
