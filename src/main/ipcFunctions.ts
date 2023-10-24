import Directories from "./Directories";
import NodeFunctions from "./NodeFunctions";
import { BrowserWindow } from "electron";
import AuthFunctions from "./AuthFunctions";

export function handleIpc(ipcMain: Electron.IpcMain, win: BrowserWindow) {
    const nf = new NodeFunctions(win);
    const auth = new AuthFunctions(win);

    ipcMain.handle("searchYt", (_, query: string, results: number = 3) =>
        nf.searchYouTube(query, results),
    );
    ipcMain.handle("ytInfoById", (_, id: string) => nf.youTubeInfoById(id));
    ipcMain.handle("getDominantColor", (_, imgUrl: string) =>
        nf.getDominantColor(imgUrl),
    );
    ipcMain.handle(
        "setPlatformPlaying",
        (_, value: boolean, darkTheme: boolean) =>
            nf.setPlatformPlaying(value, darkTheme),
    );
    ipcMain.handle("stopPlatformPlaying", (_) => nf.stopPlatformPlaying());
    ipcMain.handle("getOutputDirectory", (_) => nf.getOutputDirectory());
    ipcMain.handle("downloadAsJpg", (_, imgUrl: string) =>
        nf.downloadAsJpg(imgUrl),
    );
    ipcMain.handle("getVolumeStats", (_, trackFile: string) =>
        nf.getVolumeStats(trackFile),
    );
    ipcMain.handle("getDirectories", () => Directories);
    ipcMain.handle("setTheme", (_, theme: "dark" | "light") =>
        nf.setTheme(theme),
    );
    ipcMain.handle("updateYtdlp", () => nf.updateYtdlp());
    ipcMain.handle("minimizeWindow", () => win.minimize());
    ipcMain.handle("closeWindow", () => win.close());
    ipcMain.handle("toggleMaximize", () => nf.toggleMaximize());
    ipcMain.handle(
        "downloadYt",
        async (_, filename: string, tags: any, imageFile: string) =>
            nf.downloadYouTube(filename, tags, imageFile),
    );

    ipcMain.handle("checkFileExists", (_, filename: string) =>
        nf.checkFileExists(filename),
    );
    ipcMain.handle("copyIfExists", (_, fromPath: string, toDirectory: string) =>
        nf.copyIfExists(fromPath, toDirectory),
    );
    ipcMain.handle("copyFile", (_, from: string, to: string) =>
        nf.copyFile(from, to),
    );
    ipcMain.handle("deleteFile", (_, filename: string) =>
        nf.deleteFile(filename),
    );

    ipcMain.handle(
        "firstLogin",
        (
            _,
            spotifyAuth: {
                hasCredentials: boolean;
                clientId: string;
                requestedScopes: string;
                secret: string;
            },
        ) => auth.firstLogin(spotifyAuth),
    );
    ipcMain.handle("resetSpotifyLogin", () => auth.resetSpotifyLogin());
}
