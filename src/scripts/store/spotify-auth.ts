import { defineStore } from "pinia"
import { baseDb, useBaseStore } from "./base"
import type { IDBPDatabase } from "idb"
import { computed, ref, toRaw, watch } from "vue"
import type { Ref } from "vue"
import { usePlatformStore } from "./electron"
import { useLibraryStore } from "./library"
import { useSpotifyApiStore } from "./spotify-api"

export interface AuthToken {
    code: null | string,
    access: null | string,
    refresh: null | string,
    expiryDate: null | number,
}

export const useSpotifyAuthStore = defineStore("spotify-auth", () => {
    const platform = usePlatformStore()
    const library = useLibraryStore()
    const spotify = useSpotifyApiStore()
    const base = useBaseStore()

    let db: IDBPDatabase
    baseDb.then(r => {
        db = r
        loadValues().then(() => {
            console.log("Loaded idb values into store", performance.now())
        })
    })

    // IndexedDB persistent storage
    async function loadValues() {
        console.log("Loading db value start", performance.now())

        if (localStorage.getItem("secret") !== null) {
            secret.value = localStorage.secret
            console.log("[LOAD] secret.value = " + localStorage.secret)
        }
        if (localStorage.getItem("clientId") !== null) {
            clientId.value = localStorage.clientId
            console.log("[LOAD] clientId.value = " + localStorage.clientId)
        }
        if (localStorage.getItem("tokens") !== null) {
            tokens.value = JSON.parse(localStorage.tokens)
            console.log("[LOAD] tokens.value = ", JSON.parse(localStorage.tokens))
            checkAuth().then()
        }
        console.log("Loading db value end", performance.now())
    }

    const secret = ref("")
    const clientId = ref("")
    let tokens: Ref<AuthToken> = ref({
        code: null,
        access: null,
        refresh: null,
        expiryDate: null
    })
    const hasCredentials = computed(() =>
      secret.value.length === 32 && clientId.value.length === 32
    )
    const isLoggedIn = computed(() =>
      tokens.value.code !== null &&
      tokens.value.access !== null &&
      tokens.value.refresh !== null &&
      tokens.value.expiryDate !== null
    )

    watch(secret, async () => {
        localStorage.secret = secret.value
        console.log("[WATCH] localStorage.secret = " + secret.value)
    })
    watch(clientId, async () => {
        localStorage.clientId = clientId.value
        console.log("[WATCH] localStorage.clientId = " + clientId.value)
    })

    // Spotify API Stuff
    const requestedScopes = "ugc-image-upload user-read-email user-read-private playlist-read-collaborative playlist-modify-public playlist-read-private playlist-modify-private user-library-modify user-library-read user-top-read user-read-recently-played user-follow-read user-follow-modify"

    async function getAuthByRefreshToken(refreshToken: string): Promise<AuthToken> {
        console.log("Refresh using refreshToken", refreshToken)
        let result = await (await fetch("https://accounts.spotify.com/api/token", {
            method: "post",
            body: `grant_type=refresh_token&refresh_token=${refreshToken}&client_id=${clientId.value}&client_secret=${secret.value}`,
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        })).text()
        try {
            let parsed = JSON.parse(result)
            console.log(parsed)
            return {
                access: parsed.access_token,
                expiryDate: (+new Date) + parsed.expires_in * 1000
            } as AuthToken
        } catch (e: any) {
            console.log("Error", e.message, "result = ", result)
        }
        return {} as AuthToken
    }

    async function getAuthByCode(redirectUrl: string, code: string): Promise<AuthToken> {
        console.log("Getting auth using code", { redirectUrl, code })
        let result = await (await fetch(`https://accounts.spotify.com/api/token`, {
            method: "post",
            body: `grant_type=authorization_code&code=${code}&redirect_uri=${redirectUrl}&client_id=` +
              `${clientId.value}&client_secret=${secret.value}`,
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        })).text()
        try {
            console.log(result)
            let parsed = JSON.parse(result)
            if (parsed.error) {
                console.warn("Get auth by code error", parsed)
                return {} as AuthToken
            }
            return {
                code: code,
                access: parsed.access_token,
                refresh: parsed.refresh_token,
                expiryDate: (+new Date) + parsed.expires_in * 1000
            }
        } catch (e: any) {
            console.log("Error", e.message, "t = ", result)
        }
        return {} as AuthToken
    }

    async function login() {
        tokens.value = await platform.firstLogin()
        console.log("Auth result from 'firstLogin'", tokens)
        // await dispatch('cacheState')
        await checkAuth()
    }

    async function loginByRefreshToken() {
        if (tokens.value.refresh === null || tokens.value.refresh === "") {
            console.warn("Couldn't get new token, refresh token isn't set", tokens)
            return
        }
        let { access, expiryDate } = await getAuthByRefreshToken(tokens.value.refresh)
        tokens.value.access = access
        tokens.value.expiryDate = expiryDate

        await checkAuth()
    }

    let tokenTimeout: number

    async function spotifyLogout() {
        await baseDb

        tokens.value = {
            code: null,
            access: null,
            refresh: null,
            expiryDate: null
        }
        library.userInfo = {
            id: "",
            name: "",
            mail: "",
            country: "",
            followers: 0,
            avatar: "img/no-user.jpg"
        }
        localStorage.userInfo = JSON.stringify(toRaw(library.userInfo))
        localStorage.tokens = JSON.stringify(toRaw(tokens.value))
        await db.delete("spotify", "library")
        await db.delete("spotify", "view")

        clearTimeout(tokenTimeout)
    }

    async function checkAuth() {
        await baseDb

        let now = Date.now()
        console.log("yea", tokens.value.expiryDate, now)
        if (tokens.value.expiryDate !== null && tokens.value.expiryDate > now) {
            console.log("WE HAVE AN EXPIRY DATE")
            spotify.api.setAccessToken(tokens.value.access)
            base.events.emit("accessToken")

            let msUntilExpire = tokens.value.expiryDate - now
            console.log("msUntilExpire", msUntilExpire)
            clearTimeout(tokenTimeout)
            tokenTimeout = window.setTimeout(async () => {
                await loginByRefreshToken()
            }, msUntilExpire - 1000 * 60 * 5)

            localStorage.tokens = JSON.stringify(toRaw(tokens.value))
            await library.initialize()
        } else {
            console.warn("Auth has expired, getting new token")
            //auth is expired
            await loginByRefreshToken()
        }
    }

    const awaitAuth = async () => {
        console.log("Await auth")
        if (isLoggedIn && spotify.api.getAccessToken() !== null) return
        return await base.waitFor("accessToken")
    }

    return {
        getAuthByCode,
        isLoggedIn,
        requestedScopes,
        secret,
        clientId,
        hasCredentials,
        login,
        awaitAuth
    }
})