import { defineStore } from "pinia";
import { baseDb } from "./base";
import SpotifyWebApi from "spotify-web-api-js";
import { useLibraryStore } from "./library";
import { useSpotifyAuthStore } from "./spotify-auth";
import { Item } from "../scripts/types";
import { executeCached } from "../scripts/utils";
import { toRaw } from "vue";
import AvailableGenreSeedsResponse = SpotifyApi.AvailableGenreSeedsResponse;

export const useSpotifyApiStore = defineStore("spotify-api", () => {
    const library = useLibraryStore();
    const spotifyAuth = useSpotifyAuthStore();

    async function getItemTracks(
        item: Item,
    ): Promise<SpotifyApi.TrackObjectFull[]> {
        if (item.type === "playlist") {
            if (item.tracks.items === undefined) {
                item = await getPlaylist(item.id);
            }
            return item.tracks.items.map(
                (t) => t.track as SpotifyApi.TrackObjectFull,
            );
        } else if (item.type === "artist") {
            let result = await getArtistTopTracks(item.id);
            return result.tracks;
        } else if (item.type === "album") {
            if (item.tracks === undefined) {
                item = await getAlbum(item.id);
            }
            let tracks = item.tracks.items as SpotifyApi.TrackObjectFull[];
            for (let track of tracks) {
                //@ts-ignore
                track.album = {
                    images: [...item.images].map((i) => toRaw(i)),
                };
            }
            return tracks;
        }
        console.warn("Didn't upgrade item to full, type not supported", item);
        return [];
    }

    // Spotify API Stuff
    const api = new SpotifyWebApi();

    function findPagination(object: any): Function | false {
        if (object === null) return false;

        let getKeyPath: Function;
        getKeyPath = ({ keys: keyPath = [], o }: { keys: any; o: any }) => {
            if (
                o !== null &&
                o.hasOwnProperty("next") &&
                o.hasOwnProperty("items")
            )
                return [true, keyPath];
            if (typeof o !== "object" || o === null)
                return [false, keyPath.slice(0, -1)];

            for (let key in o) {
                if (!o.hasOwnProperty(key)) continue;
                let result;
                [result, keyPath] = getKeyPath({
                    keys: keyPath.concat(key),
                    o: o[key],
                });
                if (result) return [true, keyPath];
            }
            return [false, keyPath.slice(0, -1)];
        };

        let [success, keyPath] = getKeyPath({ o: object });

        if (!success) return false;
        return (r: any) => {
            for (let key of keyPath) r = r[key];
            return r;
        };
    }

    async function* retrieveArray(apiFunction: Function) {
        let getData = () => apiFunction();

        while (true) {
            let result = await getData();
            let pageObject = findPagination(result);

            if (result !== null) yield result;

            if (
                result === null ||
                pageObject === false ||
                pageObject(result).next === null
            )
                break;

            let nextUrl = pageObject(result).next;
            if (nextUrl === undefined) console.warn("next url is undefined");

            getData = () => api.getGeneric(nextUrl);
        }
    }

    const getPlaylist = async (id: string) => {
        await spotifyAuth.awaitAuth();
        let playlist = await api.getPlaylist(id);
        playlist.tracks.items = playlist.tracks.items.filter(
            (t) => !t.is_local,
        );
        return playlist;
    };
    const getAlbum = async (id: string) => {
        await baseDb;
        return api.getAlbum(id);
    };
    const getArtist = async (id: string) => {
        await baseDb;
        return api.getArtist(id);
    };
    const getArtistAlbums = async (id: string) => {
        await baseDb;
        return api.getArtistAlbums(id);
    };
    const getArtistRelatedArtists = async (id: string) => {
        await baseDb;
        return api.getArtistRelatedArtists(id);
    };
    const getArtistTopTracks = async (id: string) => {
        await baseDb;
        return api.getArtistTopTracks(id, library.userInfo.country);
    };
    const getUser = async (id: string) => {
        await baseDb;
        return api.getUser(id);
    };
    const getUserPlaylists = async (id: string) => {
        await baseDb;
        return api.getUserPlaylists(id);
    };
    const getTrack = async (id: string) => {
        await baseDb;
        return api.getTrack(id);
    };
    const getMe = async () => {
        await baseDb;
        return api.getMe();
    };
    const getMySavedTracks = async (
        options: Object | undefined = undefined,
    ) => {
        await baseDb;
        return api.getMySavedTracks(options);
    };
    const search = async (
        query: string,
        types: ("playlist" | "album" | "artist" | "track")[],
        options:
            | SpotifyApi.SearchForItemParameterObject
            | undefined = undefined,
    ): Promise<SpotifyApi.SearchResponse> => {
        await baseDb;
        return api.search(query, types, options);
    };

    const getBrowsePage = async () => {
        await baseDb;

        let [categories, genresResponse] = await Promise.all([
            api.getCategories({ limit: 50 }),
            getCachedGenres(),
        ]);

        let genres: string[] = genresResponse.genres.map((genre) =>
            genre
                .split("-")
                .map((w) => w.substring(0, 1).toUpperCase() + w.substring(1))
                .join(" "),
        );
        return { categories: categories.categories.items, genres };
    };

    const getCategory = async (id: string) => {
        await baseDb;
        let playlists = await api.getCategoryPlaylists(id, { limit: 50 });
        return {
            category: await api.getCategory(id),
            playlists: playlists.playlists
                .items as SpotifyApi.PlaylistObjectFull[],
        };
    };

    const getCachedGenres = async () => {
        return await executeCached<AvailableGenreSeedsResponse>(
            await baseDb,
            async () => {
                return await api.getAvailableGenreSeeds();
            },
            "seed-genres",
            1000 * 60 * 60 * 24,
        );
    };

    const getGenres = async () => {
        await baseDb;
        return (await getCachedGenres()).genres.map((genre) =>
            genre
                .split("-")
                .map((w) => w.substring(0, 1).toUpperCase() + w.substring(1))
                .join(" "),
        );
    };

    const getRadioTracks = async (options: any) => {
        const db = await baseDb;
        let dbKey = "radio" + JSON.stringify(options);
        if (options.id) {
            let dbResult = await db.get("cache", dbKey);
            if (dbResult) return dbResult as SpotifyApi.RecommendationsObject;
        }
        let firstTrack = null as null | SpotifyApi.TrackObjectFull;
        if (options.hasOwnProperty("seed_tracks")) {
            let tracks = options["seed_tracks"].split(",");
            if (tracks.length === 1) firstTrack = await api.getTrack(tracks[0]);
        }
        options = { ...options, limit: firstTrack ? 99 : 100 };
        let radio = await api.getRecommendations(options);
        if (firstTrack) radio.tracks.unshift(firstTrack);

        if (options.id) db.put("cache", radio, dbKey).then();

        return radio as SpotifyApi.RecommendationsObject;
    };

    const getCachedArtists = async (ids: string[]) => {
        return await executeCached<SpotifyApi.ArtistObjectFull[]>(
            await baseDb,
            async () => {
                return (await api.getArtists(ids)).artists;
            },
            "artists" + JSON.stringify(ids),
            1000 * 60 * 60 * 24 * 31,
        );
    };

    return {
        getPlaylist,
        getAlbum,
        getArtist,
        getArtistAlbums,
        getArtistRelatedArtists,
        getArtistTopTracks,
        getUser,
        getUserPlaylists,
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
    };
});
