/**
 * Type declarations for the preload API exposed via contextBridge.
 */
export {};
declare global {
  interface ElectronApi {
    invoke(method: string, args: unknown): Promise<unknown>;
    setBadgeCount(count: number): void;
  }

  interface Window {
    api: ElectronApi;
  }
}
