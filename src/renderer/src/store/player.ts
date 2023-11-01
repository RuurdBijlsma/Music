import { defineStore } from "pinia";
import { usePlatformStore } from "./electron";
import { computed, ref, toRaw, watch } from "vue";
import { baseDb, useBaseStore } from "./base";
import type { IDBPDatabase } from "idb";
import { useTheme } from "vuetify";
import type { EditedTrack, ItemCollection } from "../scripts/types";
import { shuffleArray } from "../scripts/utils";
import { useLibraryStore } from "./library";
import { randomNotFound } from "../scripts/imageSources";

interface TrackBars {
    binSize: number;
    binWidth: number;
    barSpacing: number;
    binPos: number[];
    binNeg: number[];
    maxVolume: number;
}

interface MetaTrackBars {
    trackBars: TrackBars;
    canvasWidth: number;
    binWidth: number;
    barSpacing: number;
    barCount: number;
}

export const usePlayerStore = defineStore("player", () => {
    const base = useBaseStore();
    const theme = useTheme();
    const platform = usePlatformStore();
    const library = useLibraryStore();

    let db: IDBPDatabase;
    baseDb.then(async (r) => {
        db = r;
        let lastPlaying = await db.get("cache", "nowPlaying");
        if (lastPlaying !== undefined) {
            if (                lastPlaying.collection.id === "liked"            ) {
                if(!library.likedDbChecked)
                    await base.waitFor('likedDbCheck');
                lastPlaying.collection.tracks = library.tracks.map(
                    (t) => t.track,
                );
            }
            let collection: ItemCollection = lastPlaying.collection;
            let t = track.value ?? collection.tracks[0];
            if (t) load(collection, t, false).then();
        }
    });

    let playerElement = addAudioEvents(document.createElement("audio"));
    let backupPlayer = document.createElement("audio");
    let mouseHoverPercent = ref(0);
    let mouseActive = ref(false);
    let mouseHover = ref(false);

    const loading = ref(false);
    const playing = ref(false);
    const duration = ref(0);
    const currentTime = ref(0);
    const loadProgress = ref(NaN);
    const track = ref(
        (localStorage.getItem("trackInMemory") === null
            ? null
            : JSON.parse(localStorage.trackInMemory)) as
            | null
            | SpotifyApi.TrackObjectFull
            | EditedTrack,
    );
    const trackId = ref("");
    const repeat = ref(
        localStorage.getItem("repeat") === null
            ? true
            : localStorage.repeat === "true",
    );
    const shuffle = ref(
        localStorage.getItem("shuffle") === null
            ? false
            : localStorage.shuffle === "true",
    );
    const volume = ref(
        localStorage.getItem("volume") === null ? 1 : +localStorage.volume,
    );
    const volumeNormalizer = ref(0.7);
    const normalizeVolume = ref(
        localStorage.getItem("normalizeVolume") === null
            ? false
            : localStorage.normalizeVolume === "true",
    );
    const realVolume = computed(() =>
        normalizeVolume.value
            ? volume.value * volumeNormalizer.value
            : volume.value,
    );

    watch(
        normalizeVolume,
        () => (localStorage.normalizeVolume = normalizeVolume.value),
    );
    watch(realVolume, () => {
        playerElement.volume = realVolume.value;
        backupPlayer.volume = realVolume.value;
        localStorage.volume = volume.value;
    });
    playerElement.volume = realVolume.value;
    backupPlayer.volume = realVolume.value;

    const collection = ref(null as ItemCollection | null);
    const tracks = computed(
        () => collection.value?.tracks ?? ([] as SpotifyApi.TrackObjectFull[]),
    );
    const shuffledTracks = computed(() => shuffleArray(tracks.value));
    const queue = computed(() =>
        shuffle.value ? shuffledTracks.value : tracks.value,
    );

    let canvasBars: TrackBars | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let context: CanvasRenderingContext2D | null = null;
    requestAnimationFrame(renderProgress);
    let tracksLoading = new Set();
    let dbTrackBarsPromise: Promise<MetaTrackBars> | null = null;

    async function load(
        _collection: ItemCollection,
        _track: EditedTrack | SpotifyApi.TrackObjectFull,
        autoplay = true,
    ) {
        const _trackId = _track.id;
        let isLoading = tracksLoading.has(_trackId);
        tracksLoading.add(_trackId);

        // swap player element with backup element
        // this causes the media session to stay alive while loading the new track
        removeAudioEvents(playerElement);
        playerElement.pause();
        let temp = playerElement;
        playerElement = backupPlayer;
        backupPlayer = temp;
        addAudioEvents(playerElement);

        playerElement.autoplay = autoplay;

        duration.value = _track.duration_ms / 1000;
        currentTime.value = 0;
        loading.value = true;
        loadProgress.value = NaN;
        volumeNormalizer.value = 0.5;
        _collection = toRaw(_collection);
        _collection.tracks = _collection.tracks.map((t) => toRaw(t));
        _collection.context = toRaw(_collection.context);

        if (collection.value?.id !== _collection.id && library.valuesLoaded) {
            let recentIndex = library.recentPlays.findIndex(
                (r) => r.id === _collection.id,
            );
            if (recentIndex !== -1) {
                library.recentPlays.splice(recentIndex, 1);
            }
            library.recentPlays.unshift(_collection);
            db.put("spotify", toRaw(library.recentPlays), "recentPlays").then();
        }

        collection.value = _collection;
        _track = toRaw(_track);
        if (trackId.value !== _trackId) {
            collectTrackStat().then();
        }
        track.value = _track;
        trackId.value = _trackId;
        setMetadata(_track);

        dbTrackBarsPromise = showTrackBars(_track);

        let onProgress: (p: number) => void;
        onProgress = (percent) => {
            // Check if user hasn't changed track while it was progressing
            if (
                _collection.id === collection.value?.id &&
                track.value &&
                _trackId === trackId.value
            ) {
                loadProgress.value = percent;
                if (percent === 100) {
                    base.events.off(_trackId + "progress", onProgress);
                }
            }
        };
        base.events.on(_trackId + "progress", onProgress);
        if (isLoading) {
            return;
        }
        let outPath = "";
        try {
            outPath = await platform.getTrackFile(_track);
        } catch (e: any) {
            console.warn(
                "Track load error, EXITING OUT OF LOAD FUNCTION",
                _track,
                e,
            );
            return;
        } finally {
            tracksLoading.delete(_trackId);
        }
        platform.getVolumeStats(_track).then(({ mean }) => {
            // volume is normalized to where a track with max volume of >= 38000 gets normalizer 0.3
            // a track with max volume of <= 15000 gets normalizer 1 (so full volume)
            const volumeToNormalizer = (x: number) =>
                -0.06363636364 * (x + 7) + 0.3;
            volumeNormalizer.value = Math.max(
                Math.min(1, volumeToNormalizer(mean)),
                0.3,
            );
        });
        setTimeout(async () => {
            if (
                _collection.id === collection.value?.id &&
                track.value &&
                _trackId === trackId.value
            ) {
                let storeCollection: any = _collection;
                if (_collection.id === "liked") {
                    storeCollection = {
                        ..._collection,
                    };
                    delete storeCollection.tracks;
                }
                await db
                    .put(
                        "cache",
                        {
                            collection: storeCollection,
                        },
                        "nowPlaying",
                    )
                    .then(() => {
                        localStorage.hasTrackInMemory = "true";
                    });
            }
            const delOp = (obj: any, p: string) => delete obj[p];
            delOp(_track, "available_markets");
            delOp(_track, "external_ids");
            delOp(_track, "external_urls");
            delOp(_track, "href");
            delOp(_track, "preview_url");
            delOp(_track.album, "available_markets");
            delOp(_track.album, "external_urls");
            delOp(_track.album, "href");
            for (let artist of _track.artists) {
                delOp(artist, "external_urls");
                delOp(artist, "href");
            }
            localStorage.trackInMemory = JSON.stringify(_track);
        }, 100);
        // Check if user hasn't changed track while it was loading
        if (
            _collection.id === collection.value.id &&
            track.value &&
            _trackId === trackId.value
        ) {
            playerElement.src = outPath;

            if ("startTime" in _track && _track.startTime !== undefined) {
                playerElement.currentTime = _track.startTime;
            }
        }

        platform.setPlatformPlaying(autoplay);
        await initTrackbars(outPath, _trackId);
    }

    let statsInterval = 0;
    let intervalSeconds = 30;
    const collectStatsPeriod = 60;

    function createStatsInterval() {
        if (!playing.value) return;
        // @ts-ignore
        statsInterval = setInterval(() => {
            if (intervalSeconds++ % collectStatsPeriod === 0) {
                collectMinuteStats().then();
            }
        }, 1000);
    }

    watch(playing, () => {
        if (playing.value) {
            createStatsInterval();
        } else {
            clearInterval(statsInterval);
        }
    });

    const emptyTrackStats = () => ({
        track: toRaw(track.value),
        skips: 0,
        listenMinutes: 0,
        listenCount: 0,
    });
    const emptyArtistStats = (name: string) => ({
        name,
        skips: 0,
        listenMinutes: 0,
        history: {},
    });
    const emptyCollectionStats = (name: string) => ({
        name,
        skips: 0,
        listenMinutes: 0,
    });

    async function collectTrackStat() {
        let currentTrack = track.value;

        let listenCount = await db.get("statistics", "listenCount");
        if (listenCount === undefined) listenCount = 0;
        await db.put("statistics", ++listenCount, "listenCount");

        if (currentTrack === null) return;

        let today = new Date().toISOString().substring(0, 10);
        let popularityHistory = await db.get("statistics", "popularityHistory");
        if (popularityHistory === undefined) popularityHistory = {};
        if (!popularityHistory.hasOwnProperty(today)) {
            popularityHistory[today] = {
                popularitySum: 0,
                listenCount: 0,
            };
        }
        popularityHistory[today].popularitySum += currentTrack.popularity;
        popularityHistory[today].listenCount++;
        await db.put("statistics", popularityHistory, "popularityHistory");

        let trackStats = await db.get("trackStats", currentTrack.id);
        if (!trackStats) trackStats = emptyTrackStats();
        trackStats.listenCount++;
        await db.put("trackStats", trackStats, currentTrack.id);
    }

    async function collectSkipStat(
        track: SpotifyApi.TrackObjectFull,
        collection: ItemCollection,
    ) {
        // gets called after every 60 seconds of audio play is elapsed
        if (track === null || collection === null) return;

        let skips = await db.get("statistics", "skips");
        if (skips === undefined) skips = 0;
        await db.put("statistics", ++skips, "skips");

        let trackStats = await db.get("trackStats", track.id);
        if (!trackStats) trackStats = emptyTrackStats();
        trackStats.skips++;
        await db.put("trackStats", trackStats, track.id);

        for (let artist of track.artists) {
            let artistStats = await db.get("artistStats", artist.id);
            if (!artistStats) artistStats = emptyArtistStats(artist.name);
            artistStats.skips++;
            await db.put("artistStats", artistStats, artist.id);
        }

        let collectionStats = await db.get("collectionStats", collection.id);
        if (!collectionStats)
            collectionStats = emptyCollectionStats(collection.name);
        collectionStats.skips++;
        await db.put("collectionStats", collectionStats, collection.id);
    }

    async function collectMinuteStats() {
        // gets called after every 60 seconds of audio play is elapsed
        if (track.value === null) return;
        let today = new Date().toISOString().substring(0, 10);

        let listenMinutes = await db.get("statistics", "listenMinutes");
        if (listenMinutes === undefined) listenMinutes = 0;
        await db.put("statistics", ++listenMinutes, "listenMinutes");

        let historyMinutes = await db.get("statistics", "historyMinutes");
        if (historyMinutes === undefined) historyMinutes = {};
        historyMinutes[today] = (historyMinutes[today] ?? 0) + 1;
        await db.put("statistics", historyMinutes, "historyMinutes");

        let trackStats = await db.get("trackStats", track.value.id);
        if (!trackStats) trackStats = emptyTrackStats();
        trackStats.listenMinutes++;
        await db.put("trackStats", trackStats, track.value.id);

        for (let artist of track.value.artists) {
            let artistStats = await db.get("artistStats", artist.id);
            if (!artistStats) artistStats = emptyArtistStats(artist.name);
            artistStats.history[today] = (artistStats.history[today] ?? 0) + 1;
            artistStats.listenMinutes++;
            await db.put("artistStats", artistStats, artist.id);
        }

        if (collection.value !== null) {
            let collectionStats = await db.get(
                "collectionStats",
                collection.value.id,
            );
            if (!collectionStats)
                collectionStats = emptyCollectionStats(collection.value.name);
            collectionStats.listenMinutes++;
            await db.put(
                "collectionStats",
                collectionStats,
                collection.value.id,
            );
        }
    }

    async function initTrackbars(outPath: string, _trackId: string) {
        canvas = document.querySelector(".progress-canvas");
        if (dbTrackBarsPromise === null) return;
        const { trackBars, canvasWidth, binWidth, barSpacing, barCount } =
            await dbTrackBarsPromise;
        if (canvas !== null) {
            canvas.width = canvasWidth;
            canvas.height = 100;
            context = canvas.getContext("2d");
        }
        // only calculate track bars if they weren't retrieved from db cache
        if (trackBars === undefined)
            calculateTrackBars(
                outPath,
                _trackId,
                barCount,
                binWidth,
                barSpacing,
            ).then();
    }

    async function deleteTrack(deleteTrack: SpotifyApi.TrackObjectFull) {
        if (deleteTrack === null) return;
        await db.delete("trackBars", deleteTrack.id);
        await platform.deleteTrackCache(deleteTrack);
        if (track.value?.id === deleteTrack.id) {
            await unload();
        }
    }

    async function reloadCurrentTrack() {
        if (track.value === null || collection.value === null) return;
        await deleteTrack(track.value);
        await load(collection.value, track.value);
    }

    async function unload() {
        localStorage.hasTrackInMemory = "false";
        db.delete("cache", "nowPlaying").then(() => {
            localStorage.removeItem("hasTrackInMemory");
            localStorage.removeItem("trackInMemory");
        });

        base.themeColorDark = "#FFFFFF";
        base.themeColorLight = "#000000";
        playerElement.src = "";
        duration.value = 1;
        currentTime.value = 1;
        loading.value = false;
        loadProgress.value = NaN;
        collection.value = null;
        track.value = null;
        trackId.value = "";

        const binWidth = 2;
        const barSpacing = 1;
        const canvasWidth = 300;
        const barCount = canvasWidth / (binWidth + barSpacing);
        canvasBars = {
            binSize: 1,
            binWidth,
            barSpacing,
            binPos: new Array<number>(barCount).fill(0.02),
            binNeg: new Array<number>(barCount).fill(-0.02),
            maxVolume: 1,
        };
        platform.stopPlatformPlaying();
    }

    function addAudioEvents(element: HTMLAudioElement) {
        element.onplay = () => {
            playing.value = !element.paused;
            platform.setPlatformPlaying(true);
        };
        element.onpause = () => {
            playing.value = !element.paused;
            platform.setPlatformPlaying(false);
        };
        element.ondurationchange = () => {
            duration.value = element.duration;
            if (track.value !== null)
                library
                    .updateTrackDuration(track.value, element.duration * 1000)
                    .then();
        };
        element.oncanplay = () => {
            loading.value = false;
        };
        element.ontimeupdate = async () => {
            currentTime.value = element.currentTime;
            if (
                track.value !== null &&
                "endTime" in track.value &&
                track.value.endTime !== undefined &&
                element.currentTime >= track.value.endTime
            ) {
                element.src = "";
                await skip(1);
            }
        };
        element.onended = async () => {
            element.src = "";
            await skip(1);
        };
        return element;
    }

    function removeAudioEvents(element: HTMLAudioElement) {
        element.onplay = () => 0;
        element.onpause = () => 0;
        element.ondurationchange = () => 0;
        element.oncanplay = () => 0;
        element.ontimeupdate = () => 0;
        element.onended = () => 0;
        element.onvolumechange = () => 0;
        return element;
    }

    async function showTrackBars(
        _track: SpotifyApi.TrackObjectFull,
    ): Promise<MetaTrackBars> {
        // get track bars from db or create empty structure
        const canvasWidth = 300;
        const binWidth = 2;
        const barSpacing = 1;
        const barCount = canvasWidth / (binWidth + barSpacing);
        await baseDb;
        let trackBars = (await db.get("trackBars", _track.id)) as TrackBars;
        if (trackBars !== undefined && _track.id === trackId.value) {
            canvasBars = trackBars;
        } else if (_track.id === trackId.value) {
            canvasBars = {
                binSize: 1,
                binWidth,
                barSpacing,
                binPos: new Array<number>(barCount).fill(0.02),
                binNeg: new Array<number>(barCount).fill(-0.02),
                maxVolume: 1,
            };
        }
        return {
            trackBars,
            canvasWidth,
            binWidth,
            barSpacing,
            barCount,
        } as MetaTrackBars;
    }

    async function calculateTrackBars(
        outPath: string,
        _trackId: string,
        barCount: number,
        binWidth: number,
        barSpacing: number,
    ) {
        let audioContext = new AudioContext();
        let response = await fetch(outPath);
        let decoded = await audioContext.decodeAudioData(
            await response.arrayBuffer(),
        );
        let channelData = decoded.getChannelData(0);

        let binSize = (channelData.length / barCount) | 0;
        let binPos = 0;
        let binNeg = 0;
        //only set canvasBars if the playing track is still the one being calculated
        let bars = {
            binSize,
            binWidth,
            barSpacing,
            binPos: [] as number[],
            binNeg: [] as number[],
            maxVolume: 0,
        } as TrackBars;
        for (let i = 0; i < channelData.length; i++) {
            if (channelData[i] > 0) binPos += channelData[i];
            else binNeg += channelData[i];
            if (i % binSize === binSize - 1) {
                if (Math.abs(binPos - binNeg) > bars.maxVolume)
                    bars.maxVolume = binPos - binNeg;
                bars.binPos.push(binPos);
                bars.binNeg.push(binNeg);
                binPos = 0;
                binNeg = 0;
            }
        }
        if (track.value !== null && trackId.value === _trackId)
            canvasBars = bars;
        await db.put("trackBars", bars, _trackId).then();
        return bars;
    }

    function renderProgress() {
        requestAnimationFrame(renderProgress);
        if (context === null || canvasBars === null || canvas === null) return;
        let duration = 1,
            currentTime = playerElement.currentTime;
        if (playerElement.duration) duration = playerElement.duration;

        let mouseHoverBar = canvasBars.binPos.length * mouseHoverPercent.value;
        const defaultBarFill = theme.current.value.dark
            ? "rgba(255,255,255,0.4)"
            : "rgba(0,0,0,0.2)";
        let { binSize, binWidth, barSpacing } = canvasBars;
        context.clearRect(0, 0, canvas.width, canvas.height);
        let mapping = (x: number) => 2.14285714286 * x + 0.35714285714;
        let normalizer =
            mapping(normalizeVolume.value ? volumeNormalizer.value : 0.3) * 0.7;

        for (let i = 0; i < canvasBars.binPos.length; i++) {
            let timePercent = currentTime / duration;
            let isActiveBar =
                ((canvasBars.binPos.length * timePercent) | 0) === i;
            let barPartFill = (canvasBars.binPos.length * timePercent) % 1;

            let binPos = canvasBars.binPos[i] * normalizer;
            let binNeg = canvasBars.binNeg[i] * normalizer;
            let posHeight = (binPos / binSize) * canvas.height;
            let negHeight = (-binNeg / binSize) * canvas.height;
            let x = ((binWidth + barSpacing) * i) | 0;

            context.fillStyle = defaultBarFill;
            if (x / canvas.width < currentTime / duration)
                context.fillStyle = base.themeColor;

            let h = negHeight + posHeight;
            let y = (canvas.height / 2 - negHeight) | 0;
            if (mouseActive.value || mouseHover.value) {
                let mouseDistanceToBar = Math.abs(mouseHoverBar - i);
                let addedHeight = mouseActive.value
                    ? 10 - mouseDistanceToBar * 2
                    : 7 - mouseDistanceToBar / 1.7;
                if (addedHeight > 0) {
                    y -= addedHeight / 2;
                    h += addedHeight;
                }
            }

            if (isActiveBar) {
                context.fillRect(x, y, binWidth * barPartFill, h);
                context.fillStyle = defaultBarFill;
                context.fillRect(
                    x + binWidth * barPartFill,
                    y,
                    binWidth * (1 - barPartFill),
                    h,
                );
            } else {
                context.fillRect(x, y, binWidth, h);
            }
        }
    }

    function setMetadata(track: SpotifyApi.TrackObjectFull) {
        let artistsString = track.artists.map((a) => a.name).join(", ");
        document.title = track.name + " - " + artistsString;

        if (!("mediaSession" in navigator)) return;

        let artwork = [
            {
                src: randomNotFound(),
                type: "image/png",
                sizes: "512x512",
            },
        ];
        if (track.album.images.length > 0)
            artwork = track.album.images.map((i) => ({
                src: i.url,
                type: "image/png",
                sizes: `${i.width}x${i.height}`,
            }));

        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.name,
            artist: artistsString,
            album: track.album.name,
            artwork,
        });

        navigator.mediaSession.setActionHandler("previoustrack", () =>
            skip(-1),
        );
        navigator.mediaSession.setActionHandler("nexttrack", () => skip(1));

        let defaultSkipTime = 10;
        navigator.mediaSession.setActionHandler("seekbackward", (event) => {
            const skipTime = event.seekOffset || defaultSkipTime;
            playerElement.currentTime = Math.max(
                playerElement.currentTime - skipTime,
                0,
            );
        });

        navigator.mediaSession.setActionHandler("seekforward", (event) => {
            const skipTime = event.seekOffset || defaultSkipTime;
            playerElement.currentTime = Math.min(
                playerElement.currentTime + skipTime,
                playerElement.duration,
            );
        });

        navigator.mediaSession.setActionHandler("play", () => play());

        navigator.mediaSession.setActionHandler("pause", () => pause());

        try {
            navigator.mediaSession.setActionHandler("stop", () => pause());
        } catch (error) {
            console.warn(
                'Warning! The "stop" media session action is not supported.',
            );
        }

        try {
            navigator.mediaSession.setActionHandler("seekto", (event) => {
                if (event.seekTime !== undefined && event.seekTime !== null)
                    playerElement.currentTime = event.seekTime;
            });
        } catch (error) {
            console.warn(
                'Warning! The "seekto" media session action is not supported.',
            );
        }
    }

    async function skip(n = 1) {
        if (n === -1 && currentTime.value > 5) {
            playerElement.currentTime = 0;
            return;
        }
        let trackId = track.value?.id;
        if (collection.value === null || trackId === null) return;
        if (n > 0 && currentTime.value / duration.value < 0.9) {
            if (track.value !== null)
                collectSkipStat(track.value, collection.value).then();
        }

        let index = queue.value.findIndex((t) => t.id === trackId);
        let newIndex = index + n;
        let repeatRequired = false;
        if (newIndex >= queue.value.length) {
            repeatRequired = true;
            newIndex = 0;
        }
        if (newIndex < 0) {
            repeatRequired = true;
            newIndex = queue.value.length - 1;
        }
        if (repeatRequired && !repeat.value) {
            await unload();
        } else {
            await load(collection.value, queue.value[newIndex]);
        }
    }

    async function togglePlay() {
        if (playing.value) {
            await pause();
        } else {
            await play();
        }
    }

    async function play() {
        await playerElement.play();
    }

    async function pause() {
        await playerElement.pause();
    }

    function seekTo(time: number) {
        playerElement.currentTime = time;
    }

    function toggleShuffle() {
        shuffle.value = !shuffle.value;
        localStorage.shuffle = shuffle.value;
    }

    function toggleRepeat() {
        repeat.value = !repeat.value;
        localStorage.repeat = repeat.value;
    }

    async function playCollection(collection: ItemCollection) {
        shuffle.value = false;
        await load(collection, collection.tracks[0]);
    }

    async function shuffleCollection(collection: ItemCollection) {
        shuffle.value = true;
        await load(
            collection,
            collection.tracks[
                Math.floor(Math.random() * collection.tracks.length)
            ],
        );
    }

    return {
        loading,
        playing,
        duration,
        currentTime,
        loadProgress,
        track,
        collection,
        load,
        skip,
        play,
        pause,
        togglePlay,
        seekTo,
        mouseHoverPercent,
        mouseActive,
        mouseHover,
        playerElement,
        volume,
        toggleShuffle,
        toggleRepeat,
        shuffle,
        repeat,
        trackId,
        queue,
        playCollection,
        shuffleCollection,
        reloadCurrentTrack,
        deleteTrack,
        normalizeVolume,
        initTrackbars,
        unload,
    };
});
