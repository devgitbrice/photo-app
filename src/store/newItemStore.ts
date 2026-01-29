import { create } from "zustand";

export type NewItemStatus =
  | "idle"
  | "observation"
  | "title"
  | "uploading"
  | "success"
  | "error";

export type MultiCaptureStatus =
  | "idle"
  | "capturing"
  | "observation"
  | "title"
  | "uploading"
  | "success"
  | "error";

type NewItemState = {
  // Data (single image)
  photo: File | null;
  observation: string;
  title: string;

  // Data (multi-image)
  photos: File[];
  isMultiMode: boolean;
  multiStatus: MultiCaptureStatus;
  currentUploadIndex: number;

  // Flow
  status: NewItemStatus;
  error: string | null;

  // Actions data (single)
  setPhoto: (file: File | null) => void;
  setObservation: (value: string) => void;
  setTitle: (value: string) => void;

  // Actions data (multi)
  setMultiMode: (enabled: boolean) => void;
  addPhoto: (file: File) => void;
  removePhoto: (index: number) => void;
  clearPhotos: () => void;
  setMultiStatus: (status: MultiCaptureStatus) => void;
  setCurrentUploadIndex: (index: number) => void;

  // Actions flow
  setStatus: (status: NewItemStatus) => void;
  setError: (message: string | null) => void;

  resetAll: () => void;
};

const MAX_PHOTOS = 10;

export const useNewItemStore = create<NewItemState>((set, get) => ({
  // ─────────────────────────
  // Initial state
  // ─────────────────────────
  photo: null,
  observation: "",
  title: "",
  status: "idle",
  error: null,

  // Multi-image state
  photos: [],
  isMultiMode: false,
  multiStatus: "idle",
  currentUploadIndex: 0,

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
  // Multi-image setters
  // ─────────────────────────
  setMultiMode: (enabled) =>
    set({
      isMultiMode: enabled,
      multiStatus: enabled ? "capturing" : "idle",
      photos: enabled ? [] : get().photos,
    }),

  addPhoto: (file) => {
    const currentPhotos = get().photos;
    if (currentPhotos.length >= MAX_PHOTOS) return;
    set({ photos: [...currentPhotos, file] });
  },

  removePhoto: (index) => {
    const currentPhotos = get().photos;
    set({ photos: currentPhotos.filter((_, i) => i !== index) });
  },

  clearPhotos: () => set({ photos: [] }),

  setMultiStatus: (multiStatus) => set({ multiStatus }),

  setCurrentUploadIndex: (index) => set({ currentUploadIndex: index }),

  // ─────────────────────────
  // Flow setters
  // ─────────────────────────
  setStatus: (status) => set({ status }),

  setError: (message) =>
    set({
      error: message,
      status: "error",
      multiStatus: "error",
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
      photos: [],
      isMultiMode: false,
      multiStatus: "idle",
      currentUploadIndex: 0,
    }),
}));
