/* eslint-disable vitest/prefer-import-in-mock -- These local mocks keep the keyboard regression test focused on the home view behavior. */
import "@testing-library/jest-dom/vitest";
import type { IpcApi } from "@/shared/ipc";

import { HomeView } from "@/renderer/components/inbox/home-view";
import { ipc } from "@/renderer/lib/app/ipc";
import { queryClient } from "@/renderer/lib/app/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

const { navigateMock, switchWorkspaceMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  switchWorkspaceMock: vi.fn(),
}));

vi.mock("@/renderer/lib/app/ipc", () => ({
  ipc: vi.fn(),
}));

vi.mock("@/renderer/lib/app/router", () => ({
  useRouter: () => ({
    navigate: navigateMock,
  }),
}));

vi.mock("@/renderer/lib/app/workspace-context", () => ({
  useWorkspace: () => ({
    cwd: "/repo/dispatch",
    nwo: "acme/dispatch",
    repo: "dispatch",
    repoTarget: { cwd: "/repo/dispatch", owner: "acme", repo: "dispatch" },
    switchWorkspace: switchWorkspaceMock,
  }),
}));

vi.mock("@/renderer/lib/keyboard/keybinding-context", () => ({
  useKeybindings: () => ({
    getBinding: (id: string) => {
      switch (id) {
        case "navigation.prevPr": {
          return { key: "j" };
        }
        case "navigation.nextPr": {
          return { key: "k" };
        }
        case "navigation.openPr": {
          return { key: "Enter" };
        }
        case "search.focusSearch": {
          return { key: "/" };
        }
        default: {
          return { key: "" };
        }
      }
    },
  }),
}));

vi.mock("@/renderer/components/inbox/search-autocomplete", () => ({
  SearchAutocomplete: () => null,
  SearchHelpPopover: () => null,
}));

vi.mock("@/renderer/components/inbox/search-presets", () => ({
  SearchPresetChips: () => null,
}));

vi.mock("@/renderer/components/shared/add-repo-dialog", () => ({
  AddRepoDialog: () => null,
}));

const mockPullRequest = {
  number: 101,
  title: "Fix keyboard navigation on the home queue",
  state: "OPEN" as const,
  author: { login: "alice", name: "Alice" },
  headRefName: "fix/home-enter",
  baseRefName: "main",
  reviewDecision: "REVIEW_REQUIRED",
  updatedAt: "2026-04-15T09:00:00.000Z",
  url: "https://example.com/pull/101",
  isDraft: false,
  additions: 12,
  deletions: 4,
  workspace: "dispatch",
  workspacePath: "/repo/dispatch",
  repository: "acme/dispatch",
  pullRequestRepository: "acme/dispatch",
  isForkWorkspace: false,
};

function renderHomeView() {
  return render(
    <QueryClientProvider client={queryClient}>
      <HomeView />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  navigateMock.mockReset();
  switchWorkspaceMock.mockReset();
  queryClient.clear();

  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      clear: () => storage.clear(),
      getItem: (key: string) => storage.get(key) ?? null,
      removeItem: (key: string) => {
        storage.delete(key);
      },
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
    },
  });

  vi.mocked(ipc).mockImplementation(((method: keyof IpcApi) => {
    switch (method) {
      case "preferences.get": {
        return Promise.resolve(null);
      }
      case "env.user": {
        return Promise.resolve({
          login: "reviewer",
          avatarUrl: "https://example.com/avatar.png",
          name: "Reviewer",
        });
      }
      case "repo.info": {
        return Promise.resolve({
          nameWithOwner: "acme/dispatch",
          isFork: false,
          parent: null,
          canPush: true,
          hasMergeQueue: false,
          defaultBranch: "main",
        });
      }
      case "pr.listAll": {
        return Promise.resolve([mockPullRequest]);
      }
      case "prActivity.list": {
        return Promise.resolve([]);
      }
      case "workspace.list": {
        return Promise.resolve([
          {
            id: 1,
            owner: "acme",
            repo: "dispatch",
            path: "/repo/dispatch",
            name: "dispatch",
            addedAt: "2026-04-01T00:00:00.000Z",
          },
        ]);
      }
      case "prActivity.markSeen": {
        return Promise.resolve();
      }
      case "workspace.setActive": {
        return Promise.resolve();
      }
      default: {
        throw new Error(`Unexpected IPC call in HomeView test: ${method}`);
      }
    }
  }) as typeof ipc);
});

describe("HomeView keyboard navigation", () => {
  it.each([
    { keySequence: "j", label: "vim navigation" },
    { keySequence: "{ArrowDown}", label: "ArrowDown" },
    { keySequence: "{ArrowUp}", label: "ArrowUp" },
  ])(
    "moves focus via $label so Enter opens the selected PR instead of refreshing the queue",
    async ({ keySequence }) => {
      const user = userEvent.setup();

      renderHomeView();

      const refreshButton = await screen.findByRole("button", {
        name: /refresh homepage pull requests/i,
      });
      const pullRequestButton = await screen.findByRole("button", {
        name: /fix keyboard navigation on the home queue/i,
      });

      refreshButton.focus();
      expect(refreshButton).toHaveFocus();

      await user.keyboard(keySequence);

      await waitFor(() => {
        expect(pullRequestButton).toHaveFocus();
      });

      const listAllCallCount = vi
        .mocked(ipc)
        .mock.calls.filter(([method]) => method === "pr.listAll").length;

      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(navigateMock).toHaveBeenCalledWith({ view: "review", prNumber: 101 });
      });

      expect(vi.mocked(ipc).mock.calls.filter(([method]) => method === "pr.listAll")).toHaveLength(
        listAllCallCount,
      );
    },
  );
});
