import Directories from './Directories'
import path from 'path'
import fs from 'fs/promises'
import badFs from 'fs'
import os from 'os'
import type { BrowserWindow } from 'electron'
import { app, dialog, globalShortcut } from 'electron'
import type { Progress } from 'yt-dlp-wrap'
import child_process, { spawn } from 'child_process'
import ColorThief from 'colorthief'
import { getContrastRatio, RGBToHex, RGBToHSL } from './utils'
import darkIcon from '../../resources/app-icon/dark-500.png?asset'
import lightIcon from '../../resources/app-icon/light-500.png?asset'
import darkPlayIcon from '../../resources/media-icon/dark-playicon.png?asset'
import darkPauseIcon from '../../resources/media-icon/dark-pauseicon.png?asset'
import darkPrevIcon from '../../resources/media-icon/dark-previcon.png?asset'
import darkNextIcon from '../../resources/media-icon/dark-nexticon.png?asset'
import lightPlayIcon from '../../resources/media-icon/light-playicon.png?asset'
import lightPauseIcon from '../../resources/media-icon/light-pauseicon.png?asset'
import lightPrevIcon from '../../resources/media-icon/light-previcon.png?asset'
import lightNextIcon from '../../resources/media-icon/light-nexticon.png?asset'
import replaceSpecialCharacters from 'replace-special-characters'
import { autoUpdater } from 'electron-updater'
import * as https from 'https'
import log from 'electron-log/main'
import ffBinaries from 'ffbinaries'

const YTDlpWrap = require('yt-dlp-wrap').default
export default class NodeFunctions {
    private readonly win: BrowserWindow
    private readonly ytdlpPath: string
    //@ts-ignore
    private ytdlp: YTDlpWrap
    private ffmpegPath: string
    private darkIcons: {
        playIcon: any
        pauseIcon: any
        nextIcon: any
        prevIcon: any
    } | null
    private lightIcons: {
        playIcon: any
        pauseIcon: any
        nextIcon: any
        prevIcon: any
    } | null
    private thumbButtons = { dark: false, playing: false, show: false }
    private readonly waitBinaries: Promise<void>

    constructor(win: BrowserWindow) {
        this.win = win
        const ext = os.platform() === 'win32' ? '.exe' : ''
        this.ytdlpPath = path.join(Directories.files, 'ytdlp' + ext)
        this.ytdlp = new YTDlpWrap()
        this.ffmpegPath = ''
        this.darkIcons = null
        this.lightIcons = null

        this.waitBinaries = this.getBinaries()
        this.initializePlatform().then()
    }

    get playingIcons() {
        if (this.darkIcons === null || this.lightIcons === null) return []
        return {
            dark: [this.darkIcons.prevIcon, this.darkIcons.pauseIcon, this.darkIcons.nextIcon],
            light: [this.lightIcons.prevIcon, this.lightIcons.pauseIcon, this.lightIcons.nextIcon]
        }
    }

    get pausedIcons() {
        if (this.darkIcons === null || this.lightIcons === null) return []
        return {
            dark: [this.darkIcons.prevIcon, this.darkIcons.playIcon, this.darkIcons.nextIcon],
            light: [this.lightIcons.prevIcon, this.lightIcons.playIcon, this.lightIcons.nextIcon]
        }
    }

    async downloadYouTube(ytId: string, outPath: string, tags: any, imageFile: string) {
        await this.waitBinaries
        const filename = path.basename(outPath)
        const tempPath = await this.downloadYtById(ytId, filename)
        const tempWithMetadataPath = path.join(Directories.temp, filename + '.mp3')

        delete tags.id
        // convert to mp3 and add metadata
        await this.ffmpegMetadata(tempPath, tempWithMetadataPath, imageFile, tags)

        // clean up
        await fs.rename(tempWithMetadataPath, outPath)
        fs.unlink(tempPath).then()
    }

    async downloadYtById(id: string, filename: string, destinationFolder = Directories.temp) {
        await this.waitBinaries
        return new Promise<string>((resolve, reject) => {
            const args = [
                `-o`,
                `${path.join(destinationFolder, filename + '.temp.%(ext)s')}`,
                `-x`,
                '--audio-format',
                'mp3',
                '--audio-quality',
                '0', //second-best audio quality
                `https://www.youtube.com/watch?v=${id}`
            ]
            this.ytdlp
                .exec(args)
                .on('progress', (progress: Progress) => {
                    this.win.webContents.send('progress', {
                        id,
                        progress
                    })
                })
                .on('ytDlpEvent', (a: string, b: string) => log.info(a, b))
                .on('error', (error: Error) => reject(error))
                .on('close', () => resolve(path.join(destinationFolder, filename + '.temp.mp3')))
        })
    }

