import type { Transition } from "framer-motion";

/** Intersection observer root — works inside overflow containers on mobile */
export const motionViewport = { once: true, amount: 0.1 } as const;

const defaultTransition: Transition = { duration: 0.7 };

/**
 * Fade-up preset that stays visible on SSR/hydration.
 * Never uses opacity:0 initial — fixes invisible content on mobile when
 * framer-motion animations fail to run.
 */
export const fadeUp = {
  initial: false as const,
  whileInView: { opacity: 1, y: 0 },
  transition: defaultTransition,
  viewport: motionViewport,
};

/** Mount animation — content visible immediately, no SSR opacity:0 */
export const fadeIn = {
  initial: false as const,
  animate: { opacity: 1, y: 0, x: 0, scale: 1 },
  transition: defaultTransition,
};

/** Cap measured fixed header height for mobile spacer safety */
export function clampHeaderHeight(height: number, isMobile = false): number {
  const min = 72;
  const max = isMobile ? 240 : 260;
  if (!Number.isFinite(height) || height <= 0) return isMobile ? 148 : 156;
  return Math.min(Math.max(Math.round(height), min), max);
}
