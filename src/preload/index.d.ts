import {ElectronAPI} from "@electron-toolkit/preload";
import {AuthToken} from "../renderer/src/store/spotify-auth";
import {ipcRenderer} from "electron";

declare global {
    interface Window {
        electron: ElectronAPI;
        api: {
            ytInfoById: (id: string) => Promise<any>,
            searchYtdlp: (query: string,limit:number) => Promise<any>,
            getDominantColor: (imgUrl: string) => Promise<any>,
            setPlatformPlaying: (value: boolean, darkTheme: boolean) => Promise<any>,
            stopPlatformPlaying: () => Promise<any>,
            getOutputDirectory: () => Promise<any>,
            downloadAsJpg: (imgUrl: string) => Promise<any>,
            getVolumeStats: (trackFile: string) => Promise<any>,
            getDirectories: () => Promise<any>,
            setTheme: (theme: "dark" | "light") => Promise<any>,
            minimizeWindow: () => Promise<any>,
            toggleMaximize: () => Promise<any>,
            closeWindow: () => Promise<any>,
            downloadYt: (id: string, outPath: string, tags: any, imageFile: string) => Promise<any>,
            updateYtdlp: () => Promise<string>,
            checkTracksDownloaded: (filenames: string[]) => Promise<boolean>,

            fileSize: (file: string) => Promise<number>,
            checkFileExists: (filename: string) => Promise<any>,
            deleteFile: (filename: string) => Promise<any>,
            copyIfExists: (fromPath: string, toDirectory: string) => Promise<any>,
            copyFile: (from: string, to: string) => Promise<any>,
            firstLogin: (spotifyAuth: {
                hasCredentials: boolean,
                clientId: string,
                requestedScopes: string,
                secret: string,
            }) => Promise<AuthToken>,
            resetSpotifyLogin: () => Promise<any>,
        };
        events: EventEmitter,
    }
}
