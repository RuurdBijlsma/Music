import {defineStore} from 'pinia'
import electron, {ipcRenderer} from "electron";
import {AuthToken, useSpotifyStore} from "./spotify";
import http from "http";

const express = window.require('express')
export const usePlatformStore = defineStore('platform', () => {
    const spotify = useSpotifyStore();
    let server: any = null;

    function resetSpotifyLogin() {
        if (server !== null) {
            server.close();
            server = null;
        }
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
    return {firstLogin}
})