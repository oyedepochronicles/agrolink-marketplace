import { useCallback, useEffect, useRef, useState } from "react";

interface RecorderState {
  isRecording: boolean;
  durationMs: number;
  blob: Blob | null;
  error: string | null;
}

const pickMime = (): string => {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
};

export const useVoiceRecorder = () => {
  const [state, setState] = useState<RecorderState>({
    isRecording: false,
    durationMs: 0,
    blob: null,
    error: null,
  });
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMime();
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        setState((s) => ({ ...s, isRecording: false, blob }));
        cleanup();
      };
      rec.start();
      recorderRef.current = rec;
      startedAtRef.current = Date.now();
      setState({ isRecording: true, durationMs: 0, blob: null, error: null });
      tickRef.current = window.setInterval(() => {
        setState((s) => ({ ...s, durationMs: Date.now() - startedAtRef.current }));
      }, 200);
    } catch (e) {
      setState((s) => ({ ...s, error: (e as Error).message || "Microphone unavailable" }));
    }
  }, [cleanup]);

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }, []);

  const cancel = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    chunksRef.current = [];
    cleanup();
    setState({ isRecording: false, durationMs: 0, blob: null, error: null });
  }, [cleanup]);

  const reset = useCallback(() => {
    setState({ isRecording: false, durationMs: 0, blob: null, error: null });
  }, []);

  return { ...state, start, stop, cancel, reset };
};
