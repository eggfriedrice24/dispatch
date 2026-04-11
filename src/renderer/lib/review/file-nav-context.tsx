import type {
  ReviewDiffMode,
  ReviewPanelTab,
  ReviewResumeSelectedCommit,
} from "@/shared/ipc/contracts/review";
import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";

/**
 * Shared state for file navigation and per-session review UI state
 * between the sidebar file tree and the PR detail diff viewer.
 */

export interface FileNavState {
  currentFileIndex: number;
  currentFilePath: string | null;
  selectedCommit: ReviewResumeSelectedCommit | null;
  diffMode: ReviewDiffMode;
  panelOpen: boolean;
  panelTab: ReviewPanelTab;
}

const DEFAULT_FILE_NAV_STATE: FileNavState = {
  currentFileIndex: 0,
  currentFilePath: null,
  selectedCommit: null,
  diffMode: "all",
  panelOpen: true,
  panelTab: "overview",
};

interface FileNavContextValue extends FileNavState {
  setCurrentFileIndex: (index: number) => void;
  setCurrentFilePath: (path: string | null) => void;
  setSelectedCommit: (commit: ReviewResumeSelectedCommit | null) => void;
  setDiffMode: (mode: ReviewDiffMode) => void;
  setPanelOpen: (open: boolean) => void;
  setPanelTab: (tab: ReviewPanelTab) => void;
}

const FileNavContext = createContext<FileNavContextValue>({
  ...DEFAULT_FILE_NAV_STATE,
  setCurrentFileIndex: () => {},
  setCurrentFilePath: () => {},
  setSelectedCommit: () => {},
  setDiffMode: () => {},
  setPanelOpen: () => {},
  setPanelTab: () => {},
});

export interface FileNavProviderProps {
  children: ReactNode;
  initialState?: Partial<FileNavState>;
  onStateChange?: (state: FileNavState) => void;
}

export function FileNavProvider({
  children,
  initialState,
  onStateChange,
}: FileNavProviderProps) {
  const [currentFileIndex, setCurrentFileIndexRaw] = useState<number>(
    initialState?.currentFileIndex ?? DEFAULT_FILE_NAV_STATE.currentFileIndex,
  );
  const [currentFilePath, setCurrentFilePathRaw] = useState<string | null>(
    initialState?.currentFilePath ?? DEFAULT_FILE_NAV_STATE.currentFilePath,
  );
  const [selectedCommit, setSelectedCommitRaw] = useState<ReviewResumeSelectedCommit | null>(
    initialState?.selectedCommit ?? DEFAULT_FILE_NAV_STATE.selectedCommit,
  );
  const [diffMode, setDiffMode] = useState<ReviewDiffMode>(
    initialState?.diffMode ?? DEFAULT_FILE_NAV_STATE.diffMode,
  );
  const [panelOpen, setPanelOpen] = useState(
    initialState?.panelOpen ?? DEFAULT_FILE_NAV_STATE.panelOpen,
  );
  const [panelTab, setPanelTab] = useState<ReviewPanelTab>(initialState?.panelTab ?? DEFAULT_FILE_NAV_STATE.panelTab);

  const setCurrentFileIndex = useCallback((index: number) => {
    setCurrentFileIndexRaw(index);
  }, []);

  const setCurrentFilePath = useCallback((path: string | null) => {
    setCurrentFilePathRaw(path);
  }, []);

  const setSelectedCommit = useCallback((commit: ReviewResumeSelectedCommit | null) => {
    setSelectedCommitRaw(commit);
    setCurrentFileIndexRaw(0);
  }, []);

  useEffect(() => {
    if (!onStateChange) {
      return;
    }

    onStateChange({
      currentFileIndex,
      currentFilePath,
      selectedCommit,
      diffMode,
      panelOpen,
      panelTab,
    });
  }, [currentFileIndex, currentFilePath, selectedCommit, diffMode, panelOpen, panelTab, onStateChange]);

  return (
    <FileNavContext.Provider
      value={{
        currentFileIndex,
        currentFilePath,
        selectedCommit,
        diffMode,
        panelOpen,
        panelTab,
        setCurrentFileIndex,
        setCurrentFilePath,
        setSelectedCommit,
        setDiffMode,
        setPanelOpen,
        setPanelTab,
      }}
    >
      {children}
    </FileNavContext.Provider>
  );
}

export function useFileNav() {
  return useContext(FileNavContext);
}

export { DEFAULT_FILE_NAV_STATE };
