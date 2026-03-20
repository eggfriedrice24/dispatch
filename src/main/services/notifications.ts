import { join } from "node:path";

import { BrowserWindow, Notification } from "electron";

/**
 * Main-process notification service.
 *
 * Uses Electron's Notification API so notifications display with the
 * correct app name ("Dispatch") and icon on all platforms.
 *
 * Clicking a notification focuses the window and navigates to the
 * relevant PR via the "navigate" IPC event.
 */

const NOTIFICATION_ICON = join(__dirname, "../../resources/notification-icon.png");

function showAndFocusWindow(win: BrowserWindow): void {
  if (win.isMinimized()) {
    win.restore();
  }
  if (!win.isVisible()) {
    win.show();
  }
  win.focus();
}

export function showDesktopNotification(args: {
  title: string;
  body: string;
  prNumber: number;
  workspace: string;
}): void {
  if (!Notification.isSupported()) {
    return;
  }

  const notification = new Notification({
    title: args.title,
    body: args.body,
    icon: NOTIFICATION_ICON,
    silent: false,
  });

  notification.on("click", () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      showAndFocusWindow(win);
      win.webContents.send("navigate", {
        view: "review",
        prNumber: args.prNumber,
        workspacePath: args.workspace,
      });
    }
  });

  notification.show();
}
