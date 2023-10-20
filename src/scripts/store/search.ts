import { defineStore } from "pinia";
import { baseDb, useBaseStore } from "./base";
import { useLibraryStore } from "./library";
import type { IDBPDatabase } from "idb";
import { usePlatformStore } from "./electron";
import type { ExtendedPlaylistTrack } from "../types";
import { useSpotifyApiStore } from "./spotify-api";
import { executeCached } from "../../electron/utils";
import { useRouter } from "vue-router";
import type { ItemCollection } from "../types";
import { ref, watch } from "vue";

export const useSearchStore = defineStore("search", () => {
    const platform = usePlatformStore();
    const library = useLibraryStore();
    const spotify = useSpotifyApiStore();
    const router = useRouter();
    const base = useBaseStore();

    let recentSearches: string[] = localStorage.getItem("recentSearch") === null ?
      [] : JSON.parse(localStorage.recentSearch);

    let db: IDBPDatabase;
    baseDb.then(r => db = r);


    const ytResult = ref([] as SpotifyApi.TrackObjectFull[]);
    const spotifyResult = ref([] as SpotifyApi.TrackObjectFull[]);
    const likedResult = ref([] as SpotifyApi.TrackObjectFull[]);
    const ytLoading = ref(false);
    const spotifyLoading = ref(false);
    const likedLoading = ref(false);
    const queryLoading = ref("");
    const searchValue = ref("");

    watch(searchValue, async () => {
        let url = searchValue.value;
        if (url === null || url === "") return;
        if (url.includes("open.spotify.com/")) {
            let term = url.split("spotify.com/")[1].split("?")[0];
            let [type, id] = term.split("/");
            if (type === "track") {
                let track = await spotify.getTrack(id);
                await router.push(`/album/${base.encodeUrlName(track.album.name)}/${track.album.id}?play=${id}`);
            } else {
                await router.push(`/${type}/from-url/${id}`);
            }
            base.addSnack("Navigated to Spotify™ link");
            searchValue.value = "";
        }

        let match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (match !== null && !!match[1] && match[1].length === 11) {
            base.addSnack("Locating YouTube™ track... Please wait.");
            //https://youtu.be/PeAMGlDBB7c
            let id = match[1];
            searchValue.value = "";
            let track = await ytIdToTrack(id);
            player.load({
                tracks: [track],
                type: "youtube",
                id: track.id,
                name: `From YouTube URL`,
                buttonText: "",
                to: `/`
            } as ItemCollection, track);
        }
    });

    async function performSearch() {
        spotifyResult.value = [];
        ytResult.value = [];
        likedResult.value = [];
        if (searchValue.value === null || searchValue.value === "")
            return;

        let query = searchValue.value;
        ytLoading.value = true;
        spotifyLoading.value = true;
        likedLoading.value = true;
        queryLoading.value = query;

        addToRecentSearches(query);
        searchSpotify(query).then(res => {
            if (query === searchValue.value) {
                spotifyLoading.value = false;
                if (res.tracks)
                    spotifyResult.value = res.tracks.items;
            }
        });
        searchYouTube(query).then(res => {
            if (query === searchValue.value) {
                ytLoading.value = false;
                ytResult.value = res;
            }
        });
        searchLikedTracks(query).then(res => {
            if (query === searchValue.value) {
                likedLoading.value = false;
                likedResult.value = res;
            }
        });
    }

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

    return {
        addToRecentSearches,
        searchLikedTracks,
        searchYouTube,
        searchSpotify,
        ytResultToTrack,
        performSearch,
        ytResult,
        spotifyResult,
        likedResult,
        ytLoading,
        spotifyLoading,
        likedLoading,
        queryLoading,
        searchValue
    };
});