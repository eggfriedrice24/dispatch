/**
 * Type declarations for the preload API exposed via contextBridge.
 */
interface ElectronApi {
  send(channel: string, ...args: unknown[]): void;
  invoke(channel: string, ...args: unknown[]): Promise<unknown>;
  on(channel: string, callback: (...args: unknown[]) => void): () => void;
}

interface Window {
  api: ElectronApi;
}
