import { defineStore } from "pinia";
import { baseDb } from "./base";
import { useLibraryStore } from "./library";
import type { IDBPDatabase } from "idb";
import { usePlatformStore } from "./electron";
import type { ExtendedPlaylistTrack, Item } from "../types";
import { useSpotifyApiStore } from "./spotify-api";
import { executeCached } from "../../electron/utils";

export const useSearchStore = defineStore("search", () => {
    const platform = usePlatformStore();
    const library = useLibraryStore();
    const spotify = useSpotifyApiStore();

    let recentSearches: string[] = localStorage.getItem("recentSearch") === null ?
      [] : JSON.parse(localStorage.recentSearch);

    let db: IDBPDatabase;
    baseDb.then(r => db = r);

    function addToRecentSearches(query: string) {
        if (recentSearches.includes(query))
            recentSearches.splice(recentSearches.indexOf(query), 1);
        recentSearches.unshift(query);
        recentSearches.splice(5);
        localStorage.recentSearch = JSON.stringify(recentSearches);
    }

    function ytResultToTrack(ytResult: any): SpotifyApi.TrackObjectFull {
        return {
            available_markets: [],
            disc_number: 0,
            explicit: false,
            external_ids: {},
            external_urls: { spotify: "" },
            href: "",
            is_playable: false,
            preview_url: "",
            track_number: 0,
            uri: "",
            artists: [{
                name: ytResult.channel.replaceAll("\"", ""),
                type: "artist",
                id: ytResult.channelId,
                uri: "",
                href: ytResult.channelUrl,
                external_urls: { spotify: "" }
            }],
            album: {
                images: [{ url: ytResult.thumbnail }],
                type: "album",
                id: ytResult.playlistId,
                href: "",
                album_type: "youtube",
                external_urls: { spotify: "" },
                name: (ytResult.playlist ?? "").replaceAll("\"", ""),
                uri: ""
            },
            type: "track",
            name: ytResult.title.replaceAll("\"", ""),
            id: `yt-${ytResult.id}`,
            duration_ms: ytResult.duration * 1000,
            popularity: ytResult.viewCount
        };
    }

    let likedCache = {} as any;

    async function searchLikedTracks(query: string) {
        if (likedCache.hasOwnProperty(query)) {
            let res = likedCache[query];
            if (res.expiryDate < Date.now())
                delete likedCache[query];
            else
                return likedCache[query].result;
        }
        let tracks: ExtendedPlaylistTrack[];
        if (library.tracks.length > 0) {
            tracks = library.tracks;
        } else {
            await baseDb;
            tracks = await db.getAllFromIndex("tracks", "searchString");
        }
        let result = [] as SpotifyApi.TrackObjectFull[];
        let lowerQuery = query.toLowerCase();

        for (let track of tracks) {
            if (track.searchString && track.searchString.includes(lowerQuery))
                result.push(track.track as SpotifyApi.TrackObjectFull);
        }
        likedCache[query] = {
            result,
            // expiry date 5 minutes from now
            expiryDate: Date.now() + 1000 * 60 * 5
        };
        return result;
    }

    async function searchYouTube(query: string) {
        let rawResult = await platform.searchYouTube(query, 6);
        return rawResult.map(ytResultToTrack);
    }

    async function ytIdToTrack(id: string) {
        let rawResult = await platform.youTubeInfoById(id);
        return ytResultToTrack(rawResult);
    }

    async function searchSpotify(query: string) {
        return await executeCached(db, async () => {
            await baseDb;
            return await spotify.search(query, ["album", "artist", "playlist", "track"]);
        }, "sp" + query, 1000 * 60 * 5);
    }

    return { addToRecentSearches, searchLikedTracks, searchYouTube, searchSpotify, ytResultToTrack, ytIdToTrack };
});