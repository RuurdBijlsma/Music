import {defineStore} from 'pinia'
import {baseDb} from './base'
import type {Item} from './base'
import {useSpotifyStore} from "./spotify";
import type {IDBPDatabase} from "idb";

export interface SearchResult {
    liked: SpotifyApi.TrackObjectFull[],
    spotify: {
        artists: SpotifyApi.ArtistObjectFull[],
        tracks: SpotifyApi.TrackObjectFull[],
        albums: SpotifyApi.AlbumObjectSimplified[],
        playlists: SpotifyApi.PlaylistObjectSimplified[],
    },
    youtube: Item[],
}

export const useSearchStore = defineStore('search', () => {
    let recentSearches: string[] = localStorage.getItem('recentSearch') === null ?
        [] : JSON.parse(localStorage.recentSearch)

    const spotify = useSpotifyStore()
    let db: IDBPDatabase
    baseDb.then(r => db = r)

    async function query(term: string): Promise<SearchResult> {
        if (recentSearches.includes(term))
            recentSearches.splice(recentSearches.indexOf(term), 1)
        recentSearches.unshift(term)
        recentSearches.splice(5)
        localStorage.recentSearch = JSON.stringify(recentSearches)

        let [spotifyResponse, likedResponse, youtubeResponse] = await Promise.all([
            spotify.api.search(term, ['album', 'artist', 'playlist', 'track']),
            searchLikedTracks(term),
            new Promise(r => r([])),
        ])

        return {
            liked:likedResponse,
            youtube: youtubeResponse as Item[],
            spotify: {
                artists: spotifyResponse.artists?.items ?? [],
                albums: spotifyResponse.albums?.items ?? [],
                tracks: spotifyResponse.tracks?.items ?? [],
                playlists: spotifyResponse.playlists?.items ?? [],
            }
        }
    }

    async function searchLikedTracks(query: string) {
        await baseDb
        let tx = await db.transaction('tracks')
        let store = tx.objectStore('tracks')
        const searchIndex = store.index('searchString')
        let cursor = await searchIndex.openCursor()
        let lowerQuery = query.toLowerCase()

        console.log('search liked tracks, query: ', query);
        let filtered = [] as SpotifyApi.TrackObjectFull[];
        while (cursor) {
            let key = cursor.key as string;
            if (key.includes(lowerQuery)) {
                filtered.push(cursor.value)
            }

            cursor = await cursor.continue();
        }
        return filtered
    }

    return {query}
})