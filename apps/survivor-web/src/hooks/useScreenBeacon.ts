'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { playWhistleBurst } from '@/lib/audio';

export function useScreenBeacon() {
  const [isBeaconActive, setIsBeaconActive] = useState(false);
  const [strobeColor, setStrobeColor] = useState<'#ffffff' | '#000000'>('#000000');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoShutoffRef = useRef<NodeJS.Timeout | null>(null);

  const stopBeacon = useCallback(() => {
    setIsBeaconActive(false);
    setStrobeColor('#000000');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (autoShutoffRef.current) {
      clearTimeout(autoShutoffRef.current);
      autoShutoffRef.current = null;
    }
  }, []);

  const startBeacon = useCallback(() => {
    setIsBeaconActive(true);
    let flashCount = 0;

    // Strobe interval: 250ms pulse
    timerRef.current = setInterval(() => {
      setStrobeColor((prev) => (prev === '#000000' ? '#ffffff' : '#000000'));
      flashCount++;

      // Every 6 flashes (~1.5s), emit an alpine acoustic whistle burst
      if (flashCount % 6 === 0) {
        playWhistleBurst();
      }
    }, 250);

    // Auto-shutoff after 3 minutes to prevent battery drain
    autoShutoffRef.current = setTimeout(() => {
      stopBeacon();
    }, 180000);
  }, [playWhistleBurst, stopBeacon]);

  const toggleBeacon = useCallback(() => {
    if (isBeaconActive) {
      stopBeacon();
    } else {
      startBeacon();
    }
  }, [isBeaconActive, startBeacon, stopBeacon]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoShutoffRef.current) clearTimeout(autoShutoffRef.current);
    };
  }, []);

  return {
    isBeaconActive,
    toggleBeacon,
    startBeacon,
    stopBeacon,
    strobeColor,
  };
}
