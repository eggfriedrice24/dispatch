import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

interface CommandPaletteState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useCommandPaletteStore = create<CommandPaletteState>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

export function useCommandPalette(): CommandPaletteState {
  return useCommandPaletteStore(useShallow((s) => s));
}
