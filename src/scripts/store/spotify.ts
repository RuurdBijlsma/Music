import {defineStore} from 'pinia'
import {computed, Ref, ref, watch} from "vue";
import {baseDb} from './base'
import SpotifyWebApi from "spotify-web-api-js";
import EventEmitter from 'events';
import {usePlatformStore} from "./electron";

export interface AuthToken {
    code: null | string,
    access: null | string,
    refresh: null | string,
    expiryDate: null | number,
}

export const useSpotifyStore = defineStore('spotify', () => {
    const platform = usePlatformStore()
    const requestedScopes = "ugc-image-upload user-read-email user-read-private playlist-read-collaborative playlist-modify-public playlist-read-private playlist-modify-private user-library-modify user-library-read user-top-read user-read-recently-played user-follow-read user-follow-modify"
    const events = new EventEmitter()
    let tokens: Ref<AuthToken> = ref({
        code: null,
        access: null,
        refresh: null,
        expiryDate: null,
    })
    const api = new SpotifyWebApi()
    ////////////////////////////
    const userInfo = ref({
        id: '',
        name: '',
        mail: '',
        country: '',
        followers: 0,
        avatar: 'img/no-user.jpg',
    })
    const secret = ref('')
    const clientId = ref('')

    const hasCredentials = computed(() =>
        secret.value.length === 32 && clientId.value.length === 32
    )
    const isLoggedIn = computed(() =>
        tokens.value.code !== null &&
        tokens.value.access !== null &&
        tokens.value.refresh !== null &&
        tokens.value.expiryDate !== null
    )

    async function loadValues() {
        let dbSecret = await baseDb.get('keyval', 'secret');
        let dbClientId = await baseDb.get('keyval', 'clientId');
        let dbTokens = await baseDb.get('keyval', 'tokens');
        if (dbSecret)
            secret.value = dbSecret;
        if (dbClientId)
            clientId.value = dbClientId;
        if (dbTokens) {
            tokens.value = dbTokens;
            await checkAuth();
        }
    }

    async function getAuthByRefreshToken(refreshToken: string): Promise<AuthToken> {
        console.log('Refresh using refreshToken', refreshToken);
        let result = await (await fetch('https://accounts.spotify.com/api/token', {
            method: 'post',
            body: `grant_type=refresh_token&refresh_token=${refreshToken}&client_id=${clientId}&client_secret=${secret}`,
            headers: {'Content-Type': 'application/x-www-form-urlencoded',}
        })).text();
        try {
            return JSON.parse(result) as AuthToken
        } catch (e: any) {
            console.log("Error", e.message, "result = ", result);
        }
        return {} as AuthToken;
    }

    async function getAuthByCode(redirectUrl: string, code: string): Promise<AuthToken> {
        console.log('Getting auth using code', {redirectUrl, code});
        let result = await (await fetch(`https://accounts.spotify.com/api/token`, {
            method: 'post',
            body: `grant_type=authorization_code&code=${code}&redirect_uri=${redirectUrl}&client_id=` +
                `${clientId.value}&client_secret=${secret.value}`,
            headers: {'Content-Type': 'application/x-www-form-urlencoded',}
        })).text();
        try {
            console.log(result);
            let t = JSON.parse(result);
            if (t.error) {
                console.warn("Get auth by code error", t);
                return {} as AuthToken;
            }
            return {
                code: code,
                access: t.access_token,
                refresh: t.refresh_token,
                expiryDate: (+new Date) + t.expires_in * 1000,
            }
        } catch (e: any) {
            console.log("Error", e.message, "t = ", result);
        }
        return {} as AuthToken;
    }

    async function login() {
        tokens.value = await platform.firstLogin();
        console.log("Auth result from 'firstLogin'", tokens);
        // await dispatch('cacheState');
        await checkAuth();
    }

    async function loginByRefreshToken() {
        if (tokens.value.refresh === null || tokens.value.refresh === "") {
            console.warn("Couldn't get new token, refresh token isn't set", tokens);
            return;
        }
        let {access, expiryDate} = await getAuthByRefreshToken(tokens.value.refresh)
        tokens.value.access = access;
        tokens.value.expiryDate = (Date.now()) + expiryDate! * 1000;

        // await dispatch('cacheState');
        await checkAuth()
    }

    let tokenTimeout: NodeJS.Timeout;

    async function spotifyLogout() {
        tokens.value = {
            code: null,
            access: null,
            refresh: null,
            expiryDate: null,
        }
        userInfo.value = {
            id: '',
            name: '',
            mail: '',
            country: '',
            followers: 0,
            avatar: 'img/no-user.jpg',
        }
        // await dispatch('cacheState');
        clearTimeout(tokenTimeout);
    }

    async function checkAuth() {
        let now = Date.now()
        if (tokens.value.expiryDate !== null && tokens.value.expiryDate > now) {
            console.log("WE HAVE AN EXPIRY DATE");
            api.setAccessToken(tokens.value.access)
            events.emit('accessToken')

            let msUntilExpire = tokens.value.expiryDate - now;
            console.log("msUntilExpire", msUntilExpire);
            clearTimeout(tokenTimeout)
            tokenTimeout = setTimeout(async () => {
                await loginByRefreshToken()
            }, msUntilExpire - 1000 * 60 * 5)

            await baseDb.put('keyval', JSON.parse(JSON.stringify(tokens.value)), 'tokens')
            await loadLibraries()
        } else {
            console.warn("Auth has expired, getting new token")
            //auth is expired
            await loginByRefreshToken()
        }
    }

    const waitFor = async (event: string) => new Promise(resolve => {
        events.on(event, resolve)
    })
    const awaitAuth = async () => {
        if (api.getAccessToken() !== null) return
        return await waitFor('accessToken')
    }

    async function loadLibraries() {
        refreshUserInfo();
    }

    async function refreshUserInfo() {
        let me = await api.getMe();
        userInfo.value = {
            id: me.id,
            name: me.display_name ?? me.email,
            mail: me.email,
            country: me.country,
            followers: me.followers?.total ?? 0,
            avatar: me.images?.[0]?.url ?? 'img/user/1.png',
        }
    }

    watch(secret, async () => {
        let dbSecret = await baseDb.get('keyval', 'secret');
        if (dbSecret !== undefined) {
            if (dbSecret !== secret.value)
                await baseDb.put('keyval', secret.value, 'secret')
        } else
            await baseDb.add('keyval', secret.value, 'secret')
    })
    watch(clientId, async () => {
        let dbClientId = await baseDb.get('keyval', 'clientId');
        if (dbClientId !== undefined) {
            if (dbClientId !== clientId.value)
                await baseDb.put('keyval', clientId.value, 'clientId')
        } else
            await baseDb.add('keyval', clientId.value, 'clientId')
    })

    loadValues().then(() => console.log("Loaded idb values into store"));

    return {getAuthByCode, isLoggedIn, requestedScopes, secret, clientId, hasCredentials, userInfo, login}
})