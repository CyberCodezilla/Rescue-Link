'use client';

import { useState, useEffect, useCallback } from 'react';

interface BatteryManager extends EventTarget {
  level: number;
  charging: boolean;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>;
}

export function useBatteryOptimization() {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [oledMode, setOledMode] = useState<boolean>(false);

  const isLowBattery = batteryLevel !== null && batteryLevel <= 0.2 && !isCharging;
  const recommendedPollIntervalMs = isLowBattery ? 30000 : 5000;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const nav = navigator as NavigatorWithBattery;
    if (typeof nav.getBattery !== 'function') return;

    let batteryInstance: BatteryManager | null = null;
    let handleLevelChange: (() => void) | null = null;
    let handleChargingChange: (() => void) | null = null;
    let isMounted = true;

    const updateBatteryInfo = (battery: BatteryManager) => {
      setBatteryLevel(battery.level);
      setIsCharging(battery.charging);

      // Automatically suggest OLED mode if battery drops below 20%
      if (battery.level <= 0.2 && !battery.charging) {
        setOledMode(true);
      }
    };

    nav.getBattery()
      .then((battery) => {
        if (!isMounted) return;
        batteryInstance = battery;
        updateBatteryInfo(battery);

        handleLevelChange = () => updateBatteryInfo(battery);
        handleChargingChange = () => updateBatteryInfo(battery);

        battery.addEventListener('levelchange', handleLevelChange);
        battery.addEventListener('chargingchange', handleChargingChange);
      })
      .catch(() => {
        // Battery API unsupported or restricted in browser context
      });

    return () => {
      isMounted = false;
      if (batteryInstance) {
        if (handleLevelChange) {
          batteryInstance.removeEventListener('levelchange', handleLevelChange);
        }
        if (handleChargingChange) {
          batteryInstance.removeEventListener('chargingchange', handleChargingChange);
        }
      }
    };
  }, []);

  const toggleOledMode = useCallback(() => {
    setOledMode((prev) => !prev);
  }, []);

  return {
    batteryLevel,
    isCharging,
    isLowBattery,
    oledMode,
    toggleOledMode,
    recommendedPollIntervalMs,
  };
}
