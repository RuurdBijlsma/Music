import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

// Custom APIs for renderer
const api = {
    searchYt: (query: string, results: number = 3) =>
        ipcRenderer.invoke("searchYt", query, results),
    ytInfoById: (id: string) => ipcRenderer.invoke("ytInfoById", id),
    getDominantColor: (imgUrl: string) =>
        ipcRenderer.invoke("getDominantColor", imgUrl),
    setPlatformPlaying: (value: boolean, darkTheme: boolean) =>
        ipcRenderer.invoke("setPlatformPlaying", value, darkTheme),
    stopPlatformPlaying: () => ipcRenderer.invoke("stopPlatformPlaying"),
    getOutputDirectory: () => ipcRenderer.invoke("getOutputDirectory"),
    downloadAsJpg: (imgUrl: string) =>
        ipcRenderer.invoke("downloadAsJpg", imgUrl),
    getVolumeStats: (trackFile: string) =>
        ipcRenderer.invoke("getVolumeStats", trackFile),
    getDirectories: () => ipcRenderer.invoke("getDirectories"),
    setTheme: (theme: "dark" | "light") =>
        ipcRenderer.invoke("setTheme", theme),
    downloadYt: (filename: string, tags: any, imageFile: string) =>
        ipcRenderer.invoke("downloadYt", filename, tags, imageFile),
    updateYtdlp: () => ipcRenderer.invoke("updateYtdlp"),

    checkFileExists: (filename: string) =>
        ipcRenderer.invoke("checkFileExists", filename),
    deleteFile: (filename: string) =>
        ipcRenderer.invoke("deleteFile", filename),
    copyIfExists: (fromPath: string, toDirectory: string) =>
        ipcRenderer.invoke("copyIfExists", fromPath, toDirectory),
    copyFile: (from: string, to: string) =>
        ipcRenderer.invoke("copyFile", from, to),
    checkTracksDownloaded: (filenames: string[]) =>
        ipcRenderer.invoke("checkTracksDownloaded", filenames),

    firstLogin: (spotifyAuth: {
        hasCredentials: boolean;
        clientId: string;
        requestedScopes: string;
        secret: string;
    }) => ipcRenderer.invoke("firstLogin", spotifyAuth),
    resetSpotifyLogin: () => ipcRenderer.invoke("resetSpotifyLogin"),

    minimizeWindow: () => ipcRenderer.send("win:invoke", "min"),
    toggleMaximize: () => ipcRenderer.send("win:invoke", "max"),
    closeWindow: () => ipcRenderer.send("win:invoke", "close"),
};

const listeners = new Map<string, Array<Function>>();

const events = {
    on(channel: string, func: Function) {
        if (!listeners.has(channel)) listeners.set(channel, []);
        let functions = listeners.get(channel);
        if (functions === undefined || functions.includes(func)) return;
        functions.push(func);
    },
    off(channel: string, func: Function) {
        if (!listeners.has(channel)) return;
        let functions = listeners.get(channel);
        if (functions === undefined) return;
        let index = functions.indexOf(func);
        if (index === -1) return;
        functions.splice(index, 1);
    },
    emit(channel, ...args) {
        if (!listeners.has(channel)) return;
        let functions = listeners.get(channel);
        if (functions === undefined) return;
        functions.forEach((f) => f(...args));
    },
};
ipcRenderer.on("toggleFavorite", () => events.emit("toggleFavorite"));
ipcRenderer.on("play", () => events.emit("play"));
ipcRenderer.on("pause", () => events.emit("pause"));
ipcRenderer.on("skip", (_, n: number) => events.emit("skip", n));
ipcRenderer.on(
    "progress",
    (_, data: { filename: string; progress: { percent: number } }) =>
        events.emit(data.filename + "progress", data.progress.percent),
);

// Use `contextBridge` APIs to expose Electron APIs to renderer
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld("electron", electronAPI);
        contextBridge.exposeInMainWorld("api", api);
        contextBridge.exposeInMainWorld("events", events);
    } catch (error) {
        console.error(error);
    }
}
