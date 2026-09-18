'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface VoiceRecorderState {
  isRecording: boolean;
  audioUrl: string | null;
  audioBase64: string | null;
  recordingDuration: number;
  error: string | null;
}

export function useVoiceRecorder(maxDurationSeconds: number = 30) {
  const [state, setState] = useState<VoiceRecorderState>({
    isRecording: false,
    audioUrl: null,
    audioBase64: null,
    recordingDuration: 0,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const secondsRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    clearTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.requestData();
      } catch {
        // ignore
      }
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
  }, [clearTimer]);

  const clearRecording = useCallback(() => {
    stopRecording();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }
    secondsRef.current = 0;
    setState({
      isRecording: false,
      audioUrl: null,
      audioBase64: null,
      recordingDuration: 0,
      error: null,
    });
  }, [stopRecording, state.audioUrl]);

  const startRecording = useCallback(async () => {
    clearRecording();

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setState((prev) => ({
        ...prev,
        error: 'Microphone recording is not supported in this browser.',
      }));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Cross-platform audio format detection
      const candidateTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4;codecs=mp4a.40.2',
        'audio/mp4',
        'audio/aac',
      ];
      let selectedMimeType = '';
      if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
        for (const candidate of candidateTypes) {
          if (MediaRecorder.isTypeSupported(candidate)) {
            selectedMimeType = candidate;
            break;
          }
        }
      }

      const recorder = selectedMimeType
        ? new MediaRecorder(stream, { mimeType: selectedMimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        // Stop hardware microphone tracks ONLY after recorder has flushed all chunks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        if (audioChunksRef.current.length === 0) {
          setState((prev) => ({
            ...prev,
            isRecording: false,
            error: 'No audio data captured. Please check microphone input and try again.',
          }));
          return;
        }

        const effectiveType = recorder.mimeType || selectedMimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: effectiveType });

        if (audioBlob.size === 0) {
          setState((prev) => ({
            ...prev,
            isRecording: false,
            error: 'Recorded audio was empty. Please check microphone input and try again.',
          }));
          return;
        }

        const url = URL.createObjectURL(audioBlob);
        const finalDuration = Math.max(1, secondsRef.current);

        // Convert to base64 Data URL for IndexedDB and JSON payload transport
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setState({
            isRecording: false,
            audioUrl: url,
            audioBase64: base64data,
            recordingDuration: finalDuration,
            error: null,
          });
        };
        reader.readAsDataURL(audioBlob);
      };

      recorder.start(250); // Slice chunks every 250ms

      secondsRef.current = 0;
      setState({
        isRecording: true,
        audioUrl: null,
        audioBase64: null,
        recordingDuration: 0,
        error: null,
      });

      // Accurate duration counter and auto-stop at maxDurationSeconds
      timerRef.current = setInterval(() => {
        secondsRef.current += 1;
        const currentSec = secondsRef.current;
        setState((prev) => ({ ...prev, recordingDuration: currentSec }));

        if (currentSec >= maxDurationSeconds) {
          stopRecording();
        }
      }, 1000);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isRecording: false,
        error: 'Microphone permission denied or audio device unavailable.',
      }));
    }
  }, [clearRecording, maxDurationSeconds, stopRecording]);

  useEffect(() => {
    return () => {
      clearTimer();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [clearTimer]);

  return {
    ...state,
    startRecording,
    stopRecording,
    clearRecording,
  };
}
