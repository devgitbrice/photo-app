import { create } from "zustand";

export type NewItemStatus =
  | "idle"
  | "observation"
  | "title"
  | "uploading"
  | "success"
  | "error";

type NewItemState = {
  // Data
  photo: File | null;
  observation: string;
  title: string;

  // Flow
  status: NewItemStatus;
  error: string | null;

  // Actions data
  setPhoto: (file: File | null) => void;
  setObservation: (value: string) => void;
  setTitle: (value: string) => void;

  // Actions flow
  setStatus: (status: NewItemStatus) => void;
  setError: (message: string | null) => void;

  resetAll: () => void;
};

export const useNewItemStore = create<NewItemState>((set) => ({
  // ─────────────────────────
  // Initial state
  // ─────────────────────────
  photo: null,
  observation: "",
  title: "",
  status: "idle",
  error: null,

  // ─────────────────────────
  // Data setters (NO flow change)
  // ─────────────────────────
  setPhoto: (file) =>
    set({
      photo: file,
      status: file ? "observation" : "idle",
    }),

  setObservation: (value) =>
    set({
      observation: value,
    }),

  setTitle: (value) =>
    set({
      title: value,
    }),

  // ─────────────────────────
  // Flow setters
  // ─────────────────────────
  setStatus: (status) => set({ status }),

  setError: (message) =>
    set({
      error: message,
      status: "error",
    }),

  // ─────────────────────────
  // Reset
  // ─────────────────────────
  resetAll: () =>
    set({
      photo: null,
      observation: "",
      title: "",
      status: "idle",
      error: null,
    }),
}));
