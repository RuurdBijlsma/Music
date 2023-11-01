import { defineStore } from "pinia";
import { computed, ref, toRaw } from "vue";
import { baseDb, useBaseStore } from "./base";
import { usePlatformStore } from "./electron";
import type { IDBPDatabase } from "idb";
import type {
    EditedTrack,
    ExtendedPlaylistTrack,
    Item,
    ItemCollection,
    ItemType,
    TrackChanges,
} from "../scripts/types";
import { usePlayerStore } from "./player";
import { useSpotifyApiStore } from "./spotify-api";
import { useSpotifyAuthStore } from "./spotify-auth";
import { randomUser } from "../scripts/imageSources";
import { useSearchStore } from "./search";

export const useLibraryStore = defineStore("library", () => {
    const platform = usePlatformStore();
    const search = useSearchStore();
    const base = useBaseStore();
    const player = usePlayerStore();
    const spotify = useSpotifyApiStore();
    const spotifyAuth = useSpotifyAuthStore();

    let valuesLoaded = ref(false);
    let db: IDBPDatabase;
    baseDb.then((r) => {
        db = r;
        loadValues().then(() => (valuesLoaded.value = true));
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
    const tracks = ref([] as ExtendedPlaylistTrack[]);
    const likedTracksTotal = ref(1);
    const likedTracksLoaded = ref(0);
    const viewedPlaylist = ref(null as SpotifyApi.PlaylistObjectFull | null);
    const viewedPlaylistRefreshRequired = ref(false);
    let likedDbChecked=false;

    const editDialog = ref({
        show: false,
        track: null as null | SpotifyApi.TrackObjectFull,
        title: "",
        artists: [""],
        durationRange: [0, 1],
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
        playlist: {},
        album: {},
        artist: {},
        category: {},
        user: {},
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
            offlineCollections.value = dbOfflineCollections;
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
            likedDbChecked=true;
            base.events.emit('likedDbCheck');
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
        await baseDb;

        let me = await spotify.getMe();
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
                    spotify.api.getUserPlaylists(userInfo.value.id, {
                        limit: 50,
                    });
                break;
            case "album":
                retrieval = () => spotify.api.getMySavedAlbums();
                break;
            case "artist":
                retrieval = () => spotify.api.getFollowedArtists();
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
        let type = "track";
        if (isRefreshing.value["track"]) {
            await base.waitFor("refreshed" + type);
            return true;
        }
        isRefreshing.value["track"] = true;
        let likedTracks = await db.getAllFromIndex("tracks", "newToOld");
        tracks.value = likedTracks;
        base.events.emit("refreshed" + type);
        isRefreshing.value["track"] = false;

        if (likedTracks.length !== 0) {
            likedTracksLoaded.value = likedTracks.length;
            likedTracksTotal.value = likedTracks.length;
            return true;
        }
        return false;
    }

    function enhancePlaylistObject(item: SpotifyApi.PlaylistTrackObject) {
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
            track: item.track as EditedTrack,
            artistString,
            searchString,
            id,
            title,
            added_at_reverse,
            originalName: track.name,
        } as ExtendedPlaylistTrack;
    }

    async function loadLikedTracks() {
        await baseDb;
        let type = "track";

        if (isRefreshing.value["track"]) {
            await base.waitFor("refreshed" + type);
            return;
        }
        await spotifyAuth.awaitAuth();
        isRefreshing.value["track"] = true;

        let isInitial = tracks.value.length === 0;
        let items: ExtendedPlaylistTrack[] = [];
        likedTracksLoaded.value = 0;
        likedTracksTotal.value = 1;

        let trackEdits = await db.getAll("trackEdits");
        let trackEditKeys = await db.getAllKeys("trackEdits");
        const editsObject = Object.fromEntries(
            trackEdits.map((_, i) => [trackEditKeys[i], trackEdits[i]]),
        );

        let ytTracks = (await db.getAllFromIndex(
            "ytTracks",
            "newToOld",
        )) as ExtendedPlaylistTrack[];
        let newestYtTrack = ytTracks.shift();

        let once = true;
        for await (let batch of await spotify.retrieveArray(() =>
            spotify.api.getMySavedTracks({ limit: 50 }),
        )) {
            if (once) {
                likedTracksTotal.value = batch.total;
                once = false;
            }
            for (let spotifyItem of batch.items) {
                likedTracksLoaded.value++;
                if (!spotifyItem.track.is_local) {
                    let item = enhancePlaylistObject(spotifyItem);

                    while (
                        newestYtTrack !== undefined &&
                        newestYtTrack.added_at_reverse < item.added_at_reverse
                    ) {
                        if (
                            editsObject.hasOwnProperty(newestYtTrack.track.id)
                        ) {
                            editTrackObject(
                                newestYtTrack.track as SpotifyApi.TrackObjectFull,
                                editsObject[newestYtTrack.track.id],
                            );
                        }
                        // yt track is newer than this spotify track
                        items.push(newestYtTrack);
                        if (isInitial) {
                            tracks.value.push(newestYtTrack);
                        }
                        likedTracksLoaded.value++;
                        likedTracksTotal.value++;
                        newestYtTrack = ytTracks.shift();
                    }
                    if (editsObject.hasOwnProperty(item.track.id)) {
                        editTrackObject(
                            item.track as SpotifyApi.TrackObjectFull,
                            editsObject[item.track.id],
                        );
                    }
                    items.push(item);
                    if (isInitial) {
                        tracks.value.push(item);
                    }
                }
            }
        }
        if (!isInitial) {
            tracks.value = items;
        }

        // put loaded tracks in db
        if (items.length > 0) {
            const tx = db.transaction("tracks", "readwrite");
            let promises: Promise<any>[] = [db.clear("tracks")];
            for (let item of items) {
                promises.push(db.add("tracks", item));
            }
            await Promise.all([...promises, tx.done]);
            localStorage.lastTracksLoad = Date.now();
        }

        base.events.emit("refreshed" + type);
        isRefreshing.value["track"] = false;
    }

    async function refreshHomePage() {
        await baseDb;
        await spotifyAuth.awaitAuth();

        //Featured playlists
        let featured = await spotify.api.getFeaturedPlaylists({ limit: 50 });
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
        let newReleases = await spotify.api.getNewReleases({ limit: 50 });
        view.value.homePage.newReleases = newReleases.albums.items;
        await db.put("spotify", toRaw(view.value), "view");
    }

    function checkLiked(type: ItemType, id: string) {
        let result: ExtendedPlaylistTrack | undefined;
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
            if (liked) {
                if (item.id.startsWith("yt-")) {
                    // YouTube
                    db.delete("ytTracks", id).then();
                } else {
                    // Spotify
                    await spotify.api.removeFromMySavedTracks([id]);
                }

                db.delete("tracks", id).then();
                tracks.value.splice(
                    tracks.value.findIndex((t) => t.track.id === id),
                    1,
                );
                if (!isRefreshing.value["track"]) {
                    likedTracksTotal.value--;
                    likedTracksLoaded.value--;
                }
                return false;
            } else {
                let date = new Date().toISOString();
                let playlistObject = enhancePlaylistObject({
                    track: toRaw(item) as SpotifyApi.TrackObjectFull,
                    added_at: date,
                } as SpotifyApi.PlaylistTrackObject);

                if (item.id.startsWith("yt-")) {
                    // YouTube
                    db.add("ytTracks", playlistObject).then();
                } else {
                    // Spotify
                    await spotify.api.addToMySavedTracks([id]);
                }

                db.add("tracks", playlistObject).then();
                tracks.value.unshift(playlistObject);
                if (!isRefreshing.value["track"]) {
                    likedTracksTotal.value++;
                    likedTracksLoaded.value++;
                }
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
        if (player.playing) player.pause();
        base.sourceDialog.show = true;
        base.sourceDialog.loading = true;
        base.sourceDialog.spotifyTrack = track;

        const { cacheKey, query } = platform.trackToNames(track);
        let [options, selectedId] = await Promise.all([
            search.searchYouTubeRaw(query, 10),
            db.get("nameToId", cacheKey),
        ]);

        base.sourceDialog.loading = false;
        base.sourceDialog.items = options;
        base.sourceSelectedId = selectedId ?? "";
    }

    async function activateSource(id: string) {
        let spotifyTrack = base.sourceDialog.spotifyTrack;
        if (spotifyTrack === null) return;
        const trackId = spotifyTrack.id;
        const { cacheKey, outPath } = platform.trackToNames(spotifyTrack);
        await db.put("nameToId", id, cacheKey);
        await platform.deleteFile(outPath);
        await db.delete("trackBars", spotifyTrack.id);
        if (
            player.track !== null &&
            player.collection !== null &&
            player.trackId === spotifyTrack.id
        ) {
            base.sourceDialog.show = false;

            base.sourceDialog.tempTrackOverride = {
                ytId: id,
                trackId: trackId,
            };
            await player.load(player.collection, spotifyTrack);
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

    function editTrack(track: SpotifyApi.TrackObjectFull) {
        editDialog.value.track = track;
        editDialog.value.show = true;
    }

    async function updateTrackDuration(
        track: SpotifyApi.TrackObjectFull,
        durationMs: number,
    ) {
        track.duration_ms = durationMs;
        let libTrack = tracks.value.find((t) => t.id === track.id);
        if (!libTrack) return;
        libTrack.track.duration_ms = durationMs;
        await db.put("tracks", toRaw(libTrack));
        //todo zet de nieuwe duration ook in de edits DB
    }

    function revertTrackObject(
        track: SpotifyApi.TrackObjectFull,
        changes: TrackChanges,
    ) {
        track.name = changes.original.title;
        const originalArtists = changes.original.artists;
        if (track.artists.length === originalArtists.length)
            track.artists.forEach(
                (_, i) => (track.artists[i].name = changes.original.artists[i]),
            );
        else
            console.warn(
                "MISMATCH BETWEEN TRACK ARTISTS AND EDIT ARTISTS LENGTH.",
                track,
                changes,
            );
        track.duration_ms = changes.original.endTime * 1000;
    }

    function editTrackObject(track: EditedTrack, changes: TrackChanges) {
        track.name = changes.title;
        if (track.artists.length === changes.artists.length)
            track.artists.forEach(
                (_, i) => (track.artists[i].name = changes.artists[i]),
            );
        track.duration_ms = (changes.endTime - changes.startTime) * 1000;
        track.startTime = changes.startTime;
        track.endTime = changes.endTime;
    }

    async function applyEditChanges() {
        let track = editDialog.value.track;
        if (track === null) return false;
        let existingChanges = await db.get("trackEdits", track.id);
        if (existingChanges) {
            // remove existing changes from track
            revertTrackObject(track, existingChanges);
        }
        let changes: TrackChanges = {
            title: editDialog.value.title,
            artists: toRaw(editDialog.value.artists),
            startTime: editDialog.value.durationRange[0],
            endTime: editDialog.value.durationRange[1],
            id: track.id,
            original: {
                title: track.name,
                artists: track.artists.map((a) => a.name),
                endTime: track.duration_ms / 1000,
            },
        };

        editTrackObject(track, changes);
        await db.put("trackEdits", changes, track.id);

        let libTrack = tracks.value.find((t) => t.id === track?.id);
        if (!libTrack) return;
        editTrackObject(libTrack.track, changes);
        await db.put("tracks", toRaw(libTrack));
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
        likedTracksLoaded,
        likedTracksTotal,
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
        editTrack,
        updateTrackDuration,
        applyEditChanges,
        likedDbChecked
    };
});
