import { create } from "zustand";

type NewItemState = {
  photo: File | null;
  setPhoto: (file: File | null) => void;
  reset: () => void;
};

export const useNewItemStore = create<NewItemState>((set) => ({
  photo: null,
  setPhoto: (file) => set({ photo: file }),
  reset: () => set({ photo: null }),
}));