    async ffmpegMetadata(fileInput: string, fileOutput: string, coverImageFile: string, tags: any) {
        await this.waitBinaries
        return new Promise(async (resolve, reject) => {
            let command
            if (coverImageFile) {
                command =
                    `"${this.ffmpegPath}" -y -i "${fileInput}" -i "${coverImageFile}"` +
                    ` -map 0:0 -map 1:0 -id3v2_version 3 -metadata:s:v title="Album cover" -metadata:s:v comment="Cover (Front)" ` +
                    `${this.tagsToString(tags)} -codec copy "${fileOutput}"`
            } else {
                command =
                    `"${this.ffmpegPath}" -y -i "${fileInput}"` +
                    `${this.tagsToString(tags)} -codec copy "${fileOutput}"`
            }
            if (await this.checkFileExists(fileOutput)) await fs.unlink(fileOutput)

            child_process.exec(command, (error, stdout, stderr) => {
                if (error) return reject(error)
                resolve({ err: stderr, out: stdout })
            })
        })
    }

    tagsToString(tags: any) {
        const result: string[] = []
        for (const tag in tags)
            if (tags.hasOwnProperty(tag))
                if (tags[tag] instanceof Array)
                    result.push(`-metadata ${tag}="${tags[tag].join('; ').replace(/"/g, '\\"')}"`)
                else result.push(`-metadata ${tag}="${tags[tag].toString().replace(/"/g, '\\"')}"`)
        return result.join(' ')
    }

    async getFfmpegBinary() {
        return new Promise<void>((resolve) => {
            ffBinaries.downloadBinaries(
                ['ffmpeg'],
                {
                    quiet: false,
                    destination: Directories.files
                },
                () => resolve()
            )
        })
    }

    async getBinaries() {
        if (await this.checkFileExists(this.ytdlpPath)) {
            this.ytdlp.setBinaryPath(this.ytdlpPath)
        } else {
            YTDlpWrap.downloadFromGithub(this.ytdlpPath).then(() => {
                this.ytdlp.setBinaryPath(this.ytdlpPath)
            })
        }
        const ext = os.platform() === 'win32' ? '.exe' : ''

        this.ffmpegPath = path.join(Directories.files, 'ffmpeg' + ext)
        if (!(await this.checkFileExists(this.ffmpegPath))) {
            if (os.platform() !== 'win32') {
                child_process.exec('ffmpeg', (_, stdout, stderr) => {
                    log.info({ stdout, stderr })
                    if (
                        !stdout.startsWith('ffmpeg version') &&
                        !stderr.startsWith('ffmpeg version')
                    ) {
                        this.win.webContents.send('ffmpegPath')
                    } else {
                        this.ffmpegPath = 'ffmpeg'
                    }
                })
            } else {
                await this.getFfmpegBinary()
            }
        }
    }

    async checkFileExists(filePath: string) {
        return fs
            .access(filePath, fs.constants.F_OK)
            .then(() => true)
            .catch(() => false)
    }

    async youTubeInfoById(id: string) {
        await this.waitBinaries
        const args = [`https://www.youtube.com/watch?v=${id}`, `--dump-json`]
        const stdout = await this.ytdlp.execPromise(args)
        try {
            // return stdout;
            return stdout
                .split('\n')
                .filter((l: string) => l.length > 0)
                .map((l: string) => JSON.parse(l))
        } catch (e: any) {
            log.error('YTDL PARSE ERROR', e, stdout)
        }
    }

    async downloadAsJpg(imgUrl: string) {
        await this.waitBinaries
        const outFile = path.join(Directories.temp ?? '', Math.random().toString() + '.jpg')
        return new Promise<string>((resolve, reject) => {
            const command = `"${this.ffmpegPath}" -i "${imgUrl}" "${outFile}"`

            child_process.exec(command, (error) => {
                if (error) return reject(error)
                resolve(outFile)
            })
        })
    }

    downloadFile(url: string, destinationFile: string) {
        return new Promise<void>((resolve, reject) => {
            const file = badFs.createWriteStream(destinationFile)
            https
                .get(url, (response) => {
                    response.pipe(file)
                    file.on('finish', () => {
                        file.close(() => resolve())
                    })
                })
                .on('error', (err) => {
                    fs.unlink(destinationFile).then()
                    reject(err)
                })
        })
    }

