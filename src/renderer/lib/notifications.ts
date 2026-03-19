/**
 * Desktop notification helper.
 *
 * Uses the Web Notification API which Electron supports natively.
 * Shows native macOS/Windows notifications.
 */
export function sendNotification(title: string, body: string): void {
  if (Notification.permission === "granted") {
    void new Notification(title, { body, silent: false });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission()
      .then((permission) => {
        if (permission === "granted") {
          void new Notification(title, { body, silent: false });
        }
      })
      .catch(() => {
        // Permission request failed — no notification
      });
  }
}
