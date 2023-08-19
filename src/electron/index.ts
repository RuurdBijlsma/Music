import {app, BrowserWindow, ipcMain, shell, nativeImage} from 'electron'
import {release} from 'node:os'
import {join} from 'node:path'
import Directories from "./Directories";
import path from "path";
import fs from "fs/promises";
import sadFs from 'fs'
import * as os from "os";
import type {Progress} from "yt-dlp-wrap";
import child_process from "child_process";
import SpotifyWebApi from "spotify-web-api-js";
import * as https from "https";

var ffbinaries = require('ffbinaries');
const YTDlpWrap = require('yt-dlp-wrap').default;
const ytdlpPath = path.join(Directories.files, 'ytdlp.exe')

process.env.DIST_ELECTRON = join(__dirname, '..')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
    ? join(process.env.DIST_ELECTRON, '../public')
    : process.env.DIST

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
    app.quit()
    process.exit(0)
}

let win: BrowserWindow | null = null
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')

async function createWindow() {
    win = new BrowserWindow({
        title: 'Ruurd Music',
        icon: join(process.env.PUBLIC ?? './public', 'icon/new-dark-192.png'),
        width: 1500,
        height: 1000,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
        },
        titleBarStyle: "hidden",
    })

    if (process.env.VITE_DEV_SERVER_URL) { // electron-vite-vue#298
        win.loadURL(url ?? 'http://127.0.0.1:3344/')
        // Open devTool if the app is not packaged
        win.webContents.openDevTools()
    } else {
        win.loadFile(indexHtml)
    }

    // Test actively push message to the Electron-Renderer
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', new Date().toLocaleString())
    })

    // Make all links open with the browser, not with the application
    win.webContents.setWindowOpenHandler(({url}) => {
        if (url.startsWith('https:')) shell.openExternal(url)
        return {action: 'deny'}
    })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    win = null
    if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
    if (win) {
        // Focus on the main window if the user tried to open another
        if (win.isMinimized()) win.restore()
        win.focus()
    }
})

app.on('activate', () => {
    const allWindows = BrowserWindow.getAllWindows()
    if (allWindows.length) {
        allWindows[0].focus()
    } else {
        createWindow()
    }
})

ipcMain.on('focus-window', () => {
    if (win)
        win.focus();
})

ipcMain.handle("getDominantColor", async (_, imgUrl: string) => {

})

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
    return new Promise<string>((resolve, reject) => {
        let artistsString = tags.artist.join(', ')
        let query = `${artistsString} - ${tags.title}`
        let args = [
            `ytsearch1:"${query.replace(/"/gi, "\"")}"`,
            `-o`,
            `${path.join(Directories.temp, filename + '.%(ext)s')}`,
            `-x`,
        ];
        console.log(args)
        ytdlp.exec(args)
            .on('progress', (progress: Progress) => {
                win?.webContents.send(filename + 'progress', progress)
            })
            .on('error', (error: Error) => reject(error))
            .on('close', () => {
                let outPath = path.join(Directories.temp, filename + '.opus')
                ffmpegProcessing(tags, image, outPath).then((mp3File) => {
                    resolve(mp3File);
                })
            });
    })
})


async function ffmpegProcessing(tags: any, image: string, trackInputFile: string) {
    let baseFileName = path.basename(trackInputFile)
    baseFileName = baseFileName.substring(0, baseFileName.length - 5)
    console.log({baseFileName})

    let imageFile = path.join(Directories.temp, `image-${baseFileName}.jpg`);
    if (image !== '')
        await downloadFile(image, imageFile);

    let outputFile = path.join(Directories.temp, baseFileName + '.mp3');

    try {
        await ffmpegMetadata(trackInputFile, outputFile, image !== '' ? imageFile : '', tags);
    } catch (e) {
        console.error("Failed ffmpeg processing", baseFileName, e)
    }

    let destinationFile = path.join(Directories.music, baseFileName + '.mp3');
    await fs.rename(outputFile, destinationFile)
    fs.unlink(trackInputFile).then()
    if (image !== '')
        fs.unlink(imageFile).then();
    return destinationFile
}

