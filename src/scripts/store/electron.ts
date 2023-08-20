import {defineStore} from 'pinia'
import electron, {ipcRenderer} from "electron";
import type {AuthToken} from "./spotify";
// @ts-ignore
import anzip from 'anzip';
import {useSpotifyStore} from "./spotify";
import http from "http";
import * as fs from "fs/promises";
import path from 'path'
import type EventEmitter from "events";
import {ref} from "vue";
//@ts-ignore
import fileNamify from 'filenamify';

const express = window.require('express')
export const usePlatformStore = defineStore('platform', () => {
        const spotify = useSpotifyStore()
        let directories: { music: string } | null = null
        ipcRenderer.invoke('getDirectories').then((d: any) => {
            console.log("Got directories", d)
            directories = d
        })
        let server: any = null
        let ytCache = {} as any
        if (localStorage.getItem('ytSearchCache') !== null) {
            ytCache = JSON.parse(localStorage.ytSearchCache)
        }
        setInterval(() => {
            localStorage.ytSearchCache = JSON.stringify(ytCache)
        }, 10000);

        async function getTrackFile(track: SpotifyApi.TrackObjectFull, events: EventEmitter) {
            let hasImage = track.hasOwnProperty('album') && track.album.images.length > 0;
            if(hasImage){
                await ipcRenderer.invoke('getDominantColor', track.album.images[0].url)
            }
            let artistsString = track.artists.map(a => a.name).join(', ')
            let filename = fileNamify(`${track.name} - ${artistsString}`)
            let outPath = path.join(directories?.music ?? "", filename + '.mp3')
            if (!await checkFileExists(outPath)) {
                ipcRenderer.on(filename + 'progress', (_, progress) => {
                    console.log("PROGERSS", progress.percent)
                    events.emit(track.id + 'progress', progress)
                })
                let tags: any = {
                    title: track.name,
                    artist: track.artists.map(a => a.name),
                    disc: track.disc_number,
                    track: track.track_number,
                };
                if (track.hasOwnProperty('album')) {
                    if (track.album.hasOwnProperty('name'))
                        tags.album = track.album.name;
                    if (track.album.hasOwnProperty('release_date'))
                        //@ts-ignore
                        tags.year = new Date(track.album.release_date).getFullYear();
                }
                let hasImage = track.hasOwnProperty('album') && track.album.images.length > 0;
                console.log("Sending payload", tags, hasImage ? track.album.images[0].url : '')
                await ipcRenderer.invoke('downloadYt', filename, tags, hasImage ? track.album.images[0].url : '')
                console.log("downloaded yt")
            } else {
                console.log("Using cached file for track")
            }
            return outPath
        }

        async function searchYouTube(query: string, limit = 5) {
            let key = query + "|" + limit;
            if (ytCache.hasOwnProperty(key)) {
                let res = ytCache[key];
                if (res.expiryDate < Date.now())
                    delete ytCache[key]
                else
                    return ytCache[key].result
            }
            console.log("INVOKE ELECTRON", query)
            let result = await ipcRenderer.invoke('searchYt', query, limit)
            console.log("Full result", result)
            result = result.map((r: any) => ({
                duration: r.duration,
                description: r.description,
                channel: r.channel,
                title: r.title,
                thumbnail: r.thumbnail,
                id: r.id,
            }))
            console.log("Search youtube result: ", result)
            ytCache[key] = {
                result,
                // expiry date 30 days from now
                expiryDate: Date.now() + 1000 * 60 * 60 * 24 * 30
            };
            return result;
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

        async function setTheme(theme: string) {
            await ipcRenderer.invoke('setTheme', theme);
        }

        async function minimize() {
            await ipcRenderer.invoke('minimizeWindow')
        }

        async function close() {
            await ipcRenderer.invoke('closeWindow')
        }

        const maximized = ref(false)

        async function toggleMaximize() {
            maximized.value = await ipcRenderer.invoke('toggleMaximizeWindow')
        }

        return {firstLogin, searchYouTube, getTrackFile, setTheme, close, toggleMaximize, minimize}
    }
)