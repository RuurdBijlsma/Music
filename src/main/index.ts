import { app, BrowserWindow, ipcMain, session } from "electron";
import { join } from "path";
import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import icon from "../../resources/app-icon/dark-500.png?asset";
import { handleIpc } from "./ipcFunctions";

function createWindow(): void {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        title: "Ruurd Music",
        icon,
        width: 1400,
        height: 930,
        minWidth: 521,
        minHeight: 640,
        autoHideMenuBar: true,
        show: false,
        titleBarStyle: "hidden",
        webPreferences: {
            preload: join(__dirname, "../preload/index.js"),
            sandbox: false,
            webSecurity: false,
        },
    });

    mainWindow.on("ready-to-show", () => {
        mainWindow.show();
    });

    mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

    let isDev = is.dev && process.env["ELECTRON_RENDERER_URL"];
    const url = isDev
        ? process.env["ELECTRON_RENDERER_URL"] ?? ""
        : "file:///" + join(__dirname, "../renderer/index.html");

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    mainWindow.loadURL(url).then();
    if (isDev) mainWindow.webContents.openDevTools();

    handleIpc(ipcMain, mainWindow);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    session.defaultSession.webRequest.onBeforeSendHeaders(
        (details, callback) => {
            if (details.url.includes("tools.keycdn.com/geo.json")) {
                details.requestHeaders["User-Agent"] =
                    "keycdn-tools:https://github.com/RuurdBijlsma/Music";
            }
            // Continue the request with the modified headers
            callback({ cancel: false, requestHeaders: details.requestHeaders });
        },
    );

    // Set app user model id for windows
    electronApp.setAppUserModelId("dev.ruurd.music");

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    app.on("browser-window-created", (_, window) => {
        optimizer.watchWindowShortcuts(window);
        optimizer.registerFramelessWindowIpc();
    });

    createWindow();

    app.on("activate", function () {
        // On macOS, it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
