import {defineStore} from 'pinia'
import {baseDb} from './base'
import type {Item} from './base'
import {useSpotifyStore} from "./spotify";
import type {IDBPDatabase} from "idb";
import {usePlatformStore} from "./electron";

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
        return {
            artists: [{name: ytResult.channel}],
            type: "youtube",
            description: ytResult.description,
            display_name: ytResult.title,
            album_type: "single",
            to: "",
            album: {images: [{url: ytResult.thumbnail}]},
            images: [
                {url: ytResult.thumbnail}
            ],
            name: ytResult.title,
            id: `yt${ytResult.id}`,
            duration_ms: ytResult.duration * 1000,
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
        await baseDb
        let tx = await db.transaction('tracks')
        let store = tx.objectStore('tracks')
        const searchIndex = store.index('searchString')
        let cursor = await searchIndex.openCursor()
        let lowerQuery = query.toLowerCase()

        console.log('search liked tracks, query: ', query);
        let result = [] as SpotifyApi.TrackObjectFull[]
        while (cursor) {
            let key = cursor.key as string;
            if (key.includes(lowerQuery)) {
                result.push(cursor.value)
            }

            cursor = await cursor.continue();
        }
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