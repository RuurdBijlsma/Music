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
        let ytCache = {} as any;
        if (localStorage.getItem('ytSearchCache') !== null) {
            ytCache = JSON.parse(localStorage.ytSearchCache);
        }
        setInterval(() => {
            localStorage.ytSearchCache = JSON.stringify(ytCache)
        }, 10000);

        async function searchYouTube(query: string, limit = 5) {
            let key = query + "|" + limit;
            if (ytCache.hasOwnProperty(key)) {
                return ytCache[key];
            }
            console.log("INVOKE ELECTRON", query)
            let result = await ipcRenderer.invoke('searchYt', query, limit);
            ytCache[key] = result;
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

        return {firstLogin, searchYouTube}
    }
)