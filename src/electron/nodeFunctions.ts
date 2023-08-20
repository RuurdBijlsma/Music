import Directories from "./Directories";
import path from "path";
import sadFs from "fs";
import fs from "fs/promises";
import os from "os";
import type {BrowserWindow} from 'electron'
import type {Progress} from "yt-dlp-wrap";
import child_process from "child_process";
import SpotifyWebApi from "spotify-web-api-js";
import * as https from "https";
//@ts-ignore
import {contrastColor} from 'contrast-color'
//@ts-ignore
import ColorThief from 'color-extr-thief'

const YTDlpWrap = require("yt-dlp-wrap").default

const ffbinaries = require('ffbinaries');

export default class NodeFunctions {
    private win: BrowserWindow;
    private ytdlpPath: string;
    //@ts-ignore
    private ytdlp: YTDlpWrap;
    private ffmpegPath: string;

    constructor(win: BrowserWindow) {
        this.win = win
        this.ytdlpPath = path.join(Directories.files, 'ytdlp.exe')
        this.ytdlp = new YTDlpWrap()
        this.ffmpegPath = ""

        this.getBinaries().then()
    }


    rgbToHsl(r: number, g: number, b: number) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h: number = 0, s: number = 0, l: number = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }

        return [h * 360, s * 100, l * 100];
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

    async getDominantColor(imgUrl: string) {
        let imgId = Math.random().toString()
        let imageFile = path.join(Directories.temp, `color-thief-${imgId}.jpg`);
        await this.downloadFile(imgUrl, imageFile)
        let color = await ColorThief.getPalette(imageFile)
        let hsbs = color.map(this.rgbToHsl)
        console.log("Thief color: ", hsbs)
    }
}