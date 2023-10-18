import { defineStore } from "pinia";
import { usePlatformStore } from "./electron";
import { computed, ref, toRaw, watch } from "vue";
import { baseDb, useBaseStore } from "./base";
import type { IDBPDatabase } from "idb";
import { useTheme } from "vuetify";
import type { ItemCollection } from "../types";
import { shuffleArray } from "../utils";

interface TrackBars {
    binSize: number,
    binWidth: number,
    barSpacing: number,
    binPos: number[],
    binNeg: number[],
    maxVolume: number
}

export const usePlayerStore = defineStore("player", () => {
    const base = useBaseStore();
    const theme = useTheme();
    const platform = usePlatformStore();
    let db: IDBPDatabase;
    baseDb.then(async r => {
        db = r;
        let lastPlaying = await db.get("cache", "nowPlaying");
        if (lastPlaying !== undefined) {
            console.log("Loading from now playing");
            let collection: ItemCollection = lastPlaying.collection;
            let track: SpotifyApi.TrackObjectFull = lastPlaying.track;
            load(collection, track, false).then();
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
    const track = ref(null as null | SpotifyApi.TrackObjectFull);
    const trackId = ref("");
    const repeat = ref(localStorage.getItem("repeat") === null ? true : localStorage.repeat === "true");
    const shuffle = ref(localStorage.getItem("shuffle") === null ? false : localStorage.shuffle === "true");
    const volume = ref(localStorage.getItem("volume") === null ? 1 : +localStorage.volume);
    const volumeNormalizer = ref(0.7);
    const normalizeVolume = ref(localStorage.getItem("normalizeVolume") === null ? false : localStorage.normalizeVolume === "true");
    const realVolume = computed(() => normalizeVolume.value ? volume.value * volumeNormalizer.value : volume.value);

    watch(normalizeVolume, () => localStorage.normalizeVolume = normalizeVolume.value);
    watch(realVolume, () => {
        playerElement.volume = realVolume.value;
        backupPlayer.volume = realVolume.value;
        console.log("real volume update", realVolume.value);
        localStorage.volume = volume.value;
    });
    playerElement.volume = realVolume.value;

    const collection = ref(null as ItemCollection | null);
    const tracks = computed(() => collection.value?.tracks ?? [] as SpotifyApi.TrackObjectFull[]);
    const shuffledTracks = computed(() => shuffleArray(tracks.value));
    const queue = computed(() => shuffle.value ? shuffledTracks.value : tracks.value);

    let canvasBars: TrackBars | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let context: CanvasRenderingContext2D | null = null;
    requestAnimationFrame(renderProgress);
    let tracksLoading = new Set();

    async function load(_collection: ItemCollection, _track: SpotifyApi.TrackObjectFull, autoplay = true) {
        console.time("load");
        console.timeLog("load", 1);
        const _trackId = _track.id;
        let isLoading = tracksLoading.has(_trackId);
        tracksLoading.add(_trackId);
        console.timeLog("load", 2);

        // swap player element with backup element
        // this causes the media session to stay alive while loading the new track
        removeAudioEvents(playerElement);
        playerElement.pause();
        let temp = playerElement;
        playerElement = backupPlayer;
        backupPlayer = temp;
        addAudioEvents(playerElement);
        console.timeLog("load", 3);

        console.log("Load", { _collection, track });
        playerElement.autoplay = autoplay;

        duration.value = _track.duration_ms / 1000;
        currentTime.value = 1;
        loading.value = true;
        loadProgress.value = NaN;
        volumeNormalizer.value = 0.5;
        _collection = toRaw(_collection);
        _collection.tracks = _collection.tracks.map(t => toRaw(t));
        _collection.context = toRaw(_collection.context);
        collection.value = _collection;
        _track = toRaw(_track);
        track.value = _track;
        trackId.value = _trackId;
        setMetadata(_track);
        console.timeLog("load", 4);

        console.log("Playing item", _track, "from collection", _collection);
        console.timeLog("load", 5);

        let dbTrackBarsPromise = showTrackBars(_track);
        console.timeLog("load", 7);

        let onProgress: (p: { percent: number }) => void;
        onProgress = (progress) => {
            // Check if user hasn't changed track while it was progressing
            if (_collection.id === collection.value?.id && track.value && _trackId === trackId.value) {
                loadProgress.value = progress.percent;
                console.log(progress, loadProgress.value);
                if (progress.percent === 100) {
                    base.events.off(_trackId + "progress", onProgress);
                }
            }
        };
        base.events.on(_trackId + "progress", onProgress);
        if (isLoading) {
            console.warn("Track", track, "is already loading, So I stop");
            return;
        }
        let outPath = "";
        console.timeLog("load", 8);
        try {
            outPath = await platform.getTrackFile(_track);
        } catch (e: any) {
            console.warn("Track load error", _track, e);
        } finally {
            tracksLoading.delete(_trackId);
        }
        platform.getVolumeStats(_track).then(({ mean, peak }) => {
            // volume is normalized to where a track with max volume of >= 38000 gets normalizer 0.3
            // a track with max volume of <= 15000 gets normalizer 1 (so full volume)
            const maxVolumeToNormalizer = (x: number) => -0.06363636364 * (x + 7) + 0.3;
            volumeNormalizer.value = Math.max(Math.min(1, maxVolumeToNormalizer(mean)), .3);
            console.log({ volumeNormalizer: volumeNormalizer.value, meanVolume: mean });
        });
        console.timeLog("load", 8.5);
        setTimeout(() => {
            if (_collection.id === collection.value?.id && track.value && _trackId === trackId.value)
                db.put("cache", {
                    collection: _collection,
                    track: toRaw(_track)
                }, "nowPlaying").then(() => localStorage.hasTrackInMemory = "true");
        }, 100);
        console.timeLog("load", 9);
        console.log({ outPath });
        // Check if user hasn't changed track while it was loading
        if (_collection.id === collection.value.id && track.value && _trackId === trackId.value)
            playerElement.src = outPath;
        console.log(playerElement);

        platform.setPlatformPlaying(autoplay);

        canvas = document.querySelector(".progress-canvas");
        if (canvas === null) return;
        const { dbTrackBars, canvasWidth, binWidth, barSpacing, barCount } = await dbTrackBarsPromise;
        canvas.width = canvasWidth;
        canvas.height = 100;
        context = canvas.getContext("2d");
        if (context === null) return;
        // only calculate track bars if they weren't retrieved from db cache
        if (dbTrackBars === undefined)
            calculateTrackBars(outPath, _trackId, barCount, binWidth, barSpacing).then();
        console.timeEnd("load");
    }

    async function deleteTrack(track: SpotifyApi.TrackObjectFull) {
        if (track === null) return;
        await db.delete("trackBars", track.id);
        await platform.deleteTrackCache(track);
    }

    async function reloadCurrentTrack() {
        if (track.value === null || collection.value === null) return;
        await deleteTrack(track.value);
        await load(collection.value, track.value);
    }

    async function unload() {
        localStorage.hasTrackInMemory = "false";
        db.delete("cache", "nowPlaying").then(() => localStorage.removeItem("hasTrackInMemory"));

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
            binPos: new Array<number>(barCount).fill(.02),
            binNeg: new Array<number>(barCount).fill(-.02),
            maxVolume: 1
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
            console.log("audio duration change", duration.value);
        };
        element.oncanplay = () => {
            console.log("audio load");
            loading.value = false;
        };
        element.ontimeupdate = () => {
            currentTime.value = element.currentTime;
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

    async function showTrackBars(_track: SpotifyApi.TrackObjectFull) {
        // get track bars from db or create empty structure
        const canvasWidth = 300;
        const binWidth = 2;
        const barSpacing = 1;
        const barCount = canvasWidth / (binWidth + barSpacing);
        await baseDb;
        let dbTrackBars = (await db.get("trackBars", _track.id)) as TrackBars;
        console.log(dbTrackBars);
        if (dbTrackBars !== undefined && _track.id === trackId.value) {
            canvasBars = dbTrackBars;
        } else if (_track.id === trackId.value) {
            canvasBars = {
                binSize: 1,
                binWidth,
                barSpacing,
                binPos: new Array<number>(barCount).fill(.02),
                binNeg: new Array<number>(barCount).fill(-.02),
                maxVolume: 1
            };
        }
        return { dbTrackBars, canvasWidth, binWidth, barSpacing, barCount };
    }

    async function calculateTrackBars(outPath: string, _trackId: string, barCount: number, binWidth: number, barSpacing: number) {
        let audioContext = new AudioContext();
        let response = await fetch(outPath);
        let decoded = await audioContext.decodeAudioData(await response.arrayBuffer());
        let channelData = decoded.getChannelData(0);

        let binSize = (channelData.length / barCount | 0);
        let binPos = 0;
        let binNeg = 0;
        //only set canvasBars if the playing track is still the one being calculated
        let bars = {
            binSize,
            binWidth,
            barSpacing,
            binPos: [] as number[],
            binNeg: [] as number[],
            maxVolume: 0
        } as TrackBars;
        for (let i = 0; i < channelData.length; i++) {
            if (channelData[i] > 0)
                binPos += channelData[i];
            else
                binNeg += channelData[i];
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
        console.log("Putting track bars!", _trackId, bars.binSize, outPath);
        await db.put("trackBars", bars, _trackId).then();
        return bars;
    }

    function renderProgress() {
        requestAnimationFrame(renderProgress);
        if (context === null || canvasBars === null || canvas === null) return;
        let duration = 1, currentTime = playerElement.currentTime;
        if (playerElement.duration)
            duration = playerElement.duration;

        let mouseHoverBar = canvasBars.binPos.length * mouseHoverPercent.value;
        const defaultBarFill = theme.current.value.dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.2)";
        let { binSize, binWidth, barSpacing } = canvasBars;
        context.clearRect(0, 0, canvas.width, canvas.height);
        let mapping = (x: number) => 2.14285714286 * x + 0.35714285714;
        let normalizer = mapping(normalizeVolume.value ? volumeNormalizer.value : 0.3) * .7;

        for (let i = 0; i < canvasBars.binPos.length; i++) {
            let timePercent = currentTime / duration;
            let isActiveBar = (canvasBars.binPos.length * timePercent | 0) === i;
            let barPartFill = canvasBars.binPos.length * timePercent % 1;


            let binPos = canvasBars.binPos[i] * normalizer;
            let binNeg = canvasBars.binNeg[i] * normalizer;
            let posHeight = binPos / binSize * canvas.height;
            let negHeight = -binNeg / binSize * canvas.height;
            let x = (binWidth + barSpacing) * i | 0;

            context.fillStyle = defaultBarFill;
            if (x / canvas.width < currentTime / duration)
                context.fillStyle = base.themeColor;

            let h = negHeight + posHeight;
            let y = (canvas.height / 2 - negHeight) | 0;
            if (mouseActive.value || mouseHover.value) {
                let mouseDistanceToBar = Math.abs(mouseHoverBar - i);
                let addedHeight = mouseActive.value ? 10 - mouseDistanceToBar * 2 : 7 - mouseDistanceToBar / 1.7;
                if (addedHeight > 0) {
                    y -= addedHeight / 2;
                    h += addedHeight;
                }
            }

            if (isActiveBar) {
                context.fillRect(x, y, binWidth * barPartFill, h);
                context.fillStyle = defaultBarFill;
                context.fillRect(x + (binWidth * barPartFill), y, binWidth * (1 - barPartFill), h);
            } else {
                context.fillRect(x, y, binWidth, h);
            }
        }
    }

    // setInterval(() => {
    //     // console.log(`Current collection id: ${collection.value.id}, current index: ${collectionIndex.value}, current track: ${track.value?.name}`)
    // }, 1000)


    function setMetadata(track: SpotifyApi.TrackObjectFull) {
        let artistsString = track.artists.map(a => a.name).join(", ");
        document.title = track.name + " - " + artistsString;

        if (!("mediaSession" in navigator))
            return;

        let artwork = [{
            src: base.notFoundImage(),
            type: "image/png",
            sizes: "512x512"
        }];
        if (track.album.images.length > 0)
            artwork = track.album.images.map(i => ({
                src: i.url,
                type: "image/png",
                sizes: `${i.width}x${i.height}`
            }));

        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.name,
            artist: artistsString,
            album: track.album.name,
            artwork
        });

        navigator.mediaSession.setActionHandler("previoustrack", () => skip(-1));
        navigator.mediaSession.setActionHandler("nexttrack", () => skip(1));

        let defaultSkipTime = 10;
        navigator.mediaSession.setActionHandler("seekbackward", (event) => {
            const skipTime = event.seekOffset || defaultSkipTime;
            playerElement.currentTime = Math.max(playerElement.currentTime - skipTime, 0);
        });

        navigator.mediaSession.setActionHandler("seekforward", (event) => {
            const skipTime = event.seekOffset || defaultSkipTime;
            playerElement.currentTime = Math.min(playerElement.currentTime + skipTime, playerElement.duration);
        });

        navigator.mediaSession.setActionHandler("play", () => play());

        navigator.mediaSession.setActionHandler("pause", () => pause());

        try {
            navigator.mediaSession.setActionHandler("stop", () => pause());
        } catch (error) {
            console.warn("Warning! The \"stop\" media session action is not supported.");
        }

        try {
            navigator.mediaSession.setActionHandler("seekto", (event) => {
                if (event.seekTime !== undefined && event.seekTime !== null)
                    playerElement.currentTime = event.seekTime;
            });
        } catch (error) {
            console.warn("Warning! The \"seekto\" media session action is not supported.");
        }
    }


    async function skip(n = 1) {
        if (n === -1 && currentTime.value > 5) {
            playerElement.currentTime = 0;
            return;
        }
        let trackId = track.value?.id;
        if (collection.value === null || trackId === null) return;

        console.log("Skip next song", n);
        let index = queue.value.findIndex(t => t.id === trackId);
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
        await load(collection, collection.tracks[Math.floor(Math.random() * collection.tracks.length)]);
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
        unload,
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
        normalizeVolume
    };
});