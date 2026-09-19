/**
 * Shared motion design tokens for RescueLink.
 *
 * All animation durations, easing curves, and the reduced-motion media query
 * are defined here once. Both survivor-web and responder-web import from this
 * file so timing values are never re-invented per component.
 */
export const MOTION = {
  /** Duration tokens */
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '500ms',
    counter: '800ms',
  },
  /** Easing curves */
  easing: {
    default: 'cubic-bezier(0.16, 1, 0.3, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    linear: 'linear',
  },
  /** Media query string to detect user prefers-reduced-motion */
  reducedMotionQuery: '(prefers-reduced-motion: reduce)',
} as const;
