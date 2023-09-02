import {defineStore} from 'pinia'
import {computed, ref, toRaw, watch} from "vue";
import type {Ref} from 'vue';
import {baseDb, useBaseStore} from './base'
import SpotifyWebApi from "spotify-web-api-js";
import EventEmitter from 'events';
import {usePlatformStore} from "./electron";
import type {IDBPDatabase} from "idb";
import type {ExtendedPlaylistTrack, Item, ItemType} from "../types";
import {usePlayerStore} from "./player";

export interface AuthToken {
    code: null | string,
    access: null | string,
    refresh: null | string,
    expiryDate: null | number,
}

export const useSpotifyStore = defineStore('spotify', () => {
    const platform = usePlatformStore()
    const base = useBaseStore()
    const player = usePlayerStore()
    let db: IDBPDatabase;
    baseDb.then(r => {
        db = r
        loadValues().then(() => {
            console.log("Loaded idb values into store", performance.now())
        });
    });

    // Spotify UI variables
    const dbLoaded = ref(false);
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

    const library = ref({
        playlists: [] as SpotifyApi.PlaylistObjectFull[],
        artists: [] as SpotifyApi.ArtistObjectFull[],
        albums: [] as SpotifyApi.AlbumObjectFull[],
    })
    const tracks = ref([] as ExtendedPlaylistTrack[])
    const ytTracks = ref([] as ExtendedPlaylistTrack[])
    const likedTracksTotal = ref(1)
    const likedTracksLoaded = ref(0)

    const isRefreshing = ref({
        playlist: false,
        album: false,
        artist: false,
        track: false,
    })
    const view = ref({
        homePage: {
            featured: {
                title: '' as string | undefined,
                playlists: [] as SpotifyApi.PlaylistObjectSimplified[]
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
        console.log("Loading db value start", performance.now())
        let [dbLibrary, dbView] = await Promise.all([
            db.get('spotify', 'library'),
            db.get('spotify', 'view'),
        ])

        if (dbLibrary)
            library.value = dbLibrary;
        if (dbView)
            view.value = dbView;

        if (localStorage.getItem('secret') !== null) {
            secret.value = localStorage.secret
            console.log("[LOAD] secret.value = " + localStorage.secret)
        }
        if (localStorage.getItem('clientId') !== null) {
            clientId.value = localStorage.clientId
            console.log("[LOAD] clientId.value = " + localStorage.clientId)
        }
        if (localStorage.getItem('userInfo') !== null)
            userInfo.value = JSON.parse(localStorage.userInfo)
        if (localStorage.getItem('tokens') !== null) {
            tokens.value = JSON.parse(localStorage.tokens)
            console.log("[LOAD] tokens.value = ", JSON.parse(localStorage.tokens))
            checkAuth().then()
        }

        dbLoaded.value = true;
        console.log("Loading db value end", performance.now())
    }

    watch(secret, async () => {
        localStorage.secret = secret.value
        console.log("[WATCH] localStorage.secret = " + secret.value)
    })
    watch(clientId, async () => {
        localStorage.clientId = clientId.value
        console.log("[WATCH] localStorage.clientId = " + clientId.value)
    })

    // Spotify API Stuff

    const api = new SpotifyWebApi()
    const requestedScopes = "ugc-image-upload user-read-email user-read-private playlist-read-collaborative playlist-modify-public playlist-read-private playlist-modify-private user-library-modify user-library-read user-top-read user-read-recently-played user-follow-read user-follow-modify"
    const events = new EventEmitter();

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
        tokens.value.expiryDate = expiryDate;

        await checkAuth()
    }

    let tokenTimeout: number;

    async function spotifyLogout() {
        await baseDb;

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
        localStorage.userInfo = JSON.stringify(toRaw(userInfo.value))
        localStorage.tokens = JSON.stringify(toRaw(tokens.value))
        await db.delete('spotify', 'library')
        await db.delete('spotify', 'view')

        clearTimeout(tokenTimeout);
    }

    async function checkAuth() {
        await baseDb;

        let now = Date.now()
        console.log('yea', tokens.value.expiryDate, now);
        if (tokens.value.expiryDate !== null && tokens.value.expiryDate > now) {
            console.log("WE HAVE AN EXPIRY DATE");
            api.setAccessToken(tokens.value.access)
            events.emit('accessToken')

            let msUntilExpire = tokens.value.expiryDate - now;
            console.log("msUntilExpire", msUntilExpire);
            clearTimeout(tokenTimeout)
            tokenTimeout = window.setTimeout(async () => {
                await loginByRefreshToken()
            }, msUntilExpire - 1000 * 60 * 5)

            localStorage.tokens = JSON.stringify(toRaw(tokens.value))
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
        console.log("Await auth");
        if (isLoggedIn && api.getAccessToken() !== null) return
        return await waitFor('accessToken')
    }

    async function loadLibraries() {
        await baseDb;

        await refreshUserInfo();
        let doneCount = 0;
        loadDbTracks().then((tracksCached) => {
            if (tracksCached) {
                console.log("Tracks were loaded from cache")
            } else {
                console.log("Tracks NOT cached. Starting load tracks from spotify api")
                loadLikedTracks().then(() => {
                    console.log("Loaded tracks from spotify api")
                })
            }
        })

        let checkDone = async () => {
            doneCount++;
            if (doneCount === 3) {
                await db.put('spotify', toRaw(library.value), 'library')
            }
        }

        refreshUserData('playlist').then(checkDone);
        refreshUserData('artist').then(checkDone);
        refreshUserData('album').then(checkDone);
    }

    async function refreshUserInfo() {
        await baseDb;

        let me = await api.getMe();
        userInfo.value = {
            id: me.id,
            name: me.display_name ?? me.email,
            mail: me.email,
            country: me.country,
            followers: me.followers?.total ?? 0,
            avatar: me.images?.[0]?.url ?? '',
        }
        localStorage.userInfo = JSON.stringify(toRaw(userInfo.value))
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
            let result = await getData()
            let pageObject = findPagination(result)

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

    async function refreshUserData(type: 'playlist' | 'artist' | 'album') {
        await baseDb;

        if (isRefreshing.value[type]) {
            console.info("This library type is already refreshing, waiting for that to finish");
            await waitFor('refreshed' + type);
            return;
        }
        await awaitAuth();
        isRefreshing.value[type] = true;

        console.log({type});
        // if isInitial, the library in question doesn't have any loaded data yet,
        // so we load data by pushing items as they come in
        // else we replace the array only after all new data is loaded
        // @ts-ignore
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
        }

        let items: any[] = [];
        let addToLib = (item: any) => {
            if (isInitial) {
                // @ts-ignore
                library.value[type + 's'].push(item)
            } else items.push(item);
        }

        for await(let batch of await retrieveSpotifyArray(retrieval)) {
            for (let item of page(batch).items) {
                if (type === 'album')
                    addToLib(item.album);
                else
                    addToLib(item);
            }
        }
        if (!isInitial) {
            // @ts-ignore
            library.value[type + 's'] = items;
        }

        events.emit('refreshed' + type);
        console.log(toRaw(library.value));
        isRefreshing.value[type] = false;
    }

    async function loadDbTracks() {
        let type = 'track'
        if (isRefreshing.value['track']) {
            console.info("This library type is already refreshing, waiting for that to finish");
            await waitFor('refreshed' + type);
            return;
        }
        isRefreshing.value['track'] = true;
        let likedTracks = await db.getAllFromIndex('tracks', 'newToOld')
        tracks.value = likedTracks
        events.emit('refreshed' + type);
        isRefreshing.value['track'] = false;

        if (likedTracks.length !== 0) {
            likedTracksLoaded.value = likedTracks.length
            likedTracksTotal.value = likedTracks.length
            return true
        }
        return false
    }

    function enhancePlaylistObject(item: SpotifyApi.PlaylistTrackObject) {
        let track = item.track as SpotifyApi.TrackObjectFull
        let artistString = track.artists
            .map((a: SpotifyApi.ArtistObjectSimplified) => a.name)
            .join(', ')
            .toLowerCase()

        let searchString = track.name.toLowerCase() + ' ' + artistString
        let id = track.id
        let title = track.name
        let added_at_reverse = 10000000000000 - +(new Date(item.added_at))

        return {...item, artistString, searchString, id, title, added_at_reverse} as ExtendedPlaylistTrack
    }

    async function loadLikedTracks() {
        console.log("Loading liked tracks!");
        await baseDb;
        let type = 'track'

        if (isRefreshing.value['track']) {
            console.info("This library type is already refreshing, waiting for that to finish");
            await waitFor('refreshed' + type);
            return;
        }
        await awaitAuth();
        isRefreshing.value['track'] = true;

        let isInitial = tracks.value.length === 0;
        console.log("TRACK", {isInitial}, tracks.value.length)
        let items: ExtendedPlaylistTrack[] = [];
        likedTracksLoaded.value = 0;
        likedTracksTotal.value = 1;

        for await(let batch of await retrieveSpotifyArray(() => api.getMySavedTracks({limit: 50}))) {
            likedTracksTotal.value = batch.total;
            for (let item of batch.items) {
                likedTracksLoaded.value++;
                if (!item.track.is_local) {
                    items.push(item);
                    if (isInitial) {
                        tracks.value.push(item)
                    }
                }
            }
        }
        if (!isInitial) {
            tracks.value = items;
        }

        // put loaded tracks in db
        if (items.length > 0) {
            const tx = db.transaction('tracks', 'readwrite')
            let promises: Promise<any>[] = [db.clear('tracks')]
            for (let item of items) {
                promises.push(db.add('tracks', enhancePlaylistObject(item)))
            }
            await Promise.all([...promises, tx.done]);
            localStorage.lastTracksLoad = Date.now()
        }

        events.emit('refreshed' + type);
        isRefreshing.value['track'] = false;
        console.log("DONE Loading liked tracks!");
    }

    async function refreshHomePage() {
        await baseDb;
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

        personalized = toRaw(library.value).playlists.filter(playlist => discoverNames
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
        let newReleases = await api.getNewReleases({limit: 50})
        view.value.homePage.newReleases = newReleases.albums.items
        await db.put('spotify', toRaw(view.value), 'view')
    }

    async function getPlaylist(id: string) {
        await baseDb
        return api.getPlaylist(id)
    }

    function checkLiked(type: ItemType, id: string) {
        let result: ExtendedPlaylistTrack | undefined
        if (type === 'track') {
            result = tracks.value.find(t => t.track.id === id)
        } else {
            //@ts-ignore
            result = library.value[type].find((t: any) => t.id === id)
        }
        return result !== undefined
    }

    async function toggleLike(item: Item) {
        const type = item.type
        const id = item.id
        let liked = checkLiked(type, id)
        console.log({liked})
        if (type === 'track') {
            if (liked) {
                await api.removeFromMySavedTracks([id])
                db.delete('tracks', id).then()
                tracks.value.splice(tracks.value.findIndex((t) => t.track.id === id), 1)
                console.log("Removed", item, "from favorites")
                if (!isRefreshing.value['track']) {
                    likedTracksTotal.value++
                    likedTracksLoaded.value++
                }
                return false
            } else {
                await api.addToMySavedTracks([id])
                let date = (new Date()).toISOString()
                let playlistObject = enhancePlaylistObject({
                    track: toRaw(item) as SpotifyApi.TrackObjectFull,
                    added_at: date
                } as SpotifyApi.PlaylistTrackObject)
                tracks.value.unshift(playlistObject)
                db.add('tracks', playlistObject).then()
                console.log("Added", item, "to favorites")
                if (!isRefreshing.value['track']) {
                    likedTracksTotal.value--
                    likedTracksLoaded.value--
                }
                return true
            }
        } else if (type === 'playlist') {
            if (liked) {
                await api.unfollowPlaylist(id)
                return false
            } else {
                await api.followPlaylist(id)
                return true
            }
        } else if (type === 'album') {
            if (liked) {
                await api.removeFromMySavedAlbums([id])
                return false
            } else {
                await api.addToMySavedAlbums([id])
                return true
            }
        } else if (type === 'artist') {
            if (liked) {
                await api.unfollowArtists([id])
                return false
            } else {
                await api.followArtists([id])
                return true
            }
        }
        return false
    }

    async function chooseSource(track: SpotifyApi.TrackObjectFull) {
        if (player.playing)
            player.pause()
        base.sourceDialog.show = true
        base.sourceDialog.loading = true
        base.sourceDialog.spotifyTrack = track

        const {cacheKey, query} = platform.trackToNames(track)
        let [options, selectedId] = await Promise.all([
            platform.searchYouTube(query, 6),
            db.get('nameToId', cacheKey)
        ])
        console.log("SOURCE OPTIONS", options)
        console.log("Selected id", selectedId)

        base.sourceDialog.loading = false
        base.sourceDialog.items = options
        base.sourceSelectedId = selectedId ?? ''
    }

    async function activateSource(id: string) {
        let spotifyTrack = base.sourceDialog.spotifyTrack
        if (spotifyTrack === null) return
        const trackId = spotifyTrack.id
        const {cacheKey, outPath} = platform.trackToNames(spotifyTrack)
        await db.put('nameToId', id, cacheKey)
        console.log("updated db with new prefered nameToId")
        await platform.deleteFile(outPath)
        await db.delete('trackBars', spotifyTrack.id)
        if (player.track !== null && player.collection !== null && player.trackId === spotifyTrack.id) {
            base.sourceDialog.show = false

            base.sourceDialog.tempTrackOverride = {
                ytId: id,
                trackId: trackId,
            }
            await player.load(player.collection, spotifyTrack)
        }
    }

    return {
        dbLoaded,
        refreshHomePage,
        refreshUserData,
        getAuthByCode,
        isLoggedIn,
        requestedScopes,
        secret,
        clientId,
        hasCredentials,
        userInfo,
        login,
        view,
        api,
        library,
        tracks,
        likedTracksLoaded,
        likedTracksTotal,
        isRefreshing,
        getPlaylist,
        loadLikedTracks,
        checkLiked,
        toggleLike,
        chooseSource,
        activateSource,
    }
})