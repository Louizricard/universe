import type { Transition } from "motion/react";

/**
 * Industrial-Craft Motion Physics Tokens
 * Strictly calibrated to docs/02-design-system-and-motion.md:
 * - Click/system UI uses critically damped springs (zero gratuitous bounce).
 * - Mechanical actuators carry deliberate physical mass.
 * - Exits run shorter and crisper than entrances.
 */
export const MOTION = {
  springSnappy: {
    type: "spring",
    stiffness: 520,
    damping: 36,
    mass: 0.8,
  } satisfies Transition,

  springMechanical: {
    type: "spring",
    stiffness: 340,
    damping: 28,
    mass: 1.1,
  } satisfies Transition,

  springHeavy: {
    type: "spring",
    stiffness: 220,
    damping: 26,
    mass: 1.6,
  } satisfies Transition,

  easeTechnical: {
    duration: 0.22,
    ease: [0.22, 1, 0.36, 1],
  } satisfies Transition,

  easeExit: {
    duration: 0.15,
    ease: [0.4, 0, 1, 1],
  } satisfies Transition,

  fadeFast: {
    duration: 0.15,
    ease: [0.23, 1, 0.32, 1],
  } satisfies Transition,
} as const;

export function cappedStagger(index: number, stepSeconds = 0.03, maxItems = 5): number {
  return Math.min(index, maxItems - 1) * stepSeconds;
}
