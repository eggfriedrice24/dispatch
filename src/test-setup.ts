/* eslint-disable jest/no-hooks, jest/require-top-level-describe, jest/no-untyped-mock-factory, unicorn/prefer-global-this, vitest/prefer-import-in-mock -- This file is a shared Vitest setup module, not an executable test suite. */
/// <reference types="vite-plus/test/globals" />
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { afterEach, vi } from "vite-plus/test";

// Mock the IPC layer for component tests
vi.mock("./renderer/lib/ipc", () => ({
  ipc: vi.fn(),
}));

// Mock window.api for Electron preload bridge
const apiMock = {
  invoke: vi.fn(),
  setBadgeCount: vi.fn(),
  onNavigate: vi.fn(() => () => {}),
  onAnalyticsTrack: vi.fn(() => () => {}),
  onWindowStateChange: vi.fn(() => () => {}),
};

Object.defineProperty(globalThis, "api", {
  value: apiMock,
  writable: true,
});

Object.defineProperty(window, "api", {
  value: apiMock,
  writable: true,
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
