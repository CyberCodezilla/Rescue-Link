'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Play, Pause, Trash2, Check } from 'lucide-react';

interface VoiceSOSPlayerProps {
  audioUrl: string;
  durationSeconds: number;
  onDiscard: () => void;
}

export function VoiceSOSPlayer({ audioUrl, durationSeconds, onDiscard }: VoiceSOSPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const duration = Math.max(1, durationSeconds);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Playback error:', err);
      });
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percent * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (secs: number) => {
    const s = Math.floor(secs);
    const m = Math.floor(s / 60);
    const remainingS = s % 60;
    return `${m}:${remainingS < 10 ? '0' : ''}${remainingS}`;
  };

  const progressPercent = Math.min(100, (currentTime / duration) * 100);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px 14px',
        backgroundColor: '#064e3b',
        border: '1.5px solid #059669',
        borderRadius: '10px',
        color: '#ecfdf5',
      }}
    >
      {/* Top status bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700 }}>
          <Check size={16} color="#34d399" />
          <span>Voice SOS Audio Ready</span>
        </div>
        <button
          type="button"
          onClick={onDiscard}
          title="Discard and re-record"
          style={{
            background: 'none',
            border: 'none',
            color: '#fca5a5',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          <Trash2 size={13} />
          <span>Discard</span>
        </button>
      </div>

      {/* Audio Playback Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause Audio SOS' : 'Play Audio SOS'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'transform 0.1s ease',
          }}
        >
          {isPlaying ? <Pause size={16} fill="#ffffff" /> : <Play size={16} fill="#ffffff" style={{ marginLeft: '2px' }} />}
        </button>

        {/* Custom Progress Bar */}
        <div
          onClick={handleSeek}
          style={{
            flex: 1,
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '6px',
              backgroundColor: '#065f46',
              borderRadius: '3px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                backgroundColor: '#34d399',
                transition: 'width 0.1s linear',
              }}
            />
          </div>
        </div>

        {/* Time display */}
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: '12px',
            fontWeight: 700,
            color: '#a7f3d0',
            flexShrink: 0,
            minWidth: '68px',
            textAlign: 'right',
          }}
        >
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* Hidden native audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        style={{ display: 'none' }}
      />
    </div>
  );
}
