import path from "path";
import Directories from "./Directories";
import {join} from "node:path";
import fs from "fs/promises";
import {nativeImage} from 'electron'
import type {BrowserWindow} from 'electron'
import NodeFunctions from './nodeFunctions'

export default class IpcFunctions {
    constructor(ipcMain: Electron.IpcMain, win: BrowserWindow) {
        console.log("Registering handles")
        const nf = new NodeFunctions(win)
        // Main process
        ipcMain.handle('getDirectories', () => Directories)
        ipcMain.handle('enableDevTools', () => {
            console.log("Open dev tools", win, win?.webContents);
            win?.webContents?.openDevTools()
        })

        let lightIcon = nativeImage.createFromPath(join(process.env.PUBLIC ?? './public', 'icon/new-light-500.png'))
        let darkIcon = nativeImage.createFromPath(join(process.env.PUBLIC ?? './public', 'icon/new-dark-500.png'))
        ipcMain.handle('setTheme', (_, theme: 'dark' | 'light') => {
            if (theme === 'dark')
                win?.setIcon(darkIcon)
            if (theme === 'light')
                win?.setIcon(lightIcon)
        })
        ipcMain.handle('minimizeWindow', () => {
            win?.minimize()
        })
        ipcMain.handle('closeWindow', () => {
            win?.close()
        })
        ipcMain.handle('toggleMaximizeWindow', () => {
            if (win?.isMaximized()) {
                win?.unmaximize()
                return false
            } else {
                win?.maximize()
                return true
            }
        })

        ipcMain.handle('downloadYt', async (_, filename: string, tags: any, image: string) => {
            console.log({filename})
            const isYouTubeTrack = tags.id !== undefined
            const ytId = tags.id
            let time = performance.now()
            let artistsString = tags.artist.join(', ')
            let query = `${artistsString} - ${tags.title}`
            let imageFile = path.join(Directories.temp, `image-${Math.random()}.jpg`);
            // noinspection ES6MissingAwait
            let promises = [isYouTubeTrack ? nf.downloadYtById(ytId, filename) : nf.downloadYtByQuery(query, filename)]
            if (image !== '')
                promises.push(nf.downloadFile(image, imageFile))
            let outPaths = await Promise.all(promises)
            let middleOut = path.join(Directories.temp, filename + '.mp3')
            let finalOut = path.join(Directories.music, filename + '.mp3')

            delete tags.id
            // convert to mp3 and add metadata
            await nf.ffmpegMetadata(outPaths[0].outPath, middleOut, imageFile, tags)
            console.log(`Time cost: ${performance.now() - time}ms`)

            // clean up
            await fs.rename(middleOut, finalOut)
            fs.unlink(outPaths[0].outPath).then()
            if (image !== '')
                fs.unlink(imageFile).then();

            console.log("ID HERE IS", outPaths[0].id)
            return {outPath: finalOut, id: outPaths[0].id}
        })

        ipcMain.handle('searchYt', async (_, query: string, results: number = 3) => nf.searchYouTube(query, results))

        ipcMain.handle("getDominantColor", (_, imgUrl: string) => nf.getDominantColor(imgUrl))
        ipcMain.handle("setPlatformPlaying", (_, value: boolean, darkTheme: boolean) => nf.setPlatformPlaying(value, darkTheme))
        ipcMain.handle("stopPlatformPlaying", (_) => nf.stopPlatformPlaying())
        ipcMain.handle("getOutputDirectory", async (_) => await nf.getOutputDirectory())
    }
}