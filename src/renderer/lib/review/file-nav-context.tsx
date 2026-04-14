import type {
  ReviewDiffMode,
  ReviewPanelTab,
  ReviewResumeSelectedCommit,
} from "@/shared/ipc/contracts/review";

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

export interface FileNavState {
  currentFileIndex: number;
  currentFilePath: string | null;
  selectedCommit: ReviewResumeSelectedCommit | null;
  diffMode: ReviewDiffMode;
  panelOpen: boolean;
  panelTab: ReviewPanelTab;
}

export const DEFAULT_FILE_NAV_STATE: FileNavState = {
  currentFileIndex: 0,
  currentFilePath: null,
  selectedCommit: null,
  diffMode: "all",
  panelOpen: true,
  panelTab: "overview",
};

interface FileNavStore extends FileNavState {
  setCurrentFileIndex: (index: number) => void;
  setCurrentFilePath: (path: string | null) => void;
  setSelectedCommit: (commit: ReviewResumeSelectedCommit | null) => void;
  setDiffMode: (mode: ReviewDiffMode) => void;
  setPanelOpen: (open: boolean) => void;
  setPanelTab: (tab: ReviewPanelTab) => void;
  reset: (initialState?: Partial<FileNavState>) => void;
  getSnapshot: () => FileNavState;
}

export const useFileNavStore = create<FileNavStore>()((set, get) => ({
  ...DEFAULT_FILE_NAV_STATE,

  setCurrentFileIndex: (index) => set({ currentFileIndex: index }),
  setCurrentFilePath: (path) => set({ currentFilePath: path }),
  setSelectedCommit: (commit) => set({ selectedCommit: commit, currentFileIndex: 0 }),
  setDiffMode: (mode) => set({ diffMode: mode }),
  setPanelOpen: (open) => set({ panelOpen: open }),
  setPanelTab: (tab) => set({ panelTab: tab }),

  reset: (initialState) => {
    set({ ...DEFAULT_FILE_NAV_STATE, ...initialState });
  },

  getSnapshot: () => {
    const s = get();
    return {
      currentFileIndex: s.currentFileIndex,
      currentFilePath: s.currentFilePath,
      selectedCommit: s.selectedCommit,
      diffMode: s.diffMode,
      panelOpen: s.panelOpen,
      panelTab: s.panelTab,
    };
  },
}));

export function useFileNav() {
  return useFileNavStore(
    useShallow((s) => ({
      currentFileIndex: s.currentFileIndex,
      currentFilePath: s.currentFilePath,
      selectedCommit: s.selectedCommit,
      diffMode: s.diffMode,
      panelOpen: s.panelOpen,
      panelTab: s.panelTab,
      setCurrentFileIndex: s.setCurrentFileIndex,
      setCurrentFilePath: s.setCurrentFilePath,
      setSelectedCommit: s.setSelectedCommit,
      setDiffMode: s.setDiffMode,
      setPanelOpen: s.setPanelOpen,
      setPanelTab: s.setPanelTab,
    })),
  );
}