async function downloadFile(url: string, destinationFile: string) {
    return new Promise((resolve, reject) => {
        var file = sadFs.createWriteStream(destinationFile);
        var request = https.get(url, function (response) {
            response.pipe(file);
            file.on('finish', function () {
                file.close(resolve);
            });
        }).on('error', function (err) {
            fs.unlink(destinationFile);
            reject(err)
        });
    })
}

async function ffmpegMetadata(fileInput: string, fileOutput: string, coverImageFile: string, tags: any) {
    return new Promise(async (resolve, reject) => {
        let command;
        if (coverImageFile) {
            command = `${ffmpegPath} -y -i "${fileInput}" -i "${coverImageFile}"` +
                ` -map 0:0 -map 1:0 -id3v2_version 3 -metadata:s:v title="Album cover" -metadata:s:v comment="Cover (Front)" ` +
                `${tagsToString(tags)} "${fileOutput}"`;
        } else {
            command = `${ffmpegPath} -y -i "${fileInput}"` +
                `${tagsToString(tags)} "${fileOutput}"`;
        }
        if (await checkFileExists(fileOutput))
            await fs.unlink(fileOutput);

        let process = child_process.exec(command, (error, stdout, stderr) => {
            if (error)
                return reject(error);
            resolve({err: stderr, out: stdout});
        });
    })
}

function tagsToString(tags: any) {
    let result = [];
    for (let tag in tags)
        if (tags.hasOwnProperty(tag))
            if (tags[tag] instanceof Array)
                result.push(`-metadata ${tag}="${tags[tag].join('; ')}"`);
                // for (let part of tags[tag])
            //     result.push(`-metadata ${tag}="${part}"`);
            else
                result.push(`-metadata ${tag}="${tags[tag]}"`);
    return result.join(' ');
}

ipcMain.handle('searchYt', async (_, query: string, results: number = 3) => {
    let args = [
        `ytsearch${results}:"${query.replace(/"/gi, "\"")}"`,
        `--dump-json`,
    ];
    console.log({query, args})
    let stdout = await ytdlp.execPromise(args);
    try {
        // return stdout;
        return stdout.split('\n').filter((l: string) => l.length > 0).map((l: string) => JSON.parse(l));
    } catch (e: any) {
        console.error("YTDL PARSE ERROR", e, stdout)
    }
})

const ytdlp = new YTDlpWrap()
let ffmpegPath = ""

async function getBinaries() {
    if (await checkFileExists(ytdlpPath)) {
        console.log("YTDLP ALREADY EXISTS!", ytdlpPath)
        ytdlp.setBinaryPath(ytdlpPath)
    } else {
        YTDlpWrap.downloadFromGithub(ytdlpPath).then(() => {
            console.log("Downloaded YTDLP!", ytdlpPath)
            ytdlp.setBinaryPath(ytdlpPath)
        })
    }
    let ext = os.platform() === 'win32' ? '.exe' : ''

    ffmpegPath = path.join(Directories.files, 'ffmpeg' + ext)
    let ffprobePath = path.join(Directories.files, 'ffprobe' + ext)
    if (await checkFileExists(ffmpegPath) && await checkFileExists(ffprobePath)) {
        console.log("FFMPEG/FFPROBE ALREADY EXISTS!", ffmpegPath, ffprobePath)
    } else {
        ffbinaries.downloadBinaries(['ffmpeg', 'ffprobe'], {quiet: true, destination: Directories.files}, () => {
            console.log('Downloaded ffplay and ffprobe binaries to ' + Directories.files + '.');
        });
    }
}

getBinaries();

async function checkFileExists(filePath: string) {
    try {
        await fs.access(filePath);
        return true;
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return false;
        } else {
            throw error;
        }
    }
}