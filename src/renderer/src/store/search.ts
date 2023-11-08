import { defineStore } from "pinia";
import { baseDb, useBaseStore } from "./base";
import { useLibraryStore } from "./library";
import type { IDBPDatabase } from "idb";
import { usePlatformStore } from "./electron";
import { useSpotifyApiStore } from "./spotify-api";
import { useRouter } from "vue-router";
import type {
    ItemCollection,
    LikedTrack,
    SearchResult,
    YouTubeSearchResult,
    YouTubeTrack,
} from "../scripts/types";
import { Ref, ref, watch } from "vue";
import { usePlayerStore } from "./player/player";
import { executeCached, hmsToSeconds } from "../scripts/utils";
import YouTubeSearchAPI from "youtube-search-api";

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
            showSuggestions.value = false;
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
        });
        searchYouTube(query).then((res) => {
            result.value.youtube.loading = false;
            result.value.youtube.tracks = res;
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

    function ytSearchResultToTrack(
        ytSearchResult: YouTubeSearchResult,
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
                    name: ytSearchResult.channelTitle.replaceAll('"', ""),
                    type: "artist",
                    id: "yt-" + ytSearchResult.channelTitle,
                    uri: "",
                    href: ytSearchResult.channelTitle,
                    external_urls: { spotify: "" },
                },
            ],
            album: {
                images: ytSearchResult.thumbnail.thumbnails.reverse(),
                type: "album",
                id: "yt-NA",
                href: "",
                album_type: "youtube",
                external_urls: { spotify: "" },
                name: "yt-NA",
                uri: "",
            },
            type: "track",
            name: ytSearchResult.title.replaceAll('"', ""),
            id: `yt-${ytSearchResult.id}`,
            duration_ms:
                hmsToSeconds(ytSearchResult.length?.simpleText ?? 0) * 1000,
            popularity: 80,
        };
    }

    function ytResultToTrack(
        ytResult: YouTubeTrack,
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
                images: ytResult.thumbnails ?? [{ url: ytResult.thumbnail }],
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
        let tracks: LikedTrack[];
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

    async function searchYouTubeRaw(query: string, limit = 10) {
        return await executeCached<YouTubeSearchResult[]>(
            db,
            async () => {
                return (
                    await YouTubeSearchAPI.GetListByKeyword(
                        query,
                        false,
                        limit,
                        {
                            type: "video",
                        },
                    )
                ).items.filter((i) => i.type === "video");
            },
            "ytsearch" + query + limit,
            // 1,
            1000 * 60 * 60 * 24 * 7,
        );
    }

    async function searchYouTube(query: string, limit = 10) {
        let results = await searchYouTubeRaw(query, limit);
        return results.map(ytSearchResultToTrack);
    }

    async function ytIdToTrack(id: string) {
        let rawResult = await platform.youTubeInfoById(id);
        console.log({ rawResult });
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
        ytSearchResultToTrack,
        searchYouTubeRaw,
    };
});
