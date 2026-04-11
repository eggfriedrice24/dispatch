import { createContext, useContext, useState } from "react";

interface CommandPaletteState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CommandPaletteContext = createContext<CommandPaletteState>({
  open: false,
  setOpen: () => {},
});

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette(): CommandPaletteState {
  return useContext(CommandPaletteContext);
}
