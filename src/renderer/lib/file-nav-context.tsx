import type { ReactNode } from "react";

import { createContext, useCallback, useContext, useState } from "react";

/**
 * Shared state for file navigation between the sidebar file tree
 * and the PR detail diff viewer.
 */

interface FileNavContextValue {
  currentFileIndex: number;
  setCurrentFileIndex: (index: number) => void;
}

const FileNavContext = createContext<FileNavContextValue>({
  currentFileIndex: 0,
  setCurrentFileIndex: () => {},
});

export function FileNavProvider({ children }: { children: ReactNode }) {
  const [currentFileIndex, setCurrentFileIndexRaw] = useState(0);

  const setCurrentFileIndex = useCallback((index: number) => {
    setCurrentFileIndexRaw(index);
  }, []);

  return (
    <FileNavContext.Provider value={{ currentFileIndex, setCurrentFileIndex }}>
      {children}
    </FileNavContext.Provider>
  );
}

export function useFileNav() {
  return useContext(FileNavContext);
}
