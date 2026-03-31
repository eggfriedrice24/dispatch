import type { HandlerMap } from "./types";

import * as repo from "../db/repository";
import { showDesktopNotification } from "../services/notifications";

export const notificationHandlers: Pick<
  HandlerMap,
  | "notifications.list"
  | "notifications.markRead"
  | "notifications.markAllRead"
  | "notifications.insert"
  | "notifications.show"
> = {
  "notifications.list": (args) => repo.getNotifications(args.limit),
  "notifications.markRead": (args) => {
    repo.markNotificationRead(args.id);
  },
  "notifications.markAllRead": () => {
    repo.markAllNotificationsRead();
  },
  "notifications.insert": (args) => {
    repo.insertNotification(args);
  },
  "notifications.show": (args) => {
    repo.insertNotification(args);
    showDesktopNotification(args);
  },
};
