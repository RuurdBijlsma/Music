import { defineStore } from "pinia";
import { computed, ref, toRaw } from "vue";
import { baseDb, useBaseStore } from "./base";
import { usePlatformStore } from "./electron";
import type { IDBPDatabase } from "idb";
import type {
    Item,
    ItemCollection,
    ItemType,
    LikedTrack,
    SpotifyTrack,
} from "../scripts/types";
import { TrackData, YouTubeSearchResult } from "../scripts/types";
import { usePlayerStore } from "./player/player";
import { useSpotifyApiStore } from "./spotify-api";
import { useSpotifyAuthStore } from "./spotify-auth";
import { randomUser } from "../scripts/imageSources";
import { useSearchStore } from "./search";
import { useTrackLoaderStore } from "./player/trackLoader";
import { executeCached } from "../scripts/utils";

export const useLibraryStore = defineStore("library", () => {
    const platform = usePlatformStore();
    const search = useSearchStore();
    const base = useBaseStore();
    const player = usePlayerStore();
    const spotify = useSpotifyApiStore();
    const spotifyAuth = useSpotifyAuthStore();
    const trackLoader = useTrackLoaderStore();
    let valuesLoaded = ref(false);
    let db: IDBPDatabase;
    baseDb.then((r) => {
        db = r;
        loadValues().then(() => {
            valuesLoaded.value = true;
            base.events.emit("valuesLoaded");
        });
    });

    // Spotify UI variables
    const userInfo = ref({
        id: "",
        name: "",
        mail: "",
        country: "",
        followers: 0,
        avatar: randomUser(),
    });

    const saved = ref({
        playlist: [] as SpotifyApi.PlaylistObjectFull[],
        artist: [] as SpotifyApi.ArtistObjectFull[],
        album: [] as SpotifyApi.AlbumObjectFull[],
    });
    const tracks = ref([] as LikedTrack[]);
    const viewedPlaylist = ref(null as SpotifyApi.PlaylistObjectFull | null);
    const viewedPlaylistRefreshRequired = ref(false);
    let likedDbChecked = false;
    const likedListKey = ref(0);

    const editDialog = ref({
        show: false,
        loading: false,
        trackData: null as null | TrackData,
        likedTrack: null as null | LikedTrack,
        title: "",
        artists: [""],
        durationRange: [0, 1],
    });

    const sourceDialog = ref({
        show: false,
        items: [] as YouTubeSearchResult[],
        loading: false,
        spotifyTrack: null as SpotifyApi.TrackObjectFull | null,
        trackData: null as TrackData | null,
    });

    const userPlaylists = computed(() =>
        saved.value.playlist.filter(
            (p) => p.owner.id === userInfo.value.id || p.collaborative,
        ),
    );
    const isRefreshing = ref({
        playlist: false,
        album: false,
        artist: false,
        track: false,
    });
    const view = ref({
        homePage: {
            featured: {
                title: "" as string | undefined,
                playlists: [] as SpotifyApi.PlaylistObjectSimplified[],
            },
            newReleases: [] as any[],
            personalized: [] as any[],
        },
    });
    const offlineCollections = ref(new Set<string>([]));
    const recentPlays = ref([] as ItemCollection[]);

    // IndexedDB persistent storage
    async function loadValues() {
        let [dbSaved, dbView, dbOfflineCollections, dbRecentPlays] =
            await Promise.all([
                db.get("spotify", "saved"),
                db.get("spotify", "view"),
                db.get("spotify", "offlineCollections"),
                db.get("spotify", "recentPlays"),
            ]);

        if (dbRecentPlays) recentPlays.value = dbRecentPlays;
        if (dbOfflineCollections)
            offlineCollections.value = new Set(dbOfflineCollections);
        if (dbSaved) saved.value = dbSaved;
        if (dbView) view.value = dbView;

        if (localStorage.getItem("userInfo") !== null)
            userInfo.value = JSON.parse(localStorage.userInfo);
    }

    async function initialize() {
        await baseDb;

        await refreshUserInfo();
        let doneCount = 0;

        loadDbTracks().then((tracksCached) => {
            likedDbChecked = true;
            base.events.emit("likedDbCheck");
            if (!tracksCached) {
                loadLikedTracks().then(() => {});
            }
        });

        let checkDone = async () => {
            doneCount++;
            if (doneCount === 3) {
                await db.put("spotify", toRaw(saved.value), "library");
            }
        };

        refreshUserData("playlist").then(checkDone);
        refreshUserData("artist").then(checkDone);
        refreshUserData("album").then(checkDone);
    }

    async function refreshUserInfo() {
        await spotifyAuth.awaitAuth();

        let me = await executeCached(
            spotify.getMe,
            "spotify-me",
            1000 * 60 * 60 * 24 * 31,
        );
        userInfo.value = {
            id: me.id,
            name: me.display_name ?? me.email,
            mail: me.email,
            country: me.country,
            followers: me.followers?.total ?? 0,
            avatar: me.images?.[0]?.url ?? "",
        };
        localStorage.userInfo = JSON.stringify(toRaw(userInfo.value));
    }

    async function refreshUserData(type: "playlist" | "artist" | "album") {
        await baseDb;

        if (isRefreshing.value[type]) {
            await base.waitFor("refreshed" + type);
            return;
        }
        await spotifyAuth.awaitAuth();
        isRefreshing.value[type] = true;

        // if isInitial, the library in question doesn't have any loaded data yet,
        // so we load data by pushing items as they come in
        // else we replace the array only after all new data is loaded
        // @ts-ignore
        let isInitial = saved.value[type].length === 0;

        if (userInfo.value.id === "") await refreshUserInfo();

        let retrieval: Function,
            page = (r: any) => r;
        switch (type) {
            case "playlist":
                retrieval = () =>
                    spotify.getUserPlaylists(userInfo.value.id, {
                        limit: 50,
                    });
                break;
            case "album":
                retrieval = () => spotify.getMySavedAlbums();
                break;
            case "artist":
                retrieval = () => spotify.getFollowedArtists();
                page = (r) => r.artists;
                break;
        }

        let items: any[] = [];
        let addToLib = (item: any) => {
            if (isInitial) {
                // @ts-ignore
                saved.value[type].push(item);
            } else items.push(item);
        };

        for await (let batch of await spotify.retrieveArray(retrieval)) {
            for (let item of page(batch).items) {
                if (type === "album") addToLib(item.album);
                else addToLib(item);
            }
        }
        if (!isInitial) {
            // @ts-ignore
            saved.value[type] = items;
        }

        base.events.emit("refreshed" + type);
        isRefreshing.value[type] = false;
    }

    async function loadDbTracks() {
        if (isRefreshing.value["track"]) {
            await base.waitFor("refreshedTrack");
            return true;
        }
        isRefreshing.value["track"] = true;
        tracks.value = await db.getAllFromIndex("tracks", "newToOld");
        base.events.emit("refreshedTrack");
        isRefreshing.value["track"] = false;
        return tracks.value.length > 0;
    }

    function enhancePlaylistObject(
        item: SpotifyApi.PlaylistTrackObject | SpotifyApi.SavedTrackObject,
    ) {
        let track = item.track as SpotifyApi.TrackObjectFull;
        let artistString = track.artists
            .map((a: SpotifyApi.ArtistObjectSimplified) => a.name)
            .join(", ")
            .toLowerCase();

        let searchString = track.name.toLowerCase() + " " + artistString;
        let id = track.id;
        let title = track.name;
        let added_at_reverse = 10000000000000 - +new Date(item.added_at);

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
                artists: track.artists.map((a) => a.name),
            },
        } as LikedTrack;
    }

    async function loadLikedTracks() {
        await baseDb;

        if (isRefreshing.value["track"]) {
            await base.waitFor("refreshedTrack");
            return;
        }
        await spotifyAuth.awaitAuth();
        isRefreshing.value["track"] = true;

        // function to add track at the correct spot, sorted by date
        const addTrack = (track: LikedTrack) => {
            let spliceIndex = tracks.value.findIndex(
                (localTrack) =>
                    localTrack.added_at_reverse > track.added_at_reverse,
            );
            tracks.value.splice(spliceIndex, 0, track);
            db.add("tracks", track);
        };

        let localTrackIds = new Set(tracks.value.map((t) => t.id));
        let apiTrackIds = new Set<string>();
        let apiTracks: { [key: string]: SpotifyApi.SavedTrackObject } = {};

        for await (let batch of await spotify.retrieveArray<SpotifyApi.UsersSavedTracksResponse>(
            () => spotify.api.getMySavedTracks({ limit: 50 }),
        )) {
            for (let spotifyItem of batch.items) {
                let spotifyTrack: SpotifyTrack = spotifyItem.track;
                if (spotifyTrack.is_local) continue;
                if (!localTrackIds.has(spotifyItem.track.id)) {
                    // track exists in api list, not in local list
                    // so add it at the start of local tracks list
                    addTrack(enhancePlaylistObject(spotifyItem));
                }
                apiTrackIds.add(spotifyItem.track.id);
                apiTracks[spotifyItem.track.id] = spotifyItem;
            }
        }
        // find tracks that are in the local Set, but not in the api Set
        // if they are spotify tracks, they must have been removed from liked tracks
        // so removed them from the local tracks list
        let removedFromLocal = [...localTrackIds].filter(
            (x) => !apiTrackIds.has(x) && !x.startsWith("yt-"),
        );
        for (let id of removedFromLocal) {
            tracks.value.splice(
                tracks.value.findIndex((t) => t.id === id),
                1,
            );
            db.delete("tracks", id).then();
        }

        // fix ordering of tracks
        let changedTracks: LikedTrack[] = [];
        let missingAlbumTracks: LikedTrack[] = [];
        for (let localTrack of tracks.value) {
            // skip over youtube tracks when determining reordering during update
            if (
                localTrack.id.startsWith("yt-") ||
                !apiTracks.hasOwnProperty(localTrack.id)
            )
                continue;
            if (localTrack.track.album === null) {
                console.log(
                    "Liked track album not present, getting from spotify api",
                );
                missingAlbumTracks.push(localTrack);
            }
            let apiTrack = apiTracks[localTrack.id];
            if (localTrack.added_at === apiTrack.added_at) continue;
            localTrack.added_at = apiTrack.added_at;
            localTrack.added_at_reverse =
                10000000000000 - +new Date(apiTrack.added_at);
            changedTracks.push(localTrack);
        }
        if (missingAlbumTracks.length > 0) {
            let fixedTracks: SpotifyTrack[] = [];
            for (let i = 0; i < missingAlbumTracks.length; i += 10) {
                let ids = missingAlbumTracks.slice(i, i + 10).map((t) => t.id);
                console.log("GET SLICE", ids);
                let newTracks = await spotify.api
                    .getTracks(ids)
                    .then((i) => i.tracks);
                fixedTracks = fixedTracks.concat(newTracks);
            }
            if (missingAlbumTracks.length === fixedTracks.length) {
                const tx = db.transaction("tracks", "readwrite");
                for (let i = 0; i < fixedTracks.length; i++) {
                    missingAlbumTracks[i].track = fixedTracks[i];
                    tx.store.put(toRaw(missingAlbumTracks[i]));
                    console.log("Fixed", missingAlbumTracks[i].track.id);
                }
                await tx.done;
                console.log("Put fixed tracks in DB!");
            }
        }
        if (changedTracks.length > 0) {
            console.warn(
                "Tracks arent in order, updating order",
                changedTracks.map((t) => t.title),
            );
            const tx = db.transaction("tracks", "readwrite");
            for (let likedTrack of changedTracks)
                tx.store.put(toRaw(likedTrack));
            await tx.done;
            tracks.value = await db.getAllFromIndex("tracks", "newToOld");
        }

        localStorage.lastTracksLoad = Date.now();
        base.events.emit("refreshedTrack");
        isRefreshing.value["track"] = false;
    }

    async function refreshHomePage() {
        await baseDb;
        await spotifyAuth.awaitAuth();

        //Featured playlists
        let featured = await spotify.getFeaturedPlaylists({ limit: 50 });
        view.value.homePage.featured = {
            title: featured.message,
            playlists: featured.playlists.items,
        };

        //Personalized playlists
        let personalized;
        if (saved.value.playlist.length === 0) {
            await refreshUserData("playlist");
        }
        const discoverNames = [
            "Discover Weekly",
            "Release Radar",
            ...[...Array(10)].map((_, i) => "Daily Mix " + (i + 1)),
        ];

        personalized = toRaw(saved.value).playlist.filter(
            (playlist) =>
                discoverNames.findIndex((name) =>
                    playlist.name.includes(name),
                ) !== -1 && playlist.owner.display_name === "Spotify",
        );
        personalized.sort((a, b) => {
            let aI = discoverNames.findIndex((name) => a.name.includes(name));
            let bI = discoverNames.findIndex((name) => b.name.includes(name));
            return aI - bI;
        });
        if (personalized.length > 0) {
            view.value.homePage.personalized = personalized;
        }

        //New releases
        let newReleases = await spotify.getNewReleases({ limit: 50 });
        view.value.homePage.newReleases = newReleases.albums.items;
        await db.put("spotify", toRaw(view.value), "view");
    }

    function checkLiked(type: ItemType, id: string) {
        let result: LikedTrack | undefined;
        if (type === "track") {
            result = tracks.value.find((t) => t.track.id === id);
        } else {
            //@ts-ignore
            result = saved.value[type].find((t: any) => t.id === id);
        }
        return result !== undefined;
    }

    async function toggleLike(item: Item | ItemCollection) {
        await baseDb;
        const id = item.id;
        if ("buttonText" in item) {
            if (
                item.type === "liked" ||
                item.type === "radio" ||
                item.type === "search" ||
                item.type === "youtube"
            )
                return false;
            if (!item.context) return false;
            item = item.context;
        }
        // if ('buttonText' in item) return false;
        let liked = checkLiked(item.type, id);
        if (item.type === "track") {
            let ytItem = item.id.startsWith("yt-");
            if (liked) {
                if (!ytItem) await spotify.api.removeFromMySavedTracks([id]);

                db.delete("tracks", id).then();
                tracks.value.splice(
                    tracks.value.findIndex((t) => t.track.id === id),
                    1,
                );
                return false;
            } else {
                let date = new Date().toISOString();
                let playlistObject = enhancePlaylistObject({
                    track: toRaw(item) as SpotifyApi.TrackObjectFull,
                    added_at: date,
                } as SpotifyApi.PlaylistTrackObject);

                // Spotify
                if (!ytItem) await spotify.api.addToMySavedTracks([id]);

                db.add("tracks", playlistObject).then();
                tracks.value.unshift(playlistObject);
                return true;
            }
        } else if (item.type === "playlist") {
            if (liked) {
                await spotify.api.unfollowPlaylist(id);
                saved.value.playlist.splice(
                    saved.value.playlist.findIndex((t) => t.id === id),
                    1,
                );
                return false;
            } else {
                await spotify.api.followPlaylist(id);
                saved.value.playlist.unshift(item);
                return true;
            }
        } else if (item.type === "album") {
            if (liked) {
                await spotify.api.removeFromMySavedAlbums([id]);
                saved.value.album.splice(
                    saved.value.album.findIndex((t) => t.id === id),
                    1,
                );
                return false;
            } else {
                await spotify.api.addToMySavedAlbums([id]);
                saved.value.album.unshift(item);
                return true;
            }
        } else if (item.type === "artist") {
            if (liked) {
                await spotify.api.unfollowArtists([id]);
                saved.value.artist.splice(
                    saved.value.artist.findIndex((t) => t.id === id),
                    1,
                );
                return false;
            } else {
                await spotify.api.followArtists([id]);
                saved.value.artist.unshift(item);
                return true;
            }
        }
        return false;
    }

    async function chooseSource(track: SpotifyApi.TrackObjectFull) {
        if (player.playing) player.pause().then();
        sourceDialog.value.show = true;
        sourceDialog.value.loading = true;
        sourceDialog.value.spotifyTrack = track;

        const { query } = platform.trackToNames(track);
        let [options, trackData] = await Promise.all([
            search.searchYouTubeRaw(query, 10),
            trackLoader.getFullTrackData(track),
        ]);

        sourceDialog.value.loading = false;
        sourceDialog.value.items = options;
        sourceDialog.value.trackData = trackData;
    }

    async function activateSource(ytId: string) {
        let trackData = sourceDialog.value.trackData;
        if (trackData === null) return;
        const trackId = trackData.track.id;
        const { outPath, query } = platform.trackToNames(trackData.track);

        if (await platform.checkFileExists(outPath))
            await platform.deleteFile(outPath);
        trackData.metadata.youTubeSource = ytId;
        delete trackData.metadata.sourceDuration;
        delete trackData.metadata.trackBars;
        delete trackData.metadata.volume;

        await db.put("trackMetadata", toRaw(trackData.metadata));

        let likedInfo = tracks.value.find((t) => t.id === trackId);
        if (likedInfo !== undefined) {
            // remove end and start time from liked info
            delete likedInfo.startTime;
            delete likedInfo.endTime;
            await db.put("tracks", toRaw(likedInfo));
            console.warn(
                "Removing end & start time from likedInfo because the source file changed.",
                likedInfo,
            );
        }

        sourceDialog.value.show = false;
        trackLoader.changeSourceTracks.set(trackData.track.id, query + ytId);
        if (
            player.track !== null &&
            player.collection !== null &&
            player.trackId === trackId
        ) {
            let collection = player.collection;
            player.collection = null;
            player.track = null;

            await player.load(collection, trackData.track);
        }
    }

    async function addToPlaylist(
        playlistId: string,
        track: SpotifyApi.TrackObjectFull,
    ) {
        await baseDb;
        await spotify.api.addTracksToPlaylist(playlistId, [track.uri]);
        if (viewedPlaylist.value === null) return;
        let trackInPlaylist = viewedPlaylist.value.tracks.items.find(
            (t) => t.track.id === track.id,
        );
        if (trackInPlaylist === undefined)
            viewedPlaylistRefreshRequired.value = true;
    }

    async function removeFromPlaylist(playlistId: string, trackUri: string) {
        await baseDb;
        await spotify.api.removeTracksFromPlaylist(playlistId, [trackUri]);
        if (viewedPlaylist.value === null) return;
        let trackIndex = viewedPlaylist.value.tracks.items.findIndex(
            (t) => t.track.uri === trackUri,
        );
        if (trackIndex === -1) return;
        viewedPlaylist.value.tracks.items.splice(trackIndex, 1);
    }

    async function editTrack(likedTrack: LikedTrack) {
        let likedInfo = tracks.value.find((t) => t.id === likedTrack.id);
        if (!likedInfo)
            return console.warn(
                "You can only edit tracks in your liked tracks",
            );
        player.pause().then();
        editDialog.value.likedTrack = likedTrack;
        editDialog.value.durationRange = [
            likedInfo.startTime ?? 0,
            likedInfo.endTime ?? likedTrack.track.duration_ms / 1000,
        ];
        editDialog.value.title = likedTrack.track.name;
        editDialog.value.artists = likedTrack.track.artists.map((a) => a.name);
        editDialog.value.show = true;
        editDialog.value.loading = true;
        editDialog.value.trackData = await trackLoader.getFullTrackData(
            likedTrack.track,
        );
        editDialog.value.loading = false;
    }

    async function applyEditChanges(
        likedTrack: LikedTrack,
        name: string,
        artists: string[],
        durationRange: number[],
    ) {
        likedTrack.track.name = name;
        likedTrack.title = name;
        if (likedTrack.track.artists.length === artists.length)
            for (let i = 0; i < artists.length; i++)
                likedTrack.track.artists[i].name = artists[i];
        likedTrack.artistString = artists.join(", ");
        likedTrack.searchString = `${name.toLowerCase()} ${
            likedTrack.artistString
        }`;
        likedTrack.startTime = durationRange[0];
        likedTrack.endTime = durationRange[1];
        await db.put("tracks", toRaw(likedTrack));

        if (
            player.track !== null &&
            player.collection !== null &&
            player.trackId === likedTrack.track.id
        ) {
            let collection = player.collection;
            player.collection = null;
            player.track = null;
            player.sourcePath = "";

            await player.load(collection, likedTrack.track);
        }

        return true;
    }

    return {
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
        editDialog,
        likedDbChecked,
        likedListKey,
        editTrack,
        sourceDialog,
        applyEditChanges,
    };
});
