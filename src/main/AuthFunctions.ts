import { BrowserWindow, shell } from 'electron'
import express from 'express'
import http, { Server } from 'http'
import log from 'electron-log/main'

interface AuthToken {
    code: null | string
    access: null | string
    refresh: null | string
    expiryDate: null | number
}

export default class SpotifyAuth {
    private win: BrowserWindow
    private server: Server | null = null

    constructor(win: BrowserWindow) {
        this.win = win
    }

    resetSpotifyLogin() {
        if (this.server !== null) {
            this.server.close()
            this.server = null
        }
    }

    async getAuthByCode(
        redirectUrl: string,
        code: string,
        clientId: string,
        secret: string
    ): Promise<AuthToken> {
        const result = await (
            await fetch(`https://accounts.spotify.com/api/token`, {
                method: 'post',
                body:
                    `grant_type=authorization_code&code=${code}&redirect_uri=${redirectUrl}&client_id=` +
                    `${clientId}&client_secret=${secret}`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
        ).text()
        try {
            const parsed = JSON.parse(result)
            if (parsed.error) {
                log.warn('Get auth by code error', parsed)
                return {} as AuthToken
            }
            return {
                code: code,
                access: parsed.access_token,
                refresh: parsed.refresh_token,
                expiryDate: +new Date() + parsed.expires_in * 1000
            }
        } catch (e: any) {
            log.info('Error', e.message, 't = ', result)
        }
        return {} as AuthToken
    }

    async firstLogin(spotifyAuth: {
        hasCredentials: boolean
        clientId: string
        requestedScopes: string
        secret: string
    }): Promise<AuthToken> {
        return new Promise(async (resolve) => {
            if (!spotifyAuth.hasCredentials) {
                log.warn("Can't log in, keys are not set")
                return
            }
            const port = 38900
            const redirectUrl = 'http://localhost:' + port
            const url =
                `https://accounts.spotify.com/authorize?client_id=${spotifyAuth.clientId}` +
                `&response_type=code&redirect_uri=${redirectUrl}&scope=${encodeURIComponent(
                    spotifyAuth.requestedScopes
                )}`
            await shell.openExternal(url)

            if (this.server !== null) this.server.close()

            const app = express()
            this.server = http.createServer(app)

            app.get('/', async (req: any, res: any) => {
                if (req.query.hasOwnProperty('code')) {
                    if (this.server !== null) this.server.close()
                    this.server = null
                    const auth = await this.getAuthByCode(
                        redirectUrl,
                        req.query.code,
                        spotifyAuth.clientId,
                        spotifyAuth.secret
                    )
                    this.win.focus()
                    resolve(auth)
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
                    `)
            })

            this.server.listen(port, () => 0)
        })
    }
}
