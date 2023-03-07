import {defineStore} from 'pinia'
import {computed, Ref, ref, toRaw, watch} from "vue";
import {baseDb} from './base'
import SpotifyWebApi from "spotify-web-api-js";
import EventEmitter from 'events';
import {usePlatformStore} from "./electron";

//todo:
//  Add library tracks to indexeddb
//  change localstorage dings to idb
//  change dispatch('cacheState') calls to cache with indexeddb

export interface AuthToken {
    code: null | string,
    access: null | string,
    refresh: null | string,
    expiryDate: null | number,
}

export const useSpotifyStore = defineStore('spotify', () => {
    const platform = usePlatformStore()

    // Spotify UI variables
    const secret = ref('')
    const clientId = ref('')
    let tokens: Ref<AuthToken> = ref({
        code: null,
        access: null,
        refresh: null,
        expiryDate: null,
    })
    const userInfo = ref({
        id: '',
        name: '',
        mail: '',
        country: '',
        followers: 0,
        avatar: 'img/no-user.jpg',
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
    let library = ref({
        playlists: [] as any[],
        artists: [] as any[],
        albums: [] as any[],
        tracks: [] as any[],
    })
    let isRefreshing = ref({
        playlist: false,
        album: false,
        artist: false,
        track: false,
    })
    let view = ref({
        homePage: {
            featured: {
                title: '' as string | undefined,
                playlists: [] as any[]
            },
            newReleases: [] as any[],
            personalized: [] as any[],
            recent: [] as any,
        },
        playlist: {},
        album: {},
        artist: {},
        category: {},
        user: {},
    })

    // IndexedDB persistent storage
    async function loadValues() {
        let dbSecret = await baseDb.get('spotify', 'secret');
        let dbClientId = await baseDb.get('spotify', 'clientId');
        let dbTokens = await baseDb.get('spotify', 'tokens');
        let dbLibrary = await baseDb.get('spotify', 'library');
        let dbView = await baseDb.get('spotify', 'view');
        if (dbSecret)
            secret.value = dbSecret;
        if (dbClientId)
            clientId.value = dbClientId;
        if (dbLibrary)
            library.value = dbLibrary;
        if (dbView)
            view.value = dbView;
        if (dbTokens) {
            tokens.value = dbTokens;
            await checkAuth();
        }
    }
    watch(secret, async () => {
        let dbSecret = await baseDb.get('spotify', 'secret');
        if (dbSecret !== secret.value)
            await baseDb.put('spotify', secret.value, 'secret')
    })
    watch(clientId, async () => {
        let dbClientId = await baseDb.get('spotify', 'clientId');
        if (dbClientId !== clientId.value)
            await baseDb.put('spotify', clientId.value, 'clientId')
    })
    loadValues().then(() => console.log("Loaded idb values into store"));

    // Spotify API Stuff

    const api = new SpotifyWebApi()
    const requestedScopes = "ugc-image-upload user-read-email user-read-private playlist-read-collaborative playlist-modify-public playlist-read-private playlist-modify-private user-library-modify user-library-read user-top-read user-read-recently-played user-follow-read user-follow-modify"
    const events = new EventEmitter()

    async function getAuthByRefreshToken(refreshToken: string): Promise<AuthToken> {
        console.log('Refresh using refreshToken', refreshToken);
        let result = await (await fetch('https://accounts.spotify.com/api/token', {
            method: 'post',
            body: `grant_type=refresh_token&refresh_token=${refreshToken}&client_id=${clientId.value}&client_secret=${secret.value}`,
            headers: {'Content-Type': 'application/x-www-form-urlencoded',}
        })).text();
        try {
            let parsed = JSON.parse(result);
            console.log(parsed);
            return {
                access: parsed.access_token,
                expiryDate: (+new Date) + parsed.expires_in * 1000,
            } as AuthToken;
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
            let parsed = JSON.parse(result);
            if (parsed.error) {
                console.warn("Get auth by code error", parsed);
                return {} as AuthToken;
            }
            return {
                code: code,
                access: parsed.access_token,
                refresh: parsed.refresh_token,
                expiryDate: (+new Date) + parsed.expires_in * 1000,
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
        console.log('yea', tokens.value.expiryDate, now);
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

            console.log("Tokens ref object: ", tokens, 'toraw', toRaw);
            await baseDb.put('spotify', toRaw(tokens.value), 'tokens')
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
        console.log("Await auth, access token = ");
        if (isLoggedIn && api.getAccessToken() !== null) return
        return await waitFor('accessToken')
    }

    async function loadLibraries() {
        await refreshUserInfo();
        let doneCount = 0;
        let libLoaded = library.value.tracks.length !== 0;
        let checkDone = async () => {
            doneCount++;
            if (doneCount === (libLoaded ? 3 : 4)) {
                await baseDb.put('spotify', toRaw(library.value), 'library')
            }
        }

        refreshUserData('playlist').then(checkDone);
        refreshUserData('artist').then(checkDone);
        refreshUserData('album').then(checkDone);
        if (!libLoaded) {
            refreshUserData('track').then(checkDone);
        }
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

    function findPagination(object: any): Function | false {
        if (object === null)
            return false;

        let getKeyPath: Function;
        getKeyPath = ({keys: keyPath = [], o}: { keys: any, o: any }) => {
            if (o !== null && o.hasOwnProperty('next') && o.hasOwnProperty('items'))
                return [true, keyPath];
            if (typeof o !== 'object' || o === null)
                return [false, keyPath.slice(0, -1)];

            for (let key in o) {
                if (!o.hasOwnProperty(key))
                    continue;
                let result;
                [result, keyPath] = getKeyPath({keys: keyPath.concat(key), o: o[key]});
                if (result)
                    return [true, keyPath];
            }
            return [false, keyPath.slice(0, -1)];
        }

        let [success, keyPath] = getKeyPath({o: object});

        if (!success)
            return false;
        return (r: any) => {
            for (let key of keyPath)
                r = r[key];
            return r;
        }
    }

    async function* retrieveSpotifyArray(apiFunction: Function) {
        let getData = () => apiFunction()

        while (true) {
            let result = await getData();
            console.log('result', result);
            let pageObject = findPagination(result)
            console.log('pageObject', pageObject);

            if (result !== null)
                yield result;

            if (result === null || pageObject === false || pageObject(result).next === null)
                break;

            let nextUrl = pageObject(result).next;
            if (nextUrl === undefined)
                console.warn("next url is undefined");

            getData = () => api.getGeneric(nextUrl);
        }
    }

    async function refreshUserData(type: 'playlist' | 'artist' | 'track' | 'album' = 'playlist') {
        if (!['playlist', 'album', 'track', 'artist'].includes(type))
            console.warn("Wrong type set for refreshUserData!");

        if (isRefreshing.value[type]) {
            console.info("This library type is already refreshing, waiting for that to finish");
            await waitFor('refreshed' + type);
            return;
        }
        await awaitAuth();
        isRefreshing.value[type] = true;

        console.log({type});
        // is isInitial, the library in question doesn't have any loaded data yet,
        // so we load data by pushing items as they come in
        // else we replace the array only after all new data is loaded
        let isInitial = library.value[type + 's'].length === 0;

        if (userInfo.value.id === '')
            await refreshUserInfo;

        let retrieval: Function, page = (r: any) => r;
        switch (type) {
            case 'playlist':
                retrieval = () => api.getUserPlaylists(userInfo.value.id, {limit: 50});
                break;
            case 'album':
                retrieval = () => api.getMySavedAlbums();
                break;
            case 'artist':
                retrieval = () => api.getFollowedArtists();
                page = r => r.artists;
                break;
            case 'track':
                retrieval = () => api.getMySavedTracks({limit: 50});
                break;
        }

        let items: any[] = [];
        let addToLib = (item: any) => {
            if (isInitial) {
                library.value[type + 's'].push(item)
            }
            else items.push(item);
        }

        for await(let batch of await retrieveSpotifyArray(retrieval)) {
            for (let item of page(batch).items) {
                if (type === 'track')
                    addToLib(item.track);
                else if (type === 'album')
                    addToLib(item.album);
                else
                    addToLib(item);
            }
        }
        if (!isInitial) {
            library.value[type + 's'] = items;
        }

        events.emit('refreshed' + type);
        isRefreshing.value[type] = false;
    }

    async function refreshHomePage() {
        await awaitAuth();

        //Featured playlists
        let featured = await api.getFeaturedPlaylists({limit: 50});
        view.value.homePage.featured = {
            title: featured.message,
            playlists: featured.playlists.items,
        }

        //Personalized playlists
        let personalized;
        if (library.value.playlists.length === 0) {
            await refreshUserData('playlist')
        }
        const discoverNames = ['Discover Weekly', 'Release Radar', ...[...Array(10)].map((_, i) => 'Daily Mix ' + (i + 1))];

        personalized = library.value.playlists.filter(playlist => discoverNames
                .findIndex(name => playlist.name.includes(name)) !== -1 &&
            playlist.owner.display_name === 'Spotify'
        );
        personalized.sort((a, b) => {
            let aI = discoverNames.findIndex(name => a.name.includes(name));
            let bI = discoverNames.findIndex(name => b.name.includes(name));
            return aI - bI;
        });
        if (personalized.length > 0) {
            view.value.homePage.personalized = personalized;
        }

        //New releases
        let newReleases = await api.getNewReleases({limit: 50});
        view.value.homePage.newReleases = newReleases.albums.items;
    }

    return {
        refreshUserData,
        getAuthByCode,
        isLoggedIn,
        requestedScopes,
        secret,
        clientId,
        hasCredentials,
        userInfo,
        login
    }
})