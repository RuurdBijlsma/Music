import {defineStore} from 'pinia'
import electron, {ipcRenderer} from "electron";
import type {AuthToken} from "./spotify";
// @ts-ignore
import anzip from 'anzip';

import {useSpotifyStore} from "./spotify";

import http from "http";
import * as fs from "fs/promises";
import path from "path";

const express = window.require('express')
export const usePlatformStore = defineStore('platform', () => {
        const spotify = useSpotifyStore();
        let server: any = null;

        async function downloadExes() {
            const ytdlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
            let appDataPath = await ipcRenderer.invoke('getFilesPath');
            const ytdlpPath = path.join(appDataPath, 'ytdlp.exe')
            let promises = [] as Promise<any>[]
            let ytdlpExists = await checkFileExists(ytdlpPath)
            let ytdlpAge = 0
            if (ytdlpExists) {
                let stat = await fs.stat(ytdlpPath)
                ytdlpAge = Date.now() - stat.mtime.getTime()
            }
            // if ytdlp file age is greater than 30 days, download new one
            if (!ytdlpExists || ytdlpAge > 30 * 24 * 60 * 60 * 1000) {
                console.warn("YTDLP is 30 days old, downloading latest release!")
                promises.push(downloadFile(ytdlpUrl, ytdlpPath))
            }
            promises.push(getFfmpeg(appDataPath))
            await Promise.all(promises)
            console.log("DONE DOWNLOAD")
        }

        async function getFfmpeg(appDataPath: string, downloadIfExists = false) {
            const ffmpegPath = path.join(appDataPath, 'ffmpeg.zip')
            const ffmpegUrl = 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip'
            if (downloadIfExists || !await checkFileExists(ffmpegPath)) {
                await downloadFile(ffmpegUrl, ffmpegPath)
                const zipContent = await anzip(ffmpegPath, {
                    outputPath: appDataPath,
                    flattenPath: true,
                    pattern: /\.exe$/,
                })
                if (zipContent.error) {
                    console.error("Unzip error: ", zipContent.error.message)
                }
                if (zipContent.saved) {
                    console.log("Success unzip ffmpeg.exe")
                }
            }
        }

        async function downloadFile(url: string, outputPath: string, abortSignal: null | AbortSignal = null) {
            let res = await fetch(url, {signal: abortSignal});
            let blob = await res.blob();
            await fs.writeFile(outputPath, Buffer.from(await blob.arrayBuffer()))
        }

        function resetSpotifyLogin() {
            if (server !== null) {
                server.close();
                server = null;
            }
        }

        async function checkFileExists(file: string) {
            return fs.access(file, fs.constants.F_OK)
                .then(() => true)
                .catch(() => false)
        }

        function firstLogin(): Promise<AuthToken> {
            return new Promise(async resolve => {
                if (!spotify.hasCredentials) {
                    console.warn("Can't log in, keys are not set");
                    return;
                }
                const port = 38900;
                const redirectUrl = 'http://localhost:' + port;
                const url = `https://accounts.spotify.com/authorize?client_id=${spotify.clientId}` +
                    `&response_type=code&redirect_uri=${redirectUrl}&scope=${encodeURIComponent(spotify.requestedScopes)}`;
                let {shell} = electron;
                await shell.openExternal(url);

                if (server !== null)
                    server.close();

                const app = express();
                server = http.createServer(app);

                app.get('/', async (req: any, res: any) => {
                    if (req.query.hasOwnProperty('code')) {
                        server.close()
                        server = null;
                        console.log("Stopped listening on *:" + port);
                        let auth = await spotify.getAuthByCode(redirectUrl, req.query.code);
                        ipcRenderer.send('focus-window');
                        resolve(auth);
                    }
                    res.send(`
                        <html lang="en">
                            <head><title>Logging in...</title></head>
                            <body>
                                <script>
                                    window.close();
                                </script>
                            </body>
                        </html>
                    `);
                });

                server.listen(port, () => {
                    console.log('listening on *:' + port);
                });
            })
        }

        return {firstLogin, downloadExes}
    }
)