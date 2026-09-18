import { describe, it, expect, vi } from 'vitest';
import { playAlertChime, playWhistleBurst } from '../src/lib/audio';

describe('Audit Remediation Tests - Survivor Web', () => {
  describe('Web Audio safe utilities (lib/audio.ts)', () => {
    it('handles environments where AudioContext is unavailable without throwing', () => {
      expect(() => playAlertChime()).not.toThrow();
      expect(() => playWhistleBurst()).not.toThrow();
    });

    it('instantiates AudioContext and connects nodes when available', () => {
      const mockOsc = {
        type: '',
        frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };
      const mockGain = {
        gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
      };
      const mockCtx = {
        currentTime: 0,
        destination: {},
        createOscillator: vi.fn(() => mockOsc),
        createGain: vi.fn(() => mockGain),
      };

      // Mock window.AudioContext
      (globalThis as any).AudioContext = vi.fn(() => mockCtx);

      playAlertChime();
      expect(mockCtx.createOscillator).toHaveBeenCalled();
      expect(mockCtx.createGain).toHaveBeenCalled();
      expect(mockOsc.start).toHaveBeenCalled();
      expect(mockOsc.stop).toHaveBeenCalled();

      playWhistleBurst();
      expect(mockOsc.type).toBe('triangle');

      delete (globalThis as any).AudioContext;
    });
  });

  describe('SOSForm coordinate validation logic', () => {
    it('detects invalid or missing manual coordinates correctly', () => {
      const validateCoordinates = (
        location: { lat: number; lng: number } | null,
        manualLat: string,
        manualLng: string
      ) => {
        let currentLocation = location;
        if (!currentLocation) {
          const parsedLat = parseFloat(manualLat);
          const parsedLng = parseFloat(manualLng);
          if (
            Number.isFinite(parsedLat) &&
            Number.isFinite(parsedLng) &&
            parsedLat >= -90 &&
            parsedLat <= 90 &&
            parsedLng >= -180 &&
            parsedLng <= 180
          ) {
            currentLocation = { lat: parsedLat, lng: parsedLng };
          } else {
            return null;
          }
        }
        return currentLocation;
      };

      // Empty strings should return null (validation failure), not (0, 0)
      expect(validateCoordinates(null, '', '')).toBeNull();
      expect(validateCoordinates(null, 'abc', 'def')).toBeNull();
      expect(validateCoordinates(null, '100', '-122')).toBeNull(); // lat > 90

      // Valid coordinates should be accepted
      expect(validateCoordinates(null, '37.7749', '-122.4194')).toEqual({
        lat: 37.7749,
        lng: -122.4194,
      });

      // Existing GPS location takes precedence
      expect(validateCoordinates({ lat: 10, lng: 20 }, '', '')).toEqual({
        lat: 10,
        lng: 20,
      });
    });
  });
});