    async getVolumeStats(trackFile: string) {
        await this.waitBinaries
        return new Promise<{ err: string; out: string }>((resolve, reject) => {
            const command = `"${this.ffmpegPath}" -i "${trackFile}" -af "volumedetect" -vn -sn -dn -f null /dev/null`

            child_process.exec(command, (error, stdout, stderr) => {
                if (error) return reject(error)
                resolve({ err: stderr, out: stdout })
            })
        })
    }

    async getDominantColor(imageFile: string) {
        const rgbs = await ColorThief.getPalette(imageFile)
        const hsls = rgbs.map(([r, g, b]: number[]) => RGBToHSL(r, g, b))
        // let hexes = rgbs.map(([r, g, b]: number[]) => this.RGBToHex(r, g, b))

        const bgColorDark = [45, 45, 45] // for dark theme
        const bgColorLight = [240, 240, 240] // for dark theme
        const pickColor = (bgColor: number[]) => {
            const contrasts = rgbs.map(([r, g, b]: number[]) =>
                getContrastRatio([r, g, b], bgColor)
            )
            const minimumContrast = 4
            let acceptableThemeColors: { rgb: number[]; hsl: number[] }[] = []
            for (let i = 0; i < contrasts.length; i++) {
                if (contrasts[i] > minimumContrast) {
                    acceptableThemeColors.push({ rgb: rgbs[i], hsl: hsls[i] })
                }
            }
            if (acceptableThemeColors.length === 0) {
                const clr = 255 - bgColor[0]
                return RGBToHex(clr, clr, clr)
            }
            acceptableThemeColors = acceptableThemeColors.sort((a, b) => b.hsl[1] - a.hsl[1])
            const rgbest = acceptableThemeColors[0].rgb
            return RGBToHex(rgbest[0], rgbest[1], rgbest[2])
        }
        return {
            light: pickColor(bgColorLight),
            dark: pickColor(bgColorDark)
        }
    }

    async initializePlatform() {
        const likeShortcut = 'Shift+Alt+L'
        if (globalShortcut.isRegistered(likeShortcut)) globalShortcut.unregister(likeShortcut)
        const regResult = globalShortcut.register(likeShortcut, async () => {
            this.win.webContents.send('toggleFavorite')
        })
        if (!regResult) log.warn('Failed to register global shortcut ❌')

        const getIcons = (theme: 'dark' | 'light' = 'dark') => {
            const playIcon = {
                tooltip: 'Play',
                icon: theme === 'dark' ? darkPlayIcon : lightPlayIcon,
                click: () => this.win.webContents.send('play')
            }
            const pauseIcon = {
                tooltip: 'Play',
                icon: theme === 'dark' ? darkPauseIcon : lightPauseIcon,
                click: () => this.win.webContents.send('pause')
            }
            const prevIcon = {
                tooltip: 'Previous Song',
                icon: theme === 'dark' ? darkPrevIcon : lightPrevIcon,
                click: () => this.win.webContents.send('skip', -1)
            }
            const nextIcon = {
                tooltip: 'Next Song',
                icon: theme === 'dark' ? darkNextIcon : lightNextIcon,
                click: () => this.win.webContents.send('skip', 1)
            }
            return { playIcon, pauseIcon, prevIcon, nextIcon }
        }

        this.darkIcons = getIcons('dark')
        this.lightIcons = getIcons('light')

        // check for updates after 5 seconds
        setTimeout(() => this.configUpdater(), 5000)
    }

    webLog(...args: any[]) {
        this.win.webContents.send('log', ...args)
    }

    configUpdater() {
        setInterval(() => autoUpdater.checkForUpdatesAndNotify().then(), 1000 * 60 * 60)
        autoUpdater.checkForUpdatesAndNotify().then()
        autoUpdater.on('error', (e) => this.webLog('[auto updater]', 'error', e))
        autoUpdater.on('checking-for-update', () =>
            this.webLog('[auto updater]', 'checking-for-update', true)
        )
        autoUpdater.on('update-available', (e) =>
            this.webLog('[auto updater]', 'update-available', e)
        )
        autoUpdater.on('update-not-available', (e) =>
            this.webLog('[auto updater]', 'update-not-available', e)
        )
        autoUpdater.on('download-progress', (e) =>
            this.webLog('[auto updater]', 'download-progress', e)
        )
        autoUpdater.on('update-downloaded', (e) =>
            this.webLog('[auto updater]', 'update-downloaded', e)
        )
    }

    setPlatformPlaying(playing: boolean, darkTheme: boolean) {
        const iconSet = playing ? this.playingIcons : this.pausedIcons
        //@ts-ignore
        this.win.setThumbarButtons(iconSet[darkTheme ? 'dark' : 'light'])
        this.thumbButtons = {
            dark: darkTheme,
            playing,
            show: true
        }
    }

