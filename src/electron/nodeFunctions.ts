import Directories from "./Directories";
import path from "path";
import sadFs from "fs";
import fs from "fs/promises";
import os from "os";
import type {BrowserWindow} from 'electron'
import type {Progress} from "yt-dlp-wrap";
import child_process from "child_process";
import * as https from "https";
//@ts-ignore
import {contrastColor} from 'contrast-color'
//@ts-ignore
import ColorThief from 'color-extr-thief'
import {ipcRenderer, globalShortcut, ipcMain} from "electron";

const YTDlpWrap = require("yt-dlp-wrap").default

const ffbinaries = require('ffbinaries');

export default class NodeFunctions {
    private win: BrowserWindow;
    private ytdlpPath: string;
    //@ts-ignore
    private ytdlp: YTDlpWrap;
    private ffmpegPath: string;
    private darkIcons: { playIcon: any, pauseIcon: any, nextIcon: any, prevIcon: any } | null;
    private lightIcons: { playIcon: any, pauseIcon: any, nextIcon: any, prevIcon: any } | null;

    constructor(win: BrowserWindow) {
        this.win = win
        this.ytdlpPath = path.join(Directories.files, 'ytdlp.exe')
        this.ytdlp = new YTDlpWrap()
        this.ffmpegPath = ""
        this.darkIcons = null
        this.lightIcons = null

        this.getBinaries().then()
        this.initializePlatform().then()
    }


    async downloadYtByQuery(query: string, filename: string, destinationFolder = Directories.temp) {
        return new Promise<string>((resolve, reject) => {
            let args = [
                `ytsearch1:"${query.replace(/"/gi, "\"")}"`,
                `-o`,
                `${path.join(destinationFolder, filename + '.%(ext)s')}`,
                `-x`,
                // uncomment to set let ytdlp handle the conversion to mp3
                // '--audio-format', 'mp3',
                // '--audio-quality', '0',//second-best audio quality
            ];
            console.log(args)
            this.ytdlp.exec(args)
                .on('progress', (progress: Progress) => {
                    this.win?.webContents.send(filename + 'progress', progress)
                })
                .on('error', (error: Error) => reject(error))
                .on('close', () => resolve(path.join(destinationFolder, filename + '.opus')));
        })
    }

    async downloadFile(url: string, destinationFile: string) {
        return new Promise<string>((resolve, reject) => {
            var file = sadFs.createWriteStream(destinationFile);
            https.get(url, function (response) {
                response.pipe(file);
                file.on('finish', function () {
                    file.close(() => resolve(destinationFile));
                });
            }).on('error', function (err) {
                fs.unlink(destinationFile);
                reject(err)
            });
        })
    }

    async ffmpegMetadata(fileInput: string, fileOutput: string, coverImageFile: string, tags: any) {
        return new Promise(async (resolve, reject) => {
            let command;
            if (coverImageFile) {
                command = `${this.ffmpegPath} -y -i "${fileInput}" -i "${coverImageFile}"` +
                    ` -map 0:0 -map 1:0 -id3v2_version 3 -metadata:s:v title="Album cover" -metadata:s:v comment="Cover (Front)" ` +
                    `${this.tagsToString(tags)} "${fileOutput}"`;
            } else {
                command = `${this.ffmpegPath} -y -i "${fileInput}"` +
                    `${this.tagsToString(tags)} "${fileOutput}"`;
            }
            if (await this.checkFileExists(fileOutput))
                await fs.unlink(fileOutput);

            child_process.exec(command, (error, stdout, stderr) => {
                if (error)
                    return reject(error);
                resolve({err: stderr, out: stdout});
            });
        })
    }

