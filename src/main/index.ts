import { join } from "node:path";

import { type BrowserWindowConstructorOptions, app, BrowserWindow } from "electron";

const WINDOW_CONFIG: BrowserWindowConstructorOptions = {
  width: 1200,
  height: 800,
  minWidth: 800,
  minHeight: 600,
  show: false,
  webPreferences: {
    preload: join(__dirname, "../preload/index.mjs"),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
  },
};

function createWindow(): BrowserWindow {
  const win = new BrowserWindow(WINDOW_CONFIG);

  win.once("ready-to-show", () => {
    win.show();
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(join(__dirname, "../dist/index.html"));
  }

  return win;
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

process.on("message", (msg) => {
  if (msg === "electron-vite&type=hot-reload") {
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.reload();
    }
  }
});
