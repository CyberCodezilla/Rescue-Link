/**
 * Web Audio API utilities for survivor alerts and beacons.
 * Safe for server-side rendering and legacy browser environments.
 */

function getAudioContextClass(): typeof AudioContext | null {
  const globalScope = typeof window !== 'undefined' ? window : globalThis;
  const win = globalScope as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  return win.AudioContext || win.webkitAudioContext || null;
}

/**
 * Play a synthesized two-tone emergency evacuation alert chime (880Hz -> 440Hz sawtooth)
 */
export function playAlertChime(): void {
  const AudioCtxClass = getAudioContextClass();
  if (!AudioCtxClass) return;

  try {
    const ctx = new AudioCtxClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio playback blocked by browser autoplay policy or restricted context
  }
}

/**
 * Play a high-frequency alpine acoustic whistle pulse (1200Hz -> 1500Hz triangle)
 */
export function playWhistleBurst(): void {
  const AudioCtxClass = getAudioContextClass();
  if (!AudioCtxClass) return;

  try {
    const ctx = new AudioCtxClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Audio playback blocked by browser autoplay policy or restricted context
  }
}
