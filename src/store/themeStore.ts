"use client";

import { create } from "zustand";

export type DocTheme = "dark" | "light";

interface ThemeState {
  theme: DocTheme;
  toggleTheme: () => void;
}

const STORAGE_KEY = "doc-theme";

function loadTheme(): DocTheme {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // ignore
  }
  return "dark";
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: loadTheme(),

  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    set({ theme: next });
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  },
}));
