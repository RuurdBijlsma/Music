import {defineStore} from 'pinia'
import electron, {ipcRenderer} from "electron";
import {useLibraryStore} from "./library";
// @ts-ignore
import anzip from 'anzip';
import http from "http";
import * as fs from "fs/promises";
import path from 'path'
import {ref} from "vue";
//@ts-ignore
import fileNamify from 'filenamify';
import {baseDb, useBaseStore} from "./base";
import type {IDBPDatabase} from "idb";
import {usePlayerStore} from "./player";
import type {AuthToken} from "./spotify-auth";
import {useSpotifyAuthStore} from "./spotify-auth";


const express = window.require('express')
export const usePlatformStore = defineStore('platform', () => {
    const library = useLibraryStore()
    const spotifyAuth = useSpotifyAuthStore()
    const base = useBaseStore()
    const player = usePlayerStore()

    let db: IDBPDatabase
    baseDb.then(async r => db = r)

    let directories: { music: string, temp: string } | null = null
    ipcRenderer.invoke('getDirectories').then((d: any) => {
        console.log("Got directories", d)
        directories = d
    })
    let server: any = null

    function musicFileNamify(file: string) {
        return fileNamify(file).substring(0, 150)
    }

    ipcRenderer.on('invoke', async (_, channel, data) => {
        if (channel === 'toggleFavorite') {
            if (player.track !== null) {
                let added = await library.toggleLike(player.track)
                await ipcRenderer.send('reply', channel, added)

                let speech = added ? 'Added to liked' : 'Removed from liked';
                let voices = speechSynthesis.getVoices();
                let voice = voices[Math.floor(Math.random() * voices.length)];
                let utterance = new SpeechSynthesisUtterance(speech);
                utterance.voice = voice;
                speechSynthesis.speak(utterance);
            }
        }
    })

    ipcRenderer.on('play', () => player.play())
    ipcRenderer.on('pause', () => player.pause())
    ipcRenderer.on('skip', (_, n) => player.skip(n))

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        return setPlatformPlaying(player.playing)
    });

    function setPlatformPlaying(playing: boolean) {
        return ipcRenderer.invoke('setPlatformPlaying', playing, window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
    }

    function stopPlatformPlaying() {
        return ipcRenderer.invoke('stopPlatformPlaying')
    }

    async function deleteFile(filename: string) {
        if (await checkFileExists(filename))
            await fs.unlink(filename)
    }

    async function trackIsDownloaded(track: SpotifyApi.TrackObjectFull) {
        let {outPath} = trackToNames(track)
        return await checkFileExists(outPath)
    }

    async function deleteTrack(track: SpotifyApi.TrackObjectFull) {
        let {outPath} = trackToNames(track)
        await deleteFile(outPath)
    }

    async function makeTempTrack(track: SpotifyApi.TrackObjectFull) {
        let {outPath, filename} = trackToNames(track)
        let tempDir = path.join(directories?.temp ?? "", filename + '.mp3')
        await fs.copyFile(outPath, tempDir)
        return tempDir
    }

    function trackToNames(track: SpotifyApi.TrackObjectFull) {
        let artistsString = track.artists.map(a => a.name).join(', ')
        const isYouTubeTrack = track.id.startsWith('yt-')
        let filename = musicFileNamify(isYouTubeTrack ? `${track.name} [${track.id.substring(3)}]` : `${track.name} - ${artistsString}`)
        let outPath = path.join(directories?.music ?? "", filename + '.mp3')
        let query = `${artistsString} - ${track.name}`
        return {cacheKey: `PTI-${filename}`, filename, outPath, query}
    }

    async function getTrackFile(track: SpotifyApi.TrackObjectFull) {
        const isYouTubeTrack = track.id.startsWith('yt-')
        let hasImage = track.hasOwnProperty('album') && track.album.images.length > 0;
        if (hasImage) {
            ipcRenderer.invoke('getDominantColor', track.album.images[0].url).then(c => {
                console.log(c)
                base.themeColorDark = c.dark
                base.themeColorLight = c.light
                console.log(base.themeColorLight, base.themeColorDark)
            })
        }
        let {cacheKey, filename, outPath} = trackToNames(track)
        let cachedId = await db.get('nameToId', cacheKey)
        console.log("CACHED ID RESULT", cachedId)
        if (!await checkFileExists(outPath)) {
            ipcRenderer.on(filename + 'progress', (_, progress) => {
                console.log("PROGERSS", progress.percent)
                base.events.emit(track.id + 'progress', progress)
            })
            let tags: any = {
                title: track.name,
                artist: track.artists.map(a => a.name),
                disc: track.disc_number,
                track: track.track_number,
                id: isYouTubeTrack ? track.id.split('-')[1] : undefined
            };
            if (cachedId !== undefined && cachedId !== '') {
                tags.id = cachedId
            }
            if (track.hasOwnProperty('album')) {
                if (track.album.hasOwnProperty('name'))
                    tags.album = track.album.name;
                if (track.album.hasOwnProperty('release_date'))
                    //@ts-ignore
                    tags.year = new Date(track.album.release_date).getFullYear();
            }
            console.log("Sending payload", tags, hasImage ? track.album.images[0].url : '')
            let {id} = await ipcRenderer.invoke('downloadYt', filename, tags, hasImage ? track.album.images[0].url : '')
            console.log("ID", id)
            if (base.sourceDialog.tempTrackOverride.trackId === track.id) {
                outPath = await makeTempTrack(track)
                console.log("TEMP TRACK OVERRIDE REQUESTED, new outPath=", outPath)
                base.sourceDialog.tempTrackOverride.trackId = ''
            }
            if (id !== '') {
                db.put('nameToId', id, cacheKey).then()
                console.log("downloaded yt", {outPath, id})
            }
        } else {
            console.log("Using cached file for track")
        }
        return outPath
    }

    async function searchYouTube(query: string, limit = 5) {
        let key = 'yt' + query + "|" + limit;
        let ytCache = await db.get('cache', key)
        if (ytCache) {
            if (ytCache.expiryDate < Date.now())
                db.delete('cache', key).then()
            else
                return ytCache.result
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
            channelUrl: r.channel_url,
            channelId: r.channel_id,
            playlist: r.playlist,
            playlistId: r.playlist_id,
            viewCount: r.view_count,
            uploadDate: new Date(`${r.upload_date.substring(0, 4)}-${r.upload_date.substring(4, 6)}-${r.upload_date.substring(6, 8)}`)
        }))
        console.log("Search youtube result: ", result)
        db.put('cache', {
            result,
            // expiry date 30 days from now
            expiryDate: Date.now() + 1000 * 60 * 60 * 24 * 30
        }, key).then()

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
            if (!spotifyAuth.hasCredentials) {
                console.warn("Can't log in, keys are not set");
                return;
            }
            const port = 38900;
            const redirectUrl = 'http://localhost:' + port;
            const url = `https://accounts.spotify.com/authorize?client_id=${spotifyAuth.clientId}` +
                `&response_type=code&redirect_uri=${redirectUrl}&scope=${encodeURIComponent(spotifyAuth.requestedScopes)}`;
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
                    let auth = await spotifyAuth.getAuthByCode(redirectUrl, req.query.code);
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

    return {
        firstLogin,
        searchYouTube,
        getTrackFile,
        setTheme,
        close,
        toggleMaximize,
        minimize,
        setPlatformPlaying,
        trackToNames,
        deleteFile,
        trackIsDownloaded,
        deleteTrack,
    }
})