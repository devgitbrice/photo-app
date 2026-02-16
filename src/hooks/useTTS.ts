"use client";

import { useState, useRef, useCallback } from "react";

type TTSState = "idle" | "loading" | "playing";

export function useTTS() {
  const [state, setState] = useState<TTSState>("idle");
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const stopPlayback = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {
        // already stopped
      }
      sourceRef.current = null;
    }
    setState("idle");
  }, []);

  const speak = useCallback(
    async (text: string, voice?: string): Promise<void> => {
      if (!text.trim()) return;

      // Stop any current playback
      stopPlayback();
      setState("loading");

      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice: voice || "Kore" }),
        });

        if (!res.ok) {
          setState("idle");
          return;
        }

        const data = await res.json();
        if (!data.audio) {
          setState("idle");
          return;
        }

        // Decode base64 PCM audio
        const raw = atob(data.audio);
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) {
          bytes[i] = raw.charCodeAt(i);
        }

        const int16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) {
          float32[i] = int16[i] / 32768;
        }

        // Create AudioContext and play
        if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
          audioCtxRef.current = new AudioContext({ sampleRate: 24000 });
        }
        const audioCtx = audioCtxRef.current;

        const buffer = audioCtx.createBuffer(1, float32.length, 24000);
        buffer.getChannelData(0).set(float32);

        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        sourceRef.current = source;

        setState("playing");

        return new Promise<void>((resolve) => {
          source.onended = () => {
            sourceRef.current = null;
            setState("idle");
            resolve();
          };
          source.start();
        });
      } catch (e) {
        console.error("TTS error:", e);
        setState("idle");
      }
    },
    [stopPlayback]
  );

  return { state, speak, stopPlayback };
}