    tagsToString(tags: any) {
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

    async getBinaries() {
        if (await this.checkFileExists(this.ytdlpPath)) {
            console.log("YTDLP ALREADY EXISTS!", this.ytdlpPath)
            this.ytdlp.setBinaryPath(this.ytdlpPath)
        } else {
            YTDlpWrap.downloadFromGithub(this.ytdlpPath).then(() => {
                console.log("Downloaded YTDLP!", this.ytdlpPath)
                this.ytdlp.setBinaryPath(this.ytdlpPath)
            })
        }
        let ext = os.platform() === 'win32' ? '.exe' : ''

        this.ffmpegPath = path.join(Directories.files, 'ffmpeg' + ext)
        let ffprobePath = path.join(Directories.files, 'ffprobe' + ext)
        if (await this.checkFileExists(this.ffmpegPath) && await this.checkFileExists(ffprobePath)) {
            console.log("FFMPEG/FFPROBE ALREADY EXISTS!", this.ffmpegPath, ffprobePath)
        } else {
            ffbinaries.downloadBinaries(['ffmpeg', 'ffprobe'], {quiet: true, destination: Directories.files}, () => {
                console.log('Downloaded ffplay and ffprobe binaries to ' + Directories.files + '.');
            });
        }
    }

    async checkFileExists(filePath: string) {
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

    async searchYouTube(query: string, results: number) {
        let args = [
            `ytsearch${results}:"${query.replace(/"/gi, "\"")}"`,
            `--dump-json`,
        ];
        console.log({query, args})
        let stdout = await this.ytdlp.execPromise(args);
        try {
            // return stdout;
            return stdout.split('\n').filter((l: string) => l.length > 0).map((l: string) => JSON.parse(l));
        } catch (e: any) {
            console.error("YTDL PARSE ERROR", e, stdout)
        }
    }

    // A function to calculate the relative luminance of an RGB color
    getRelativeLuminance(rgb: number[]): number {
        // Apply a linear transformation to each component
        const [r, g, b] = rgb.map(c => {
            c /= 255; // Normalize to [0, 1]
            return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
        // Return the weighted sum of the components
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }


    RGBToHSL(r: number, g: number, b: number) {
        r /= 255;
        g /= 255;
        b /= 255;
        const l = Math.max(r, g, b);
        const s = l - Math.min(r, g, b);
        const h = s
            ? l === r
                ? (g - b) / s
                : l === g
                    ? 2 + (b - r) / s
                    : 4 + (r - g) / s
            : 0;
        return [
            60 * h < 0 ? 60 * h + 360 : 60 * h,
            100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0),
            (100 * (2 * l - s)) / 2,
        ];
    };

    RGBToHex(r: number, g: number, b: number): string {
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    // A function to calculate the contrast ratio between two RGB colors
    getContrastRatio(rgb1: number[], rgb2: number[]): number {
        // Get the relative luminance of each color
        const l1 = this.getRelativeLuminance(rgb1);
        const l2 = this.getRelativeLuminance(rgb2);
        // Return the ratio of the larger luminance to the smaller luminance
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    }

    async getDominantColor(imgUrl: string) {
        let imgId = Math.random().toString()
        let imageFile = path.join(Directories.temp, `color-thief-${imgId}.jpg`);
        await this.downloadFile(imgUrl, imageFile)
        let rgbs = await ColorThief.getPalette(imageFile)
        let hsls = rgbs.map(([r, g, b]: number[]) => this.RGBToHSL(r, g, b))
        // let hexes = rgbs.map(([r, g, b]: number[]) => this.RGBToHex(r, g, b))
        // console.log("Thief color: ", rgbs)

        let bgColorDark = [45, 45, 45] // for dark theme
        let bgColorLight = [240, 240, 240] // for dark theme
        let pickColor = (bgColor: number[]) => {
            let contrasts = rgbs.map(([r, g, b]: number[]) => this.getContrastRatio([r, g, b], bgColor))
            // console.log(contrasts)
            let minimumContrast = 4
            let acceptableThemeColors: { rgb: number[], hsl: number[] }[] = []
            for (let i = 0; i < contrasts.length; i++) {
                if (contrasts[i] > minimumContrast) {
                    acceptableThemeColors.push({rgb: rgbs[i], hsl: hsls[i]})
                }
            }
            if (acceptableThemeColors.length === 0) {
                console.log("No contrasting colors found in album art");
                let clr = 255 - bgColor[0];
                return [clr, clr, clr]
            }
            acceptableThemeColors = acceptableThemeColors.sort((a, b) => b.hsl[1] - a.hsl[1])
            // console.log(acceptableThemeColors.map(a => a.hsl))
            let rgbest = acceptableThemeColors[0].rgb
            return this.RGBToHex(rgbest[0], rgbest[1], rgbest[2])
        }
        return {
            light: pickColor(bgColorLight),
            dark: pickColor(bgColorDark),
        }
    }

    async webInvoke(channel: string, data: any = null) {
        return new Promise<any>((resolve) => {
            this.win.webContents.send("invoke", channel, data)
            ipcMain.once("reply", (_event, channel, value) => {
                console.log("Received", channel, value)
                if (channel === channel)
                    resolve(value)
            })
        })
    }

    async initializePlatform() {
        let pubPath = process.env.PUBLIC ?? './public'

        const likeShortcut = 'Shift+Alt+L';
        if (globalShortcut.isRegistered(likeShortcut))
            globalShortcut.unregister(likeShortcut);
        let regResult = globalShortcut.register(likeShortcut, async () => {
            let added = await this.webInvoke('toggleFavorite')
            // let speech = added ? 'Added to favorites' : 'Removed from favorites';
            // let voices = speechSynthesis.getVoices();
            // let voice = voices[Math.floor(Math.random() * voices.length)];
            // let utterance = new SpeechSynthesisUtterance(speech);
            // utterance.voice = voice;
            // speechSynthesis.speak(utterance);
        });
        if (regResult)
            console.log("Registered global shortcut ✔")
        else
            console.log("Failed to register global shortcut ❌")


        const getIcons = (theme = 'dark') => {
            let playIcon = {
                tooltip: 'Play',
                icon: path.join(pubPath, `/img/${theme}-playicon.png`),
                click: () => this.win.webContents.send('play'),
            };
            let pauseIcon = {
                tooltip: 'Play',
                icon: path.join(pubPath, `/img/${theme}-pauseicon.png`),
                click: () => this.win.webContents.send('pause'),
            };
            let prevIcon = {
                tooltip: 'Previous Song',
                icon: path.join(pubPath, `/img/${theme}-previcon.png`),
                click: () => this.win.webContents.send('skip', -1),
            };
            let nextIcon = {
                tooltip: 'Next Song',
                icon: path.join(pubPath, `/img/${theme}-nexticon.png`),
                click: () => this.win.webContents.send('skip', 1),
            };
            return {playIcon, pauseIcon, prevIcon, nextIcon}
        }
        this.darkIcons = getIcons('dark')
        this.lightIcons = getIcons('light')
    }

    get playingIcons() {
        if (this.darkIcons === null || this.lightIcons === null) return []
        return {
            dark: [this.darkIcons.prevIcon, this.darkIcons.pauseIcon, this.darkIcons.nextIcon],
            light: [this.lightIcons.prevIcon, this.lightIcons.pauseIcon, this.lightIcons.nextIcon],
        }
    }

    get pausedIcons() {
        if (this.darkIcons === null || this.lightIcons === null) return []
        return {
            dark: [this.darkIcons.prevIcon, this.darkIcons.playIcon, this.darkIcons.nextIcon],
            light: [this.lightIcons.prevIcon, this.lightIcons.playIcon, this.lightIcons.nextIcon],
        }
    }

    setPlatformPlaying(playing: boolean, darkTheme: boolean) {
        let iconSet = playing ? this.playingIcons : this.pausedIcons
        //@ts-ignore
        let thumbAdded = this.win.setThumbarButtons(iconSet[darkTheme ? 'dark' : 'light']);
    }
}