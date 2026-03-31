import type { HandlerMap } from "./types";

import { BrowserWindow, dialog } from "electron";

import * as repo from "../db/repository";
import * as ghCli from "../services/gh-cli";
import * as gitCli from "../services/git-cli";

export const workspaceHandlers: Pick<
  HandlerMap,
  | "workspace.list"
  | "workspace.add"
  | "workspace.remove"
  | "workspace.active"
  | "workspace.setActive"
  | "workspace.pickFolder"
> = {
  "workspace.list": () => repo.getWorkspaces(),
  "workspace.add": async (args) => {
    const root = await gitCli.getRepoRoot(args.path);
    if (!root) {
      throw new Error(`"${args.path}" is not inside a git repository.`);
    }
    const name = root.split("/").pop() ?? root;
    repo.addWorkspace(root, name);
    return { path: root, name };
  },
  "workspace.remove": (args) => {
    repo.removeWorkspace(args.id);
  },
  "workspace.active": () => repo.getActiveWorkspace(),
  "workspace.setActive": async (args) => {
    repo.setActiveWorkspace(args.path);
    const saved = repo.getRepoAccount(args.path);
    if (!saved) {
      return;
    }

    const accounts = await ghCli.listAccounts();
    const active = accounts.find((account) => account.active);
    if (!active || (active.host === saved.host && active.login === saved.login)) {
      return;
    }

    const stillValid = accounts.some(
      (account) => account.host === saved.host && account.login === saved.login,
    );
    if (stillValid) {
      await ghCli.switchAccount(saved.host, saved.login);
    }
  },
  "workspace.pickFolder": async () => {
    const win = BrowserWindow.getFocusedWindow();
    const result = win
      ? await dialog.showOpenDialog(win, { properties: ["openDirectory"] })
      : await dialog.showOpenDialog({ properties: ["openDirectory"] });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0] ?? null;
  },
};
