import Directories from './Directories'
import NodeFunctions from './NodeFunctions'
import { BrowserWindow } from 'electron'
import AuthFunctions from './AuthFunctions'

export function handleIpc(ipcMain: Electron.IpcMain, win: BrowserWindow) {
    const nf = new NodeFunctions(win)
    const auth = new AuthFunctions(win)

    ipcMain.handle('ytInfoById', (_, id: string) => nf.youTubeInfoById(id))
    ipcMain.handle('getDominantColor', (_, imgUrl: string) => nf.getDominantColor(imgUrl))
    ipcMain.handle('setPlatformPlaying', (_, value: boolean, darkTheme: boolean) =>
        nf.setPlatformPlaying(value, darkTheme)
    )
    ipcMain.handle('stopPlatformPlaying', (_) => nf.stopPlatformPlaying())
    ipcMain.handle('getOutputDirectory', (_) => nf.getOutputDirectory())
    ipcMain.handle(
        'getSaveFilePath',
        (_, filename?: string, buttonLabel = 'Save', filterJson = true) =>
            nf.getSaveFilePath(filename, buttonLabel, filterJson)
    )
    ipcMain.handle('getOpenFilePath', (_, buttonLabel = 'Save', filterJson = true) =>
        nf.getOpenFilePath(buttonLabel, filterJson)
    )
    ipcMain.handle('downloadAsJpg', (_, imgUrl: string) => nf.downloadAsJpg(imgUrl))
    ipcMain.handle('getVolumeStats', (_, trackFile: string) => nf.getVolumeStats(trackFile))
    ipcMain.handle('getDirectories', () => Directories)
    ipcMain.handle('setTheme', (_, theme: 'dark' | 'light') => nf.setTheme(theme))
    ipcMain.handle('updateYtdlp', () => nf.updateYtdlp())
    ipcMain.handle(
        'downloadYt',
        async (_, id: string, outPath: string, tags: any, imageFile: string) =>
            nf.downloadYouTube(id, outPath, tags, imageFile)
    )
    ipcMain.handle('searchYtdlp', async (_, query: string, limit: number) =>
        nf.searchYtdlp(query, limit)
    )

    ipcMain.handle('fileSize', (_, file: string) => nf.fileSize(file))
    ipcMain.handle('checkFileExists', (_, file: string) => nf.checkFileExists(file))
    ipcMain.handle('copyIfExists', (_, fromPath: string, toDirectory: string) =>
        nf.copyIfExists(fromPath, toDirectory)
    )
    ipcMain.handle('copyFile', (_, from: string, to: string) => nf.copyFile(from, to))
    ipcMain.handle('deleteFile', (_, file: string) => nf.deleteFile(file))
    ipcMain.handle('checkTracksDownloaded', (_, filenames: string[]) =>
        nf.checkTracksDownloaded(filenames)
    )
    ipcMain.handle('saveStringToFile', (_, file: string, contents: string) =>
        nf.saveStringToFile(file, contents)
    )
    ipcMain.handle('getFileContents', (_, file: string) => nf.getFileContents(file))
    ipcMain.handle('downloadFile', (_, url: string, file: string) => nf.downloadFile(url, file))
    ipcMain.handle('getAppVersion', (_) => nf.getAppVersion())
    ipcMain.handle('setMusicFolder', (_, folder: string) => nf.setMusicFolder(folder))

    ipcMain.handle(
        'firstLogin',
        (
            _,
            spotifyAuth: {
                hasCredentials: boolean
                clientId: string
                requestedScopes: string
                secret: string
            }
        ) => auth.firstLogin(spotifyAuth)
    )
    ipcMain.handle('resetSpotifyLogin', () => auth.resetSpotifyLogin())
}
