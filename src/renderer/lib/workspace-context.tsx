import type { ReactNode } from "react";

import { createContext, useCallback, useContext, useState } from "react";

interface WorkspaceContextValue {
  /** Absolute path to the active git repository */
  cwd: string;
  /** Switch to a different workspace without reloading */
  switchWorkspace: (newCwd: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({
  cwd: initialCwd,
  children,
}: {
  cwd: string;
  children: ReactNode;
}) {
  const [cwd, setCwd] = useState(initialCwd);

  const switchWorkspace = useCallback((newCwd: string) => {
    setCwd(newCwd);
  }, []);

  return (
    <WorkspaceContext.Provider value={{ cwd, switchWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

/**
 * Access the active workspace. Must be used inside WorkspaceProvider.
 */
export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used inside WorkspaceProvider");
  }
  return ctx;
}