    stopPlatformPlaying() {
        this.win.setThumbarButtons([])
        this.thumbButtons.show = false
    }

    setTheme(theme: 'dark' | 'light') {
        this.win.setIcon(theme === 'dark' ? darkIcon : lightIcon)
    }

    async getOutputDirectory() {
        return await dialog.showOpenDialog(this.win, {
            properties: ['openDirectory']
        })
    }

    async getOpenFilePath(buttonLabel = 'Open', filterJson = true) {
        const defaultPath = app.getPath('documents')
        const filters = filterJson
            ? [
                  { name: 'JSON Files', extensions: ['json'] },
                  { name: 'All Files', extensions: ['*'] }
              ]
            : []
        return await dialog.showOpenDialog(this.win, {
            defaultPath,
            filters,
            buttonLabel
        })
    }

    async getFileContents(file: string) {
        try {
            return await fs.readFile(file, 'utf8')
        } catch (err) {
            return null
        }
    }

    async getSaveFilePath(defaultFilename?: string, buttonLabel = 'Save', filterJson = true) {
        const dir = app.getPath('documents')
        let defaultPath = dir
        if (defaultFilename) defaultPath = path.join(dir, defaultFilename)
        const filters = filterJson
            ? [
                  { name: 'JSON Files', extensions: ['json'] },
                  { name: 'All Files', extensions: ['*'] }
              ]
            : []
        return await dialog.showSaveDialog(this.win, {
            defaultPath,
            filters,
            buttonLabel
        })
    }

    async copyIfExists(fromPath: string, toDirectory: string) {
        const copyTarget = path.join(toDirectory, path.basename(fromPath))
        if (!(await this.checkFileExists(copyTarget))) await fs.copyFile(fromPath, copyTarget)
    }

    async copyFile(from: string, to: string) {
        await fs.copyFile(from, to)
    }

    deleteFile(file: string) {
        return fs.unlink(file)
    }

    async fileSize(file: string) {
        if (await this.checkFileExists(file)) {
            // Get the file stats using a promise
            const stats = await fs.stat(file)
            // Return the file size
            return stats.size
        } else {
            return -1
        }
    }

    async updateYtdlp(): Promise<string> {
        await this.waitBinaries
        return new Promise<string>((resolve, reject) => {
            const command = `"${this.ytdlpPath}" -U`

            child_process.exec(command, (error, stdout) => {
                if (error) return reject(error)
                resolve(stdout)
            })
        })
    }

    checkTracksDownloaded(filenames: string[]) {
        return new Promise<boolean>((resolve) => {
            let checks = filenames.length
            filenames.forEach(async (f) => {
                if (!(await this.checkFileExists(f))) {
                    resolve(false)
                } else if (--checks === 0) {
                    resolve(true)
                }
            })
        })
    }

    async searchYtdlp(query: string, limit = 3) {
        return new Promise<any[]>(async (resolve) => {
            query = replaceSpecialCharacters(query)
            const args = [`ytsearch${limit}:"${query}"`, `--dump-json`]
            if (process.platform === 'win32') {
                const command =
                    'cmd /c chcp 65001>nul && ' +
                    [`${this.ytdlpPath}`, ...args]
                        .map((a) =>
                            a.includes(' ') && !a.includes('"')
                                ? `"${a.replaceAll('"', '\\"')}"`
                                : a
                        )
                        .join(' ')
                const proc = spawn(command, {
                    shell: true
                })
                const results: any[] = []
                proc.stdout.on('data', (data) => {
                    const line = data.toString().trim()
                    try {
                        results.push(JSON.parse(line))
                    } catch (e) {
                        log.warn('[win] YTDLP Search parse error', e)
                    }
                })
                proc.on('close', () => {
                    resolve(results)
                })
            } else {
                try {
                    const result = await this.ytdlp.execPromise(args)
                    resolve(
                        result
                            .split('\n')
                            .filter((t) => t.trim().length > 0)
                            .map(JSON.parse)
                    )
                } catch (e) {
                    log.warn('[linux] YTDLP Search parse error', e)
                }
            }
        })
    }

    async saveStringToFile(filePath: string, contents: string) {
        try {
            await fs.writeFile(filePath, contents)
            return true
        } catch (err) {
            log.error(err)
            return false
        }
    }

    getAppVersion() {
        return app.getVersion()
    }

    setMusicFolder(folder: string) {
        Directories.changeMusicFolder(folder)
    }
}
