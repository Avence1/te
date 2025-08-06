import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";

import { EventNameEnum } from "../const";

if (started) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    frame: false,
    transparent: true,
    hasShadow: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "../assets/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.setAlwaysOnTop(true);

  // mainWindow.setIgnoreMouseEvents(true);

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }
};

const handleAppReady = () => {
  ipcMain.handle(
    EventNameEnum.GetPathList,
    (e: Electron.IpcMainInvokeEvent, animFolder: string) => {
      console.log(animFolder, app.getAppPath(), "ddd==ddd");
    }
  );

  ipcMain.on(EventNameEnum.IgnoreMouseEvent, (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.setIgnoreMouseEvents(ignore, options);
    console.log(ignore, options);
  });

  createWindow();
};

app.whenReady().then(() => {
  handleAppReady();

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
