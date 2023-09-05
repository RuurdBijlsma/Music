import {defineStore} from 'pinia'
import {ref, toRaw} from "vue";
import {baseDb, useBaseStore} from './base'
import {usePlatformStore} from "./electron";
import type {IDBPDatabase} from "idb";
import type {ExtendedPlaylistTrack, Item, ItemType} from "../types";
import {usePlayerStore} from "./player";
import {useSpotifyApiStore} from "./spotify-api";
import {useSpotifyAuthStore} from "./spotify-auth";


export const useLibraryStore = defineStore('library', () => {
    const platform = usePlatformStore()
    const base = useBaseStore()
    const player = usePlayerStore()
    const spotify = useSpotifyApiStore()
    const spotifyAuth = useSpotifyAuthStore()
    let db: IDBPDatabase
    baseDb.then(r => {
        db = r
        loadValues().then(() => {
            console.log("Loaded idb values into store", performance.now())
        })
    })

    // Spotify UI variables
    const userInfo = ref({
        id: '',
        name: '',
        mail: '',
        country: '',
        followers: 0,
        avatar: 'img/no-user.jpg',
    })

    const saved = ref({
        playlist: [] as SpotifyApi.PlaylistObjectFull[],
        artist: [] as SpotifyApi.ArtistObjectFull[],
        album: [] as SpotifyApi.AlbumObjectFull[],
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
        let [dbSaved, dbView] = await Promise.all([
            db.get('spotify', 'saved'),
            db.get('spotify', 'view'),
        ])

        if (dbSaved)
            saved.value = dbSaved
        if (dbView)
            view.value = dbView

        if (localStorage.getItem('userInfo') !== null)
            userInfo.value = JSON.parse(localStorage.userInfo)
        console.log("Loading db value end", performance.now())
    }

    async function initialize() {
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
                await db.put('spotify', toRaw(saved.value), 'library')
            }
        }

        refreshUserData('playlist').then(checkDone);
        refreshUserData('artist').then(checkDone);
        refreshUserData('album').then(checkDone);
    }

    async function refreshUserInfo() {
        await baseDb;

        let me = await spotify.getMe();
        userInfo.value = {
            id: me.id,
            name: me.display_name ?? me.email,
            mail: me.email,
            country: me.country,
            followers: me.followers?.total ?? 0,
            avatar: me.images?.[0]?.url ?? '',
        }
        localStorage.userInfo = JSON.stringify(toRaw(userInfo.value))
        console.log(toRaw((userInfo.value)))
    }

    async function refreshUserData(type: 'playlist' | 'artist' | 'album') {
        await baseDb;

        if (isRefreshing.value[type]) {
            console.info("This library type is already refreshing, waiting for that to finish");
            await base.waitFor('refreshed' + type);
            return;
        }
        await spotifyAuth.awaitAuth();
        isRefreshing.value[type] = true;

        console.log({type});
        // if isInitial, the library in question doesn't have any loaded data yet,
        // so we load data by pushing items as they come in
        // else we replace the array only after all new data is loaded
        // @ts-ignore
        let isInitial = saved.value[type].length === 0;

        if (userInfo.value.id === '')
            await refreshUserInfo;

        let retrieval: Function, page = (r: any) => r;
        switch (type) {
            case 'playlist':
                retrieval = () => spotify.api.getUserPlaylists(userInfo.value.id, {limit: 50});
                break;
            case 'album':
                retrieval = () => spotify.api.getMySavedAlbums();
                break;
            case 'artist':
                retrieval = () => spotify.api.getFollowedArtists();
                page = r => r.artists;
                break;
        }

        let items: any[] = [];
        let addToLib = (item: any) => {
            if (isInitial) {
                // @ts-ignore
                saved.value[type].push(item)
            } else items.push(item);
        }

        for await(let batch of await spotify.retrieveArray(retrieval)) {
            for (let item of page(batch).items) {
                if (type === 'album')
                    addToLib(item.album);
                else
                    addToLib(item);
            }
        }
        if (!isInitial) {
            // @ts-ignore
            saved.value[type] = items;
        }

        base.events.emit('refreshed' + type);
        console.log(toRaw(saved.value));
        isRefreshing.value[type] = false;
    }

    async function loadDbTracks() {
        let type = 'track'
        if (isRefreshing.value['track']) {
            console.info("This library type is already refreshing, waiting for that to finish");
            await base.waitFor('refreshed' + type);
            return;
        }
        isRefreshing.value['track'] = true;
        let likedTracks = await db.getAllFromIndex('tracks', 'newToOld')
        tracks.value = likedTracks
        base.events.emit('refreshed' + type);
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
            await base.waitFor('refreshed' + type);
            return;
        }
        await spotifyAuth.awaitAuth();
        isRefreshing.value['track'] = true;

        let isInitial = tracks.value.length === 0;
        console.log("TRACK", {isInitial}, tracks.value.length)
        let items: ExtendedPlaylistTrack[] = [];
        likedTracksLoaded.value = 0;
        likedTracksTotal.value = 1;

        for await(let batch of await spotify.retrieveArray(() => spotify.api.getMySavedTracks({limit: 50}))) {
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

        base.events.emit('refreshed' + type);
        isRefreshing.value['track'] = false;
        console.log("DONE Loading liked tracks!");
    }

    async function refreshHomePage() {
        await baseDb;
        await spotifyAuth.awaitAuth();

        //Featured playlists
        let featured = await spotify.api.getFeaturedPlaylists({limit: 50});
        view.value.homePage.featured = {
            title: featured.message,
            playlists: featured.playlists.items,
        }

        //Personalized playlists
        let personalized;
        if (saved.value.playlist.length === 0) {
            await refreshUserData('playlist')
        }
        const discoverNames = ['Discover Weekly', 'Release Radar', ...[...Array(10)].map((_, i) => 'Daily Mix ' + (i + 1))];

        personalized = toRaw(saved.value).playlist.filter(playlist => discoverNames
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
        let newReleases = await spotify.api.getNewReleases({limit: 50})
        view.value.homePage.newReleases = newReleases.albums.items
        await db.put('spotify', toRaw(view.value), 'view')
    }

    function checkLiked(type: ItemType, id: string) {
        let result: ExtendedPlaylistTrack | undefined
        if (type === 'track') {
            result = tracks.value.find(t => t.track.id === id)
        } else {
            //@ts-ignore
            result = saved.value[type].find((t: any) => t.id === id)
        }
        return result !== undefined
    }

    async function toggleLike(item: Item) {
        await baseDb
        const type = item.type
        const id = item.id
        let liked = checkLiked(type, id)
        if (type === 'track') {
            if (liked) {
                await spotify.api.removeFromMySavedTracks([id])
                db.delete('tracks', id).then()
                tracks.value.splice(tracks.value.findIndex((t) => t.track.id === id), 1)
                console.log("Removed", item, "from favorites")
                if (!isRefreshing.value['track']) {
                    likedTracksTotal.value++
                    likedTracksLoaded.value++
                }
                return false
            } else {
                await spotify.api.addToMySavedTracks([id])
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
                await spotify.api.unfollowPlaylist(id)
                saved.value.playlist.splice(saved.value.playlist.findIndex(t => t.id === id), 1)
                return false
            } else {
                await spotify.api.followPlaylist(id)
                saved.value.playlist.unshift(item)
                return true
            }
        } else if (type === 'album') {
            if (liked) {
                await spotify.api.removeFromMySavedAlbums([id])
                saved.value.album.splice(saved.value.album.findIndex(t => t.id === id), 1)
                return false
            } else {
                await spotify.api.addToMySavedAlbums([id])
                saved.value.album.unshift(item)
                return true
            }
        } else if (type === 'artist') {
            if (liked) {
                await spotify.api.unfollowArtists([id])
                saved.value.artist.splice(saved.value.artist.findIndex(t => t.id === id), 1)
                return false
            } else {
                await spotify.api.followArtists([id])
                saved.value.artist.unshift(item)
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
        refreshHomePage,
        refreshUserData,
        userInfo,
        view,
        library: saved,
        tracks,
        likedTracksLoaded,
        likedTracksTotal,
        isRefreshing,
        toggleLike,
        activateSource,
        chooseSource,
        initialize,
        saved,
        checkLiked,
        loadLikedTracks,
    }
})