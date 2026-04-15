import { contextBridge, ipcRenderer } from "electron";

import {
  AI_REWRITE_SELECTION_CHANNEL,
  ANALYTICS_CHANNEL,
  BADGE_COUNT_CHANNEL,
  IPC_CHANNEL,
  WINDOW_STATE_CHANNEL,
  type WindowState,
} from "../shared/ipc";

/**
 * Expose a minimal, safe API to the renderer process.
 * Access via `window.api`.
 */
contextBridge.exposeInMainWorld("api", {
  /**
   * Call a typed IPC method on the main process.
   */
  invoke(method: string, args: unknown): Promise<unknown> {
    return ipcRenderer.invoke(IPC_CHANNEL, { method, args });
  },

  /**
   * Update the dock badge count (macOS).
   */
  setBadgeCount(count: number): void {
    if (typeof count !== "number" || !Number.isInteger(count) || count < 0) {
      return;
    }
    ipcRenderer.send(BADGE_COUNT_CHANNEL, count);
  },

  /**
   * Listen for navigation events from main process (tray menu clicks).
   * Returns a cleanup function to remove the listener.
   */
  onNavigate(
    callback: (route: { view: string; prNumber?: number; workspacePath?: string }) => void,
  ): () => void {
    const handler = (
      _event: Electron.IpcRendererEvent,
      route: { view: string; prNumber?: number; workspacePath?: string },
    ) => {
      callback(route);
    };
    ipcRenderer.on("navigate", handler);
    return () => {
      ipcRenderer.removeListener("navigate", handler);
    };
  },

  /**
   * Listen for analytics events sent from the main process.
   * Returns a cleanup function to remove the listener.
   */
  onAnalyticsTrack(
    callback: (payload: {
      event: string;
      properties?: Record<string, string | number | boolean>;
    }) => void,
  ): () => void {
    const handler = (
      _event: Electron.IpcRendererEvent,
      payload: { event: string; properties?: Record<string, string | number | boolean> },
    ) => {
      callback(payload);
    };
    ipcRenderer.on(ANALYTICS_CHANNEL, handler);
    return () => {
      ipcRenderer.removeListener(ANALYTICS_CHANNEL, handler);
    };
  },

  onAiRewriteSelection(callback: () => void): () => void {
    const handler = () => {
      callback();
    };
    ipcRenderer.on(AI_REWRITE_SELECTION_CHANNEL, handler);
    return () => {
      ipcRenderer.removeListener(AI_REWRITE_SELECTION_CHANNEL, handler);
    };
  },

  onWindowStateChange(callback: (state: WindowState) => void): () => void {
    const handler = (_event: Electron.IpcRendererEvent, state: WindowState) => {
      callback(state);
    };
    ipcRenderer.on(WINDOW_STATE_CHANNEL, handler);
    return () => {
      ipcRenderer.removeListener(WINDOW_STATE_CHANNEL, handler);
    };
  },
});
