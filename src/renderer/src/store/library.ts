import { defineStore } from 'pinia'
import { computed, ref, toRaw } from 'vue'
import { useBaseStore } from './base'
import { usePlatformStore } from './electron'
import type { IDBPDatabase } from 'idb'
import type { Item, ItemCollection, ItemType, LikedTrack, SpotifyTrack } from '../scripts/types'
import { usePlayerStore } from './player/player'
import { useSpotifyApiStore } from './spotify-api'
import { useSpotifyAuthStore } from './spotify-auth'
import { randomUser } from '../scripts/image-sources'
import { useSearchStore } from './search'
import { useTrackLoaderStore } from './player/trackLoader'
import { executeCached, persistentRef } from '../scripts/utils'
import { useRouter } from 'vue-router'
import { baseDb } from '../scripts/database'
import { itemUrl } from '../scripts/item-utils'
import { useDialogStore } from './UI/dialogStore'
import log from 'electron-log/renderer'

export const useLibraryStore = defineStore('library', () => {
    const platform = usePlatformStore()
    const search = useSearchStore()
    const router = useRouter()
    const base = useBaseStore()
    const player = usePlayerStore()
    const spotify = useSpotifyApiStore()
    const spotifyAuth = useSpotifyAuthStore()
    const trackLoader = useTrackLoaderStore()
    const dialog = useDialogStore()

    const valuesLoaded = ref(false)
    let db: IDBPDatabase
    baseDb.then((r) => {
        db = r
        loadValues().then(() => {
            valuesLoaded.value = true
            base.events.emit('valuesLoaded')
        })
    })

    // Spotify UI variables
    const userInfo = persistentRef('userInfo', {
        id: '',
        name: '',
        mail: '',
        country: '',
        followers: 0,
        avatar: randomUser()
    })

    const saved = ref({
        playlist: [] as SpotifyApi.PlaylistObjectFull[],
        artist: [] as SpotifyApi.ArtistObjectFull[],
        album: [] as SpotifyApi.AlbumObjectFull[]
    })
    const tracks = ref([] as LikedTrack[])
    const viewedPlaylist = ref(null as SpotifyApi.PlaylistObjectFull | null)
    const viewedPlaylistRefreshRequired = ref(false)
    let likedDbChecked = false
    const likedListKey = ref(0)

    const userPlaylists = computed(() =>
        saved.value.playlist.filter((p) => p.owner.id === userInfo.value.id || p.collaborative)
    )
    const isRefreshing = ref({
        playlist: false,
        album: false,
        artist: false,
        track: false
    })
    const view = ref({
        homePage: {
            featured: {
                title: '' as string | undefined,
                playlists: [] as SpotifyApi.PlaylistObjectSimplified[]
            },
            newReleases: [] as any[],
            personalized: [] as any[]
        }
    })
    const offlineCollections = ref(new Set<string>([]))
    const recentPlays = ref([] as ItemCollection[])
    const lastTracksLoad = persistentRef<number>('lastTracksLoad', -1)

    // IndexedDB persistent storage
    async function loadValues() {
        const [dbSaved, dbView, dbOfflineCollections, dbRecentPlays] = await Promise.all([
            db.get('spotify', 'saved'),
            db.get('spotify', 'view'),
            db.get('spotify', 'offlineCollections'),
            db.get('spotify', 'recentPlays')
        ])

        if (dbRecentPlays) recentPlays.value = dbRecentPlays
        if (dbOfflineCollections) offlineCollections.value = new Set(dbOfflineCollections)
        if (dbSaved) saved.value = dbSaved
        if (dbView) view.value = dbView
    }

    async function initialize() {
        await baseDb

        await refreshUserInfo()
        let doneCount = 0

        loadDbTracks().then((tracksCached) => {
            likedDbChecked = true
            base.events.emit('likedDbCheck')
            if (!tracksCached) {
                loadLikedTracks().then(() => {})
            }
        })

        const checkDone = async () => {
            doneCount++
            if (doneCount === 3) {
                await db.put('spotify', toRaw(saved.value), 'library')
            }
        }

        refreshUserData('playlist').then(checkDone)
        refreshUserData('artist').then(checkDone)
        refreshUserData('album').then(checkDone)
    }

    async function refreshUserInfo() {
        await spotifyAuth.awaitAuth()

        const me = await executeCached(spotify.getMe, 'spotify-me', 1000 * 60 * 60 * 24 * 31)
        userInfo.value = {
            id: me.id,
            name: me.display_name ?? me.email,
            mail: me.email,
            country: me.country,
            followers: me.followers?.total ?? 0,
            avatar: me.images?.[0]?.url ?? ''
        }
    }

    async function refreshUserData(type: 'playlist' | 'artist' | 'album') {
        await baseDb

        if (isRefreshing.value[type]) {
            await base.waitFor('refreshed' + type)
            return
        }
        await spotifyAuth.awaitAuth()
        isRefreshing.value[type] = true

        // if isInitial, the library in question doesn't have any loaded data yet,
        // so we load data by pushing items as they come in
        // else we replace the array only after all new data is loaded
        // @ts-ignore
        const isInitial = saved.value[type].length === 0

        if (userInfo.value.id === '') await refreshUserInfo()

        let retrieval: Function,
            page = (r: any) => r
        switch (type) {
            case 'playlist':
                retrieval = () =>
                    spotify.getUserPlaylists(userInfo.value.id, {
                        limit: 50
                    })
                break
            case 'album':
                retrieval = () => spotify.getMySavedAlbums()
                break
            case 'artist':
                retrieval = () => spotify.getFollowedArtists()
                page = (r) => r.artists
                break
        }

        const items: any[] = []
        const addToLib = (item: any) => {
            if (isInitial) {
                // @ts-ignore
                saved.value[type].push(item)
            } else items.push(item)
        }

        for await (const batch of await spotify.retrieveArray(retrieval)) {
            for (const item of page(batch).items) {
                if (type === 'album') addToLib(item.album)
                else addToLib(item)
            }
        }
        if (!isInitial) {
            // @ts-ignore
            saved.value[type] = items
        }

        base.events.emit('refreshed' + type)
        isRefreshing.value[type] = false
    }

    async function loadDbTracks() {
        if (isRefreshing.value['track']) {
            await base.waitFor('refreshedTrack')
            return true
        }
        isRefreshing.value['track'] = true
        tracks.value = await getSortedTracksFromDB()
        base.events.emit('refreshedTrack')
        isRefreshing.value['track'] = false
        return tracks.value.length > 0
    }

    function enhancePlaylistObject(
        item: SpotifyApi.PlaylistTrackObject | SpotifyApi.SavedTrackObject
    ) {
        const track = item.track as SpotifyApi.TrackObjectFull
        const artistString = track.artists
            .map((a: SpotifyApi.ArtistObjectSimplified) => a.name)
            .join(', ')
            .toLowerCase()

        const searchString = track.name.toLowerCase() + ' ' + artistString
        const id = track.id
        const title = track.name
        const added_at_reverse = 10000000000000 - +new Date(item.added_at)

        return {
            ...item,
            track: item.track as SpotifyApi.TrackObjectFull,
            artistString,
            searchString,
            id,
            title,
            added_at_reverse,
            original: {
                name: track.name,
                artists: track.artists.map((a) => a.name)
            }
        } as LikedTrack
    }

    async function loadLikedTracks() {
        if (base.offlineMode) return
        await baseDb

        if (isRefreshing.value['track']) {
            await base.waitFor('refreshedTrack')
            return
        }
        await spotifyAuth.awaitAuth()
        isRefreshing.value['track'] = true
        let tracksRef = tracks
        let liveUpdates = true
        if (activeSort.value !== 'newToOld' || reverseSort.value) {
            // sort is not viable to use live updates
            tracksRef = ref(await db.getAllFromIndex('tracks', 'newToOld'))
            liveUpdates = false
        }

        // function to add track at the correct spot, sorted by date
        const addTrack = (track: LikedTrack) => {
            const spliceIndex = tracksRef.value.findIndex(
                (localTrack) => localTrack.added_at_reverse > track.added_at_reverse
            )
            tracksRef.value.splice(spliceIndex, 0, track)
            db.add('tracks', track)
        }

        const localTrackIds = new Set(tracksRef.value.map((t) => t.id))
        const apiTrackIds = new Set<string>()
        const apiTracks: { [key: string]: SpotifyApi.SavedTrackObject } = {}

        for await (const batch of await spotify.retrieveArray<SpotifyApi.UsersSavedTracksResponse>(
            () => spotify.api.getMySavedTracks({ limit: 50 })
        )) {
            for (const spotifyItem of batch.items) {
                const spotifyTrack: SpotifyTrack = spotifyItem.track
                if (spotifyTrack.is_local) continue
                if (!localTrackIds.has(spotifyItem.track.id)) {
                    // track exists in api list, not in local list
                    // so add it at the start of local tracks list
                    addTrack(enhancePlaylistObject(spotifyItem))
                }
                apiTrackIds.add(spotifyItem.track.id)
                apiTracks[spotifyItem.track.id] = spotifyItem
            }
        }
        // find tracks that are in the local Set, but not in the api Set
        // if they are spotify tracks, they must have been removed from liked tracks
        // so removed them from the local tracks list
        const removedFromLocal = [...localTrackIds].filter(
            (x) => !apiTrackIds.has(x) && !x.startsWith('yt-')
        )
        for (const id of removedFromLocal) {
            tracksRef.value.splice(
                tracksRef.value.findIndex((t) => t.id === id),
                1
            )
            db.delete('tracks', id).then()
        }

        // fix ordering of tracks
        const changedTracks: LikedTrack[] = []
        const missingAlbumTracks: LikedTrack[] = []
        for (const localTrack of tracksRef.value) {
            // skip over youtube tracks when determining reordering during update
            if (localTrack.id.startsWith('yt-') || !apiTracks.hasOwnProperty(localTrack.id))
                continue
            if (localTrack.track.album === null) {
                missingAlbumTracks.push(localTrack)
            }
            const apiTrack = apiTracks[localTrack.id]
            if (localTrack.added_at === apiTrack.added_at) continue
            localTrack.added_at = apiTrack.added_at
            localTrack.added_at_reverse = 10000000000000 - +new Date(apiTrack.added_at)
            changedTracks.push(localTrack)
        }
        if (missingAlbumTracks.length > 0) {
            let fixedTracks: SpotifyTrack[] = []
            for (let i = 0; i < missingAlbumTracks.length; i += 10) {
                const ids = missingAlbumTracks.slice(i, i + 10).map((t) => t.id)
                const newTracks = await spotify.api.getTracks(ids).then((i) => i.tracks)
                fixedTracks = fixedTracks.concat(newTracks)
            }
            if (missingAlbumTracks.length === fixedTracks.length) {
                const tx = db.transaction('tracks', 'readwrite')
                for (let i = 0; i < fixedTracks.length; i++) {
                    missingAlbumTracks[i].track = fixedTracks[i]
                    tx.store.put(toRaw(missingAlbumTracks[i]))
                }
                await tx.done
            }
        }
        // if sort is not default, make sure tracks.value is set to correct value
        if (changedTracks.length > 0) {
            const tx = db.transaction('tracks', 'readwrite')
            for (const likedTrack of changedTracks) tx.store.put(toRaw(likedTrack))
            await tx.done
            tracks.value = await getSortedTracksFromDB()
        } else if (!liveUpdates) {
            // if updates were not live, put them in tracks.value now
            // (or the changes from the refresh won't be shown in the UI until the page is reloaded)
            tracks.value = await getSortedTracksFromDB()
        }

        lastTracksLoad.value = Date.now()
        base.events.emit('refreshedTrack')
        isRefreshing.value['track'] = false
    }

    async function refreshHomePage() {
        await baseDb
        await spotifyAuth.awaitAuth()

        //Featured playlists
        const featured = await spotify.getFeaturedPlaylists({ limit: 50 })
        view.value.homePage.featured = {
            title: featured.message,
            playlists: featured.playlists.items
        }

        //Personalized playlists
        let personalized
        if (saved.value.playlist.length === 0) {
            await refreshUserData('playlist')
        }
        const discoverNames = [
            'Discover Weekly',
            'Release Radar',
            ...[...Array(10)].map((_, i) => 'Daily Mix ' + (i + 1))
        ]

        personalized = toRaw(saved.value).playlist.filter(
            (playlist) =>
                discoverNames.findIndex((name) => playlist.name.includes(name)) !== -1 &&
                playlist.owner.display_name === 'Spotify'
        )
        personalized.sort((a, b) => {
            const aI = discoverNames.findIndex((name) => a.name.includes(name))
            const bI = discoverNames.findIndex((name) => b.name.includes(name))
            return aI - bI
        })
        if (personalized.length > 0) {
            view.value.homePage.personalized = personalized
        }

        //New releases
        const newReleases = await spotify.getNewReleases({ limit: 50 })
        view.value.homePage.newReleases = newReleases.albums.items
        await db.put('spotify', toRaw(view.value), 'view')
    }

    function checkLiked(type: ItemType, id: string) {
        let result: LikedTrack | undefined
        if (type === 'track') {
            result = tracks.value.find((t) => t.track.id === id)
        } else {
            //@ts-ignore
            result = saved.value[type].find((t: any) => t.id === id)
        }
        return result !== undefined
    }

    async function toggleLike(item: Item | ItemCollection) {
        await baseDb
        const id = item.id
        if ('buttonText' in item) {
            if (
                item.type === 'liked' ||
                item.type === 'radio' ||
                item.type === 'search' ||
                item.type === 'youtube'
            )
                return false
            if (!item.context) return false
            item = item.context
        }
        // if ('buttonText' in item) return false;
        const liked = checkLiked(item.type, id)
        if (item.type === 'track') {
            const ytItem = item.id.startsWith('yt-')
            if (liked) {
                if (!ytItem) await spotify.api.removeFromMySavedTracks([id])

                db.delete('tracks', id).then()
                tracks.value.splice(
                    tracks.value.findIndex((t) => t.track.id === id),
                    1
                )
                return false
            } else {
                const date = new Date().toISOString()
                const playlistObject = enhancePlaylistObject({
                    track: toRaw(item) as SpotifyApi.TrackObjectFull,
                    added_at: date
                } as SpotifyApi.PlaylistTrackObject)

                // Spotify
                if (!ytItem) await spotify.api.addToMySavedTracks([id])

                db.add('tracks', playlistObject).then()
                tracks.value.unshift(playlistObject)
                return true
            }
        } else if (item.type === 'playlist') {
            if (liked) {
                await spotify.api.unfollowPlaylist(id)
                saved.value.playlist.splice(
                    saved.value.playlist.findIndex((t) => t.id === id),
                    1
                )
                return false
            } else {
                await spotify.api.followPlaylist(id)
                saved.value.playlist.unshift(item)
                return true
            }
        } else if (item.type === 'album') {
            if (liked) {
                await spotify.api.removeFromMySavedAlbums([id])
                saved.value.album.splice(
                    saved.value.album.findIndex((t) => t.id === id),
                    1
                )
                return false
            } else {
                await spotify.api.addToMySavedAlbums([id])
                saved.value.album.unshift(item)
                return true
            }
        } else if (item.type === 'artist') {
            if (liked) {
                await spotify.api.unfollowArtists([id])
                saved.value.artist.splice(
                    saved.value.artist.findIndex((t) => t.id === id),
                    1
                )
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
        if (player.playing) player.pause().then()
        dialog.source.show = true
        dialog.source.loading = true
        dialog.source.spotifyTrack = track

        const { query } = platform.trackToNames(track)
        const [options, trackData] = await Promise.all([
            search.searchYouTubeRaw(query, 10),
            trackLoader.getFullTrackData(track)
        ])

        dialog.source.loading = false
        dialog.source.items = options
        dialog.source.trackData = trackData
    }

    async function activateSource(ytId: string) {
        const trackData = dialog.source.trackData
        if (trackData === null) return
        const trackId = trackData.track.id
        const { outPath, query } = platform.trackToNames(trackData.track)

        if (await platform.checkFileExists(outPath)) await platform.deleteFile(outPath)
        trackData.metadata.youTubeSource = ytId
        delete trackData.metadata.sourceDuration
        delete trackData.metadata.trackBars
        delete trackData.metadata.volume

        await db.put('trackMetadata', toRaw(trackData.metadata))

        const likedInfo = tracks.value.find((t) => t.id === trackId)
        if (likedInfo !== undefined) {
            // remove end and start time from liked info
            delete likedInfo.startTime
            delete likedInfo.endTime
            await db.put('tracks', toRaw(likedInfo))
        }

        dialog.source.show = false
        trackLoader.changeSourceTracks.set(trackData.track.id, query + ytId)
        if (player.track !== null && player.collection !== null && player.trackId === trackId) {
            const collection = player.collection
            player.collection = null
            player.track = null

            await player.load(collection, trackData.track)
        }
    }

    async function addToPlaylist(playlistId: string, track: SpotifyApi.TrackObjectFull) {
        await baseDb
        await spotify.api.addTracksToPlaylist(playlistId, [track.uri])
        if (viewedPlaylist.value === null) return
        const trackInPlaylist = viewedPlaylist.value.tracks.items.find(
            (t) => t.track.id === track.id
        )
        if (trackInPlaylist === undefined) viewedPlaylistRefreshRequired.value = true
    }

    async function removeFromPlaylist(playlistId: string, trackUri: string) {
        await baseDb
        await spotify.api.removeTracksFromPlaylist(playlistId, [trackUri])
        if (viewedPlaylist.value === null) return
        const trackIndex = viewedPlaylist.value.tracks.items.findIndex(
            (t) => t.track.uri === trackUri
        )
        if (trackIndex === -1) return
        viewedPlaylist.value.tracks.items.splice(trackIndex, 1)
    }

    async function editTrack(likedTrack: LikedTrack) {
        const likedInfo = tracks.value.find((t) => t.id === likedTrack.id)
        if (!likedInfo) return log.warn('You can only edit tracks in your liked tracks')
        player.pause().then()
        dialog.edit.likedTrack = likedTrack
        dialog.edit.durationRange = [
            likedInfo.startTime ?? 0,
            likedInfo.endTime ?? likedTrack.track.duration_ms / 1000
        ]
        dialog.edit.title = likedTrack.track.name
        dialog.edit.artists = likedTrack.track.artists.map((a) => a.name)
        dialog.edit.show = true
        dialog.edit.loading = true
        dialog.edit.trackData = await trackLoader.getFullTrackData(likedTrack.track)
        dialog.edit.loading = false
    }

    async function applyEditChanges(
        likedTrack: LikedTrack,
        name: string,
        artists: string[],
        durationRange: number[]
    ) {
        likedTrack.track.name = name
        likedTrack.title = name
        if (likedTrack.track.artists.length === artists.length)
            for (let i = 0; i < artists.length; i++) likedTrack.track.artists[i].name = artists[i]
        likedTrack.artistString = artists.join(', ')
        likedTrack.searchString = `${name.toLowerCase()} ${likedTrack.artistString}`
        likedTrack.startTime = durationRange[0]
        likedTrack.endTime = durationRange[1]
        await db.put('tracks', toRaw(likedTrack))

        if (
            player.track !== null &&
            player.collection !== null &&
            player.trackId === likedTrack.track.id
        ) {
            const collection = player.collection
            player.collection = null
            player.track = null
            player.sourcePath = ''

            await player.load(collection, likedTrack.track)
        }

        return true
    }

    async function createPlaylistFromDialog() {
        if (dialog.playlist.startTrack === null) return false

        const playlist = await spotify.api.createPlaylist(userInfo.value.id, {
            name: dialog.playlist.title,
            description: dialog.playlist.description,
            collaborative: dialog.playlist.isCollaborative,
            public: dialog.playlist.isPublic
        })
        await addToPlaylist(playlist.id, dialog.playlist.startTrack)
        spotify.getPlaylist(playlist.id).then((p) => saved.value.playlist.unshift(p))

        dialog.playlist.show = false
        await router.push(itemUrl(playlist))
        return true
    }

    const activeSort = persistentRef('activeSort', 'newToOld')
    const reverseSort = persistentRef('reverseSort', false)

    async function getSortedTracksFromDB() {
        const sortedTracks = await db.getAllFromIndex('tracks', activeSort.value)
        if (reverseSort.value) sortedTracks.reverse()
        return sortedTracks
    }

    async function sortLiked(index: string, reverse = false) {
        activeSort.value = index
        reverseSort.value = reverse
        tracks.value = await getSortedTracksFromDB()
    }

    async function fixTrackAlbum(track: SpotifyApi.TrackObjectFull) {
        const fixed = await spotify.getTrack(track.id, true)
        track.album = fixed.album
        return track
    }

    return {
        fixTrackAlbum,
        activeSort,
        reverseSort,
        sortLiked,
        createPlaylistFromDialog,
        addToPlaylist,
        removeFromPlaylist,
        refreshHomePage,
        refreshUserData,
        userInfo,
        view,
        library: saved,
        tracks,
        isRefreshing,
        toggleLike,
        activateSource,
        chooseSource,
        initialize,
        saved,
        checkLiked,
        loadLikedTracks,
        userPlaylists,
        viewedPlaylist,
        viewedPlaylistRefreshRequired,
        offlineCollections,
        recentPlays,
        valuesLoaded,
        likedDbChecked,
        likedListKey,
        editTrack,
        applyEditChanges,
        lastTracksLoad
    }
})
