"use client";

import { Mic, MicOff, Loader2 } from "lucide-react";
import { useVoiceDictation } from "@/hooks/useVoiceDictation";

interface VoiceDictationButtonProps {
  onTranscript: (text: string) => void;
  size?: number;
  className?: string;
}

export default function VoiceDictationButton({
  onTranscript,
  size = 16,
  className = "",
}: VoiceDictationButtonProps) {
  const { state, toggle } = useVoiceDictation(onTranscript);

  const isRecording = state === "recording";
  const isConnecting = state === "connecting";

  return (
    <button
      onClick={toggle}
      title={
        isRecording
          ? "Arreter la dictee"
          : isConnecting
          ? "Connexion..."
          : "Dictee vocale (Gemini)"
      }
      className={`p-1.5 rounded transition-all ${
        isRecording
          ? "bg-red-600 text-white animate-pulse"
          : isConnecting
          ? "bg-yellow-600 text-white"
          : "text-neutral-400 hover:bg-neutral-700 hover:text-white"
      } ${className}`}
    >
      {isConnecting ? (
        <Loader2 size={size} className="animate-spin" />
      ) : isRecording ? (
        <MicOff size={size} />
      ) : (
        <Mic size={size} />
      )}
    </button>
  );
}
