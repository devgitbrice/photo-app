"use client";

import { create } from "zustand";

export type TTSVoice =
  | "alloy"
  | "ash"
  | "ballad"
  | "coral"
  | "echo"
  | "fable"
  | "onyx"
  | "nova"
  | "sage"
  | "shimmer"
  | "verse";

export type TTSModel = "tts-1" | "tts-1-hd" | "gpt-4o-mini-tts";

export type TTSFormat = "mp3" | "opus" | "aac" | "flac" | "wav" | "pcm";

export interface TTSSettings {
  voice: TTSVoice;
  model: TTSModel;
  speed: number; // 0.25 to 4.0
  responseFormat: TTSFormat;
  instructions: string;
}

interface TTSSettingsState extends TTSSettings {
  setVoice: (voice: TTSVoice) => void;
  setModel: (model: TTSModel) => void;
  setSpeed: (speed: number) => void;
  setResponseFormat: (format: TTSFormat) => void;
  setInstructions: (instructions: string) => void;
  resetDefaults: () => void;
}

const STORAGE_KEY = "tts-settings";

const DEFAULT_SETTINGS: TTSSettings = {
  voice: "nova",
  model: "gpt-4o-mini-tts",
  speed: 1.0,
  responseFormat: "mp3",
  instructions: "",
};

function loadSettings(): TTSSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // ignore parse errors
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: TTSSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage errors
  }
}

export const useTTSSettingsStore = create<TTSSettingsState>((set, get) => ({
  ...loadSettings(),

  setVoice: (voice) => {
    set({ voice });
    saveSettings({ ...get(), voice });
  },

  setModel: (model) => {
    set({ model });
    saveSettings({ ...get(), model });
  },

  setSpeed: (speed) => {
    const clamped = Math.min(4.0, Math.max(0.25, speed));
    set({ speed: clamped });
    saveSettings({ ...get(), speed: clamped });
  },

  setResponseFormat: (responseFormat) => {
    set({ responseFormat });
    saveSettings({ ...get(), responseFormat });
  },

  setInstructions: (instructions) => {
    set({ instructions });
    saveSettings({ ...get(), instructions });
  },

  resetDefaults: () => {
    set(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
  },
}));
