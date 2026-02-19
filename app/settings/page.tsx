"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Volume2, Loader2, Square } from "lucide-react";
import {
  useTTSSettingsStore,
  type TTSVoice,
  type TTSModel,
  type TTSFormat,
} from "@/store/ttsSettingsStore";
import { useTTS } from "@/hooks/useTTS";

const VOICES: { value: TTSVoice; label: string; description: string }[] = [
  { value: "alloy", label: "Alloy", description: "Neutre, polyvalente" },
  { value: "ash", label: "Ash", description: "Calme, posee" },
  { value: "ballad", label: "Ballad", description: "Douce, melodieuse" },
  { value: "coral", label: "Coral", description: "Claire, chaleureuse" },
  { value: "echo", label: "Echo", description: "Masculine, profonde" },
  { value: "fable", label: "Fable", description: "Expressive, narrative" },
  { value: "onyx", label: "Onyx", description: "Grave, autoritaire" },
  { value: "nova", label: "Nova", description: "Jeune, energique" },
  { value: "sage", label: "Sage", description: "Sage, reflechie" },
  { value: "shimmer", label: "Shimmer", description: "Legere, brillante" },
  { value: "verse", label: "Verse", description: "Versatile, equilibree" },
];

const MODELS: { value: TTSModel; label: string; description: string }[] = [
  {
    value: "gpt-4o-mini-tts",
    label: "GPT-4o Mini TTS",
    description: "Derniere generation, supporte les instructions",
  },
  {
    value: "tts-1",
    label: "TTS-1",
    description: "Standard, faible latence",
  },
  {
    value: "tts-1-hd",
    label: "TTS-1 HD",
    description: "Haute qualite",
  },
];

const FORMATS: { value: TTSFormat; label: string }[] = [
  { value: "mp3", label: "MP3" },
  { value: "opus", label: "Opus" },
  { value: "aac", label: "AAC" },
  { value: "flac", label: "FLAC" },
  { value: "wav", label: "WAV" },
  { value: "pcm", label: "PCM" },
];

export default function SettingsPage() {
  const {
    voice,
    model,
    speed,
    responseFormat,
    instructions,
    setVoice,
    setModel,
    setSpeed,
    setResponseFormat,
    setInstructions,
    resetDefaults,
  } = useTTSSettingsStore();

  const { state: ttsState, speak, stopPlayback } = useTTS();
  const [testText] = useState(
    "Bonjour, ceci est un test de la synthese vocale OpenAI."
  );

  const handleTest = () => {
    if (ttsState === "playing" || ttsState === "loading") {
      stopPlayback();
      return;
    }
    speak(testText);
  };

  return (
    <main className="min-h-dvh p-6 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex items-center gap-4">
        <Link
          href="/mydrive"
          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-semibold text-white">Parametres</h1>
      </header>

      {/* TTS Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
          <Volume2 size={20} className="text-blue-400" />
          <h2 className="text-lg font-semibold text-white">
            Text-to-Speech (OpenAI)
          </h2>
        </div>

        {/* Model selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-300">
            Modele
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {MODELS.map((m) => (
              <button
                key={m.value}
                onClick={() => setModel(m.value)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  model === m.value
                    ? "border-blue-500 bg-blue-500/10 text-white"
                    : "border-neutral-700 bg-neutral-900 text-neutral-400 hover:border-neutral-500 hover:text-white"
                }`}
              >
                <div className="font-medium text-sm">{m.label}</div>
                <div className="text-xs mt-1 opacity-70">{m.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Voice selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-300">Voix</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {VOICES.map((v) => (
              <button
                key={v.value}
                onClick={() => setVoice(v.value)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  voice === v.value
                    ? "border-blue-500 bg-blue-500/10 text-white"
                    : "border-neutral-700 bg-neutral-900 text-neutral-400 hover:border-neutral-500 hover:text-white"
                }`}
              >
                <div className="font-medium text-sm">{v.label}</div>
                <div className="text-xs mt-1 opacity-70">{v.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Speed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-300">
              Vitesse
            </label>
            <span className="text-sm font-mono text-blue-400">
              {speed.toFixed(2)}x
            </span>
          </div>
          <input
            type="range"
            min="0.25"
            max="4.0"
            step="0.05"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-neutral-500">
            <span>0.25x (lent)</span>
            <span>1.0x</span>
            <span>4.0x (rapide)</span>
          </div>
        </div>

        {/* Format */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-300">
            Format audio
          </label>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((f) => (
              <button
                key={f.value}
                onClick={() => setResponseFormat(f.value)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  responseFormat === f.value
                    ? "border-blue-500 bg-blue-500/10 text-white"
                    : "border-neutral-700 bg-neutral-900 text-neutral-400 hover:border-neutral-500 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Instructions (only for gpt-4o-mini-tts) */}
        {model === "gpt-4o-mini-tts" && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">
              Instructions vocales
            </label>
            <p className="text-xs text-neutral-500">
              Directives pour controler le style de la voix (ton, emotion,
              rythme...). Uniquement disponible avec le modele GPT-4o Mini TTS.
            </p>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ex: Parle avec un ton chaleureux et enthousiaste, comme un professeur passione..."
              rows={3}
              maxLength={4096}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-blue-500 resize-none"
            />
            <div className="text-xs text-neutral-500 text-right">
              {instructions.length}/4096
            </div>
          </div>
        )}

        {/* Test & Reset */}
        <div className="flex items-center gap-3 pt-4 border-t border-neutral-800">
          <button
            onClick={handleTest}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              ttsState === "playing"
                ? "bg-green-600 text-white animate-pulse"
                : ttsState === "loading"
                ? "bg-yellow-600 text-white"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {ttsState === "loading" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : ttsState === "playing" ? (
              <Square size={14} />
            ) : (
              <Volume2 size={16} />
            )}
            {ttsState === "loading"
              ? "Chargement..."
              : ttsState === "playing"
              ? "Arreter"
              : "Tester la voix"}
          </button>

          <button
            onClick={resetDefaults}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 text-sm transition-all"
          >
            <RotateCcw size={14} />
            Reinitialiser
          </button>
        </div>
      </section>
    </main>
  );
}
