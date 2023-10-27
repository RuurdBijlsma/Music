import { defineStore } from "pinia";
import { baseDb, useBaseStore } from "./base";
import { useLibraryStore } from "./library";
import type { IDBPDatabase } from "idb";
import { usePlatformStore } from "./electron";
import { useSpotifyApiStore } from "./spotify-api";
import { useRouter } from "vue-router";
import type {
    ExtendedPlaylistTrack,
    ItemCollection,
    SearchResult,
    YouTubeTrackInfo,
} from "../scripts/types";
import { Ref, ref, watch } from "vue";
import { usePlayerStore } from "./player";
import { executeCached } from "../scripts/utils";

export const useSearchStore = defineStore("search", () => {
    const platform = usePlatformStore();
    const library = useLibraryStore();
    const spotify = useSpotifyApiStore();
    const router = useRouter();
    const base = useBaseStore();
    const player = usePlayerStore();

    let recentSearches: Ref<string[]> = ref(
        localStorage.getItem("recentSearch") === null
            ? []
            : JSON.parse(localStorage.recentSearch),
    );

    let db: IDBPDatabase;
    baseDb.then((r) => (db = r));

    const searchResults: Map<string, Ref<SearchResult>> = new Map();
    const suggestionResults: Ref<SearchResult | null> = ref(null);

    const searchValue = ref("");
    const showSuggestions = ref(false);

    watch(searchValue, async () => {
        let url = searchValue.value;
        if (url === null || url === "") return;
        if (url.includes("open.spotify.com/")) {
            let term = url.split("spotify.com/")[1].split("?")[0];
            let [type, id] = term.split("/");
            if (type === "track") {
                let track = await spotify.getTrack(id);
                await router.push(
                    `/album/${base.encodeUrlName(track.album.name)}/${
                        track.album.id
                    }?play=${id}`,
                );
            } else {
                await router.push(`/${type}/from-url/${id}`);
            }
            base.addSnack("Navigated to Spotify™ link");
            searchValue.value = "";
        }

        let match = url.match(
            /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        );
        if (match !== null && !!match[1] && match[1].length === 11) {
            base.addSnack("Locating YouTube™ track... Please wait.");
            //https://youtu.be/PeAMGlDBB7c
            let id = match[1];
            searchValue.value = "";
            let track = await ytIdToTrack(id);
            await player.load(
                {
                    tracks: [track],
                    type: "youtube",
                    id: track.id,
                    name: `From YouTube URL`,
                    buttonText: "",
                    to: `/`,
                } as ItemCollection,
                track,
            );
        }
    });

    function clearSuggestions() {
        suggestionResults.value = {
            youtube: {
                tracks: [],
                loading: true,
            },
            spotify: {
                data: {
                    tracks: [],
                    albums: [],
                    artists: [],
                    playlists: [],
                },
                loading: true,
            },
            liked: {
                tracks: [],
                loading: true,
            },
        } as SearchResult;
    }

    function cachedSearch(query: string): Ref<SearchResult> {
        if (!searchResults.has(query)) {
            return performSearch(query);
        }
        return searchResults.get(query) as Ref<SearchResult>;
    }

    function performSearch(query: string): Ref<SearchResult> {
        let result = ref({
            youtube: {
                tracks: [],
                loading: true,
            },
            spotify: {
                data: {
                    tracks: [],
                    albums: [],
                    artists: [],
                    playlists: [],
                },
                loading: true,
            },
            liked: {
                tracks: [],
                loading: true,
            },
        } as SearchResult);
        searchResults.set(query, result);
        if (query === null) return result;
        query = query.trim();
        addToRecentSearches(query);

        console.log("Performing search for ", query);
        searchSpotify(query).then((res) => {
            result.value.spotify.loading = false;
            if (res.tracks) result.value.spotify.data.tracks = res.tracks.items;
            if (res.playlists)
                result.value.spotify.data.playlists = res.playlists
                    .items as SpotifyApi.PlaylistObjectFull[];
            if (res.albums)
                result.value.spotify.data.albums = res.albums
                    .items as SpotifyApi.AlbumObjectFull[];
            if (res.artists)
                result.value.spotify.data.artists = res.artists.items;
            // console.log(toRaw(result.value.spotify));
        });
        searchYouTube(query).then((res) => {
            result.value.youtube.loading = false;
            result.value.youtube.tracks = res;
            console.log(res);
        });
        searchLikedTracks(query).then((res) => {
            result.value.liked.loading = false;
            result.value.liked.tracks = res;
        });
        return result;
    }

    function addToRecentSearches(query: string) {
        if (query === null || query === undefined || query.trim() === "")
            return;
        if (recentSearches.value.includes(query))
            recentSearches.value.splice(recentSearches.value.indexOf(query), 1);
        recentSearches.value.unshift(query);
        recentSearches.value.splice(5);
        localStorage.recentSearch = JSON.stringify(recentSearches.value);
    }

    function ytResultToTrack(
        ytResult: YouTubeTrackInfo,
    ): SpotifyApi.TrackObjectFull {
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
            artists: [
                {
                    name: ytResult.channel.replaceAll('"', ""),
                    type: "artist",
                    id: "yt-" + ytResult.channelId,
                    uri: "",
                    href: ytResult.channelUrl,
                    external_urls: { spotify: "" },
                },
            ],
            album: {
                images: [{ url: ytResult.thumbnail }],
                type: "album",
                id: ytResult.playlistId,
                href: "",
                album_type: "youtube",
                external_urls: { spotify: "" },
                name: (ytResult.playlist ?? "").replaceAll('"', ""),
                uri: "",
            },
            type: "track",
            name: ytResult.title.replaceAll('"', ""),
            id: `yt-${ytResult.id}`,
            duration_ms: ytResult.duration * 1000,
            popularity: ytResult.viewCount,
        };
    }

    let likedCache = {} as any;

    async function searchLikedTracks(query: string) {
        if (likedCache.hasOwnProperty(query)) {
            let res = likedCache[query];
            if (res.expiryDate < Date.now()) delete likedCache[query];
            else return likedCache[query].result;
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
            expiryDate: Date.now() + 1000 * 60 * 5,
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
        return await executeCached<SpotifyApi.SearchResponse>(
            db,
            async () => {
                await baseDb;
                return await spotify.search(query, [
                    "album",
                    "artist",
                    "playlist",
                    "track",
                ]);
            },
            "sp" + query,
            1000 * 60 * 5,
        );
    }

    return {
        searchYouTube,
        ytResultToTrack,
        performSearch,
        searchResults,
        searchValue,
        showSuggestions,
        recentSearches,
        cachedSearch,
        suggestionResults,
        clearSuggestions,
    };
});
