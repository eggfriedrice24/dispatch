import { contextBridge, ipcRenderer } from "electron";

/**
 * Expose a safe, typed API to the renderer process.
 *
 * Access in the renderer via `window.api`.
 */
contextBridge.exposeInMainWorld("api", {
  /**
   * Send a one-way message to the main process.
   */
  send(channel: string, ...args: unknown[]): void {
    ipcRenderer.send(channel, ...args);
  },

  /**
   * Send a message and await a response from the main process.
   */
  invoke(channel: string, ...args: unknown[]): Promise<unknown> {
    return ipcRenderer.invoke(channel, ...args);
  },

  /**
   * Subscribe to messages from the main process.
   * Returns an unsubscribe function.
   */
  on(channel: string, callback: (...args: unknown[]) => void): () => void {
    const listener = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => {
      callback(...args);
    };

    ipcRenderer.on(channel, listener);

    return () => {
      ipcRenderer.removeListener(channel, listener);
    };
  },
});
