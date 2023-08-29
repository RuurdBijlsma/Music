import {defineStore} from 'pinia'
import {baseDb} from './base'
import {useSpotifyStore} from "./spotify";
import type {IDBPDatabase} from "idb";
import {usePlatformStore} from "./electron";
import type {ExtendedPlaylistTrack, Item} from "../types";

export const useSearchStore = defineStore('search', () => {
    const platform = usePlatformStore();
    let recentSearches: string[] = localStorage.getItem('recentSearch') === null ?
        [] : JSON.parse(localStorage.recentSearch)

    const spotify = useSpotifyStore()
    let db: IDBPDatabase
    baseDb.then(r => db = r)

    function addToRecentSearches(query: string) {
        if (recentSearches.includes(query))
            recentSearches.splice(recentSearches.indexOf(query), 1)
        recentSearches.unshift(query)
        recentSearches.splice(5)
        localStorage.recentSearch = JSON.stringify(recentSearches)
    }

    function ytResultToItem(ytResult: any): Item {
        console.log('yt result to item', ytResult)
        return {
            available_markets: [],
            disc_number: 0,
            explicit: false,
            external_ids: {},
            external_urls: {spotify: ''},
            href: "",
            is_playable: false,
            preview_url: "",
            track_number: 0,
            uri: "",
            artists: [{
                name: ytResult.channel.replace('"', ''),
                type: 'artist',
                id: ytResult.channelId,
                uri: '',
                href: ytResult.channelUrl,
                external_urls: {spotify: ''},
            }],
            album: {
                images: [{url: ytResult.thumbnail}],
                type: 'album',
                id: ytResult.playlistId,
                href: '',
                album_type: 'youtube',
                external_urls: {spotify: ''},
                name: (ytResult.playlist ?? '').replace('"', ''),
                uri: ''
            },
            type: "track",
            name: ytResult.title.replace('"', ''),
            id: `yt${ytResult.id}`,
            duration_ms: ytResult.duration * 1000,
            popularity: ytResult.viewCount,
        }
    }

    let likedCache = {} as any;

    async function searchLikedTracks(query: string) {
        if (likedCache.hasOwnProperty(query)) {
            let res = likedCache[query];
            if (res.expiryDate < Date.now())
                delete likedCache[query]
            else
                return likedCache[query].result;
        }
        let tracks: ExtendedPlaylistTrack[]
        if (spotify.tracks.length > 0) {
            tracks = spotify.tracks
        } else {
            await baseDb
            tracks = await db.getAllFromIndex('tracks', 'searchString')
        }
        let result = [] as SpotifyApi.TrackObjectFull[]
        let lowerQuery = query.toLowerCase()

        for (let track of tracks) {
            if (track.searchString.includes(lowerQuery))
                result.push(track.track as SpotifyApi.TrackObjectFull)
        }
        console.log("Search result", result)
        likedCache[query] = {
            result,
            // expiry date 5 minutes from now
            expiryDate: Date.now() + 1000 * 60 * 5
        };
        return result
    }

    async function searchYouTube(query: string) {
        let rawResult = await platform.searchYouTube(query, 6)
        return rawResult.map(ytResultToItem)
    }

    async function searchSpotify(query: string) {
        let key = 'sp' + query
        let cache = await db.get('cache', key)
        if (cache) {
            if (cache.expiryDate < Date.now())
                db.delete('cache', key).then()
            else
                return cache.result;
        }
        await baseDb
        let result = await spotify.api.search(query, ['album', 'artist', 'playlist', 'track'])
        db.put('cache', {
            result,
            // expiry date 5 minutes from now
            expiryDate: Date.now() + 1000 * 60 * 5
        }, key).then()
        return result
    }

    return {addToRecentSearches, searchLikedTracks, searchYouTube, searchSpotify}
})