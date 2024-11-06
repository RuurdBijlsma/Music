import { defineStore } from 'pinia'
import { useBaseStore } from './base'
import SpotifyWebApi from 'spotify-web-api-js'
import { useLibraryStore } from './library'
import { useSpotifyAuthStore } from './spotify-auth'
import { Item } from '../scripts/types'
import { executeCached } from '../scripts/utils'
import { toRaw } from 'vue'
import { baseDb } from '../scripts/database'
import log from 'electron-log/renderer'

export const useSpotifyApiStore = defineStore('spotify-api', () => {
    const library = useLibraryStore()
    const spotifyAuth = useSpotifyAuthStore()
    const base = useBaseStore()
    const api = new SpotifyWebApi()

    const get = <T>(fun: (...args: any) => T, args: any[] = [], useCache = false) =>
        executeCached(
            () => fun(...args),
            fun.toString() + JSON.stringify(args),
            1000 * 60 * 60 * 24 * 365 * 10,
            base.offlineMode || useCache
        )

    async function getItemTracks(item: Item): Promise<SpotifyApi.TrackObjectFull[]> {
        if (item.type === 'playlist') {
            if (item.tracks.items === undefined) {
                item = await getPlaylist(item.id)
            }
            return item.tracks.items.map((t) => t.track as SpotifyApi.TrackObjectFull)
        } else if (item.type === 'artist') {
            const result = await getArtistTopTracks(item.id)
            return result.tracks
        } else if (item.type === 'album') {
            if (item.tracks === undefined) {
                item = await getAlbum(item.id)
            }
            const tracks = item.tracks.items as SpotifyApi.TrackObjectFull[]
            for (const track of tracks) {
                //@ts-ignore
                track.album = {
                    images: [...item.images].map((i) => toRaw(i))
                }
            }
            return tracks
        }
        return []
    }

    function findPagination(object: any): Function | false {
        if (object === null) return false

        let getKeyPath: Function
        getKeyPath = ({ keys: keyPath = [], o }: { keys: any; o: any }) => {
            if (o !== null && o.hasOwnProperty('next') && o.hasOwnProperty('items'))
                return [true, keyPath]
            if (typeof o !== 'object' || o === null) return [false, keyPath.slice(0, -1)]

            for (const key in o) {
                if (!o.hasOwnProperty(key)) continue
                let result
                ;[result, keyPath] = getKeyPath({
                    keys: keyPath.concat(key),
                    o: o[key]
                })
                if (result) return [true, keyPath]
            }
            return [false, keyPath.slice(0, -1)]
        }

        const [success, keyPath] = getKeyPath({ o: object })

        if (!success) return false
        return (r: any) => {
            for (const key of keyPath) r = r[key]
            return r
        }
    }

    async function* retrieveArray<T>(apiFunction: Function): AsyncGenerator<T> {
        let getData = () => apiFunction()

        while (true) {
            const result = await getData()
            const pageObject = findPagination(result)

            if (result !== null) yield result

            if (result === null || pageObject === false || pageObject(result).next === null) break

            const nextUrl = pageObject(result).next
            if (nextUrl === undefined) log.warn('next url is undefined')

            getData = () => api.getGeneric(nextUrl) as Promise<T[]>
        }
    }

    const getPlaylist = async (id: string) => {
        const _getPlaylist = async () => {
            await spotifyAuth.awaitAuth()
            let playlist: SpotifyApi.PlaylistObjectFull | undefined
            for await (const batch of retrieveArray(() => api.getPlaylist(id))) {
                if (playlist === undefined) {
                    playlist = batch as SpotifyApi.PlaylistObjectFull
                } else if (playlist) {
                    //@ts-ignore batch type idk, doesn't matter
                    playlist.tracks.items.push(...batch.items)
                }
            }
            if (playlist === undefined) throw Error('Oh no')
            playlist.tracks.items = playlist.tracks.items.filter((t) => !t.is_local)
            return playlist
        }
        return await executeCached(_getPlaylist, `full-playlist-${id}`, 1000 * 60 * 60 * 24)
    }
    const getAlbum = async (id: string) => await get(api.getAlbum, [id])
    const getArtist = async (id: string, useCache = false) =>
        await get(api.getArtist, [id], useCache)
    const getArtistAlbums = async (id: string) => await get(api.getArtistAlbums, [id])
    const getArtistRelatedArtists = async (id: string) =>
        await get(api.getArtistRelatedArtists, [id])
    const getArtistTopTracks = async (id: string) =>
        await get(api.getArtistTopTracks, [id, library.userInfo.country])
    const getUser = async (id: string) => await get(api.getUser, [id])
    const getTrack = async (id: string, useCache = false) => await get(api.getTrack, [id], useCache)
    const getMe = async () => await get(api.getMe)
    const getMySavedTracks = async (options: Object | undefined = undefined) =>
        await get(api.getMySavedTracks, [options])
    const search = async (
        query: string,
        types: ('playlist' | 'album' | 'artist' | 'track')[],
        options: SpotifyApi.SearchForItemParameterObject | undefined = undefined
    ) => await get(api.search, [query, types, options])

    const getBrowsePage = async () =>
        await get(async () => {
            const [categories, genresResponse] = await Promise.all([
                api.getCategories({ limit: 50 }),
                getCachedGenres()
            ])

            const genres: string[] = genresResponse.genres.map((genre) =>
                genre
                    .split('-')
                    .map((w) => w.substring(0, 1).toUpperCase() + w.substring(1))
                    .join(' ')
            )
            return { categories: categories.categories.items, genres }
        })

    const getCategory = async (id: string) =>
        await get(async () => {
            await baseDb
            const playlists = await api.getCategoryPlaylists(id, {
                limit: 50
            })
            return {
                category: await api.getCategory(id),
                playlists: playlists.playlists.items as SpotifyApi.PlaylistObjectFull[]
            }
        }, [id])

    const getCachedGenres = async () =>
        await executeCached(() => api.getAvailableGenreSeeds(), 'seed-genres', 1000 * 60 * 60 * 24)

    const getGenres = async () =>
        await get(async () =>
            (await getCachedGenres()).genres.map((genre) =>
                genre
                    .split('-')
                    .map((w) => w.substring(0, 1).toUpperCase() + w.substring(1))
                    .join(' ')
            )
        )

    const getRadioTracks = async (options: any) =>
        await get(async () => {
            const db = await baseDb
            const dbKey = 'radio' + JSON.stringify(options)
            if (options.id) {
                const dbResult = await db.get('cache', dbKey)
                if (dbResult) return dbResult as SpotifyApi.RecommendationsObject
            }
            let firstTrack = null as null | SpotifyApi.TrackObjectFull
            if (options.hasOwnProperty('seed_tracks')) {
                const tracks = options['seed_tracks'].split(',')
                if (tracks.length === 1) firstTrack = await api.getTrack(tracks[0])
            }
            options = { ...options, limit: firstTrack ? 99 : 100 }
            const radio = await api.getRecommendations(options)
            if (firstTrack) radio.tracks.unshift(firstTrack)

            if (options.id) db.put('cache', radio, dbKey).then()

            return radio as SpotifyApi.RecommendationsObject
        }, [options])

    const getCachedArtists = async (ids: string[]) =>
        await get(() =>
            executeCached(
                async () => (await api.getArtists(ids)).artists,
                'artists' + JSON.stringify(ids),
                1000 * 60 * 60 * 24 * 31
            )
        )

    const getTrackFeatures = async (trackId: string) =>
        await get(api.getAudioFeaturesForTrack, [trackId], true)

    const getFeaturedPlaylists = async (options?: Object) =>
        await get(api.getFeaturedPlaylists, [options])
    const getMySavedAlbums = async (options?: Object) => await get(api.getMySavedAlbums, [options])
    const getFollowedArtists = async (options?: Object) =>
        await get(api.getFollowedArtists, [options])
    const getUserPlaylists = async (id: string, options?: Object) =>
        await get(api.getUserPlaylists, [id, options])
    const getNewReleases = async (options?: Object) => await get(api.getNewReleases, [options])

    return {
        getNewReleases,
        getUserPlaylists,
        getFollowedArtists,
        getMySavedAlbums,
        getPlaylist,
        getAlbum,
        getArtist,
        getArtistAlbums,
        getArtistRelatedArtists,
        getArtistTopTracks,
        getUser,
        getTrack,
        search,
        getMe,
        api,
        retrieveArray,
        getMySavedTracks,
        getItemTracks,
        getBrowsePage,
        getCategory,
        getGenres,
        getRadioTracks,
        getCachedArtists,
        getTrackFeatures,
        getFeaturedPlaylists
    }
})
