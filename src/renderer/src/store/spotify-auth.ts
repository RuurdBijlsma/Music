import { defineStore } from 'pinia'
import { useBaseStore } from './base'
import { computed } from 'vue'
import { usePlatformStore } from './electron'
import { useLibraryStore } from './library'
import { useSpotifyApiStore } from './spotify-api'
import { useRouter } from 'vue-router'
import { usePlayerStore } from './player/player'
import { randomUser } from '../scripts/image-sources'
import { baseDb } from '../scripts/database'
import { persistentRef } from '../scripts/utils'
import log from 'electron-log/renderer'

export interface AuthToken {
    code: null | string
    access: null | string
    refresh: null | string
    expiryDate: null | number
}

export const useSpotifyAuthStore = defineStore('spotify-auth', () => {
    const platform = usePlatformStore()
    const library = useLibraryStore()
    const spotify = useSpotifyApiStore()
    const base = useBaseStore()
    const router = useRouter()
    const player = usePlayerStore()

    const secret = persistentRef('secret', '')
    const clientId = persistentRef('clientId', '')
    const tokens = persistentRef<AuthToken>(
        'tokens',
        {
            code: null,
            access: null,
            refresh: null,
            expiryDate: null
        },
        true
    )
    if (tokens.value.access !== null) checkAuth().then()
    const hasCredentials = computed(
        () => secret.value.length === 32 && clientId.value.length === 32
    )
    const isLoggedIn = computed(
        () =>
            tokens.value.code !== null &&
            tokens.value.access !== null &&
            tokens.value.refresh !== null &&
            tokens.value.expiryDate !== null
    )

    // Spotify API Stuff
    const requestedScopes =
        'ugc-image-upload user-read-email user-read-private playlist-read-collaborative playlist-modify-public playlist-read-private playlist-modify-private user-library-modify user-library-read user-top-read user-read-recently-played user-follow-read user-follow-modify'

    async function getAuthByRefreshToken(refreshToken: string): Promise<AuthToken> {
        const result = await (
            await fetch('https://accounts.spotify.com/api/token', {
                method: 'post',
                body: `grant_type=refresh_token&refresh_token=${refreshToken}&client_id=${clientId.value}&client_secret=${secret.value}`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
        ).text()
        try {
            const parsed = JSON.parse(result)
            return {
                access: parsed.access_token,
                expiryDate: +new Date() + parsed.expires_in * 1000
            } as AuthToken
        } catch (e: any) {
            log.info('Error', e.message, 'result = ', result)
        }
        return {} as AuthToken
    }

    async function login() {
        tokens.value = await platform.firstLogin()
        await checkAuth()
    }

    async function loginByRefreshToken() {
        if (tokens.value.refresh === null || tokens.value.refresh === '') {
            log.warn("Couldn't get new token, refresh token isn't set", tokens)
            return
        }
        const { access, expiryDate } = await getAuthByRefreshToken(tokens.value.refresh)
        tokens.value.access = access
        tokens.value.expiryDate = expiryDate

        await checkAuth()
    }

    let tokenTimeout: number

    async function logout() {
        const db = await baseDb
        player.unload().then()

        tokens.value = {
            code: null,
            access: null,
            refresh: null,
            expiryDate: null
        }
        library.userInfo = {
            id: '',
            name: '',
            mail: '',
            country: '',
            followers: 0,
            avatar: randomUser()
        }
        await db.delete('spotify', 'library')
        await db.delete('spotify', 'view')
        await db.clear('cache')

        clearTimeout(tokenTimeout)
        platform.resetSpotifyLogin()
        await router.push('/login')
    }

    async function checkAuth() {
        await baseDb

        const now = Date.now()
        if (tokens.value.expiryDate !== null && tokens.value.expiryDate > now) {
            spotify.api.setAccessToken(tokens.value.access)
            base.events.emit('accessToken')

            const msUntilExpire = tokens.value.expiryDate - now
            clearTimeout(tokenTimeout)
            tokenTimeout = window.setTimeout(
                async () => {
                    await loginByRefreshToken()
                },
                msUntilExpire - 1000 * 60 * 5
            )

            await library.initialize()
        } else {
            log.warn('Auth has expired, getting new token')
            //auth is expired
            await loginByRefreshToken()
        }
    }

    const awaitAuth = async () => {
        if (isLoggedIn.value && spotify.api.getAccessToken() !== null) return
        return await base.waitFor('accessToken')
    }

    return {
        isLoggedIn,
        requestedScopes,
        secret,
        clientId,
        hasCredentials,
        login,
        logout,
        awaitAuth
    }
})
