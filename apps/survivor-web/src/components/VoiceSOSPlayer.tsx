'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Play, Pause, Trash2, Check, Mic } from 'lucide-react';

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
    <div className="rl-voice-player">
      {/* Top status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--rl-accent-text)]">
          <Mic size={14} className="text-[var(--rl-accent)]" />
          <span>Voice SOS Audio Ready</span>
        </div>
        <button
          type="button"
          onClick={onDiscard}
          title="Discard and re-record"
          className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-transparent border-0 cursor-pointer p-1 rounded"
        >
          <Trash2 size={13} />
          <span>Discard</span>
        </button>
      </div>

      {/* Audio Playback Controls */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause Audio SOS' : 'Play Audio SOS'}
          className="w-9 h-9 rounded-full bg-[var(--rl-accent)] text-white border-0 flex items-center justify-center cursor-pointer shrink-0 transition-transform active:scale-95 shadow-sm"
        >
          {isPlaying ? <Pause size={16} fill="#ffffff" /> : <Play size={16} fill="#ffffff" className="ml-0.5" />}
        </button>

        {/* Custom Progress Bar */}
        <div
          onClick={handleSeek}
          className="flex-1 h-6 flex items-center cursor-pointer relative"
        >
          <div className="rl-voice-progress-track">
            <div
              className="rl-voice-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Time display */}
        <span className="font-mono text-xs font-bold text-[var(--rl-text-secondary)] shrink-0 min-w-[56px] text-right">
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
