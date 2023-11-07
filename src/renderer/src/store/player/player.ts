import { defineStore } from "pinia";
import { usePlatformStore } from "../electron";
import { computed, ref, toRaw, watch } from "vue";
import { baseDb, useBaseStore } from "../base";
import type { IDBPDatabase } from "idb";
import { useTheme } from "vuetify";
import type {
    ItemCollection,
    TrackBars,
    TrackData,
    TrackMetadata,
} from "../../scripts/types";
import { shuffleArray } from "../../scripts/utils";
import { useLibraryStore } from "../library";
import { randomNotFound } from "../../scripts/imageSources";
import { useTrackLoaderStore } from "./trackLoader";
import { useStatsStore } from "./playStats";

export const usePlayerStore = defineStore("player", () => {
    const base = useBaseStore();
    const theme = useTheme();
    const platform = usePlatformStore();
    const library = useLibraryStore();
    const trackLoader = useTrackLoaderStore();
    const playerStats = useStatsStore();

    let db: IDBPDatabase;
    baseDb.then(async (r) => {
        db = r;
        if (!library.valuesLoaded) await base.waitFor("valuesLoaded");
        let lastPlaying = library.recentPlays[0];
        if (lastPlaying !== undefined) {
            let t = track.value ?? lastPlaying.tracks[0];
            if (t) load(lastPlaying, t, false).then();
        }
    });

    let playerElement = addAudioEvents(document.createElement("audio"));
    let backupPlayer = document.createElement("audio");

    let mouseHoverPercent = ref(0);
    let mouseActive = ref(false);
    let mouseHover = ref(false);
    let canvasBars: TrackBars | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let context: CanvasRenderingContext2D | null = null;
    requestAnimationFrame(renderProgress);

    const loading = ref(false);
    const playing = ref(false);
    const duration = ref(0);
    const currentTime = ref(0);
    const loadProgress = ref(NaN);
    const track = ref(
        (localStorage.getItem("trackInMemory") === null
            ? null
            : JSON.parse(
                  localStorage.trackInMemory,
              )) as null | SpotifyApi.TrackObjectFull,
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

    let tracksLoading = new Set<string>();
    let isTrackDataLoading = new Set<string>();

    function isActive(
        _collection: ItemCollection,
        _track: SpotifyApi.TrackObjectFull,
    ) {
        return (
            collection.value !== null &&
            _collection.id === collection.value.id &&
            track.value !== null &&
            _track.id === trackId.value
        );
    }

    const sourcePath = ref("");
    let activeTrackData: TrackData | undefined = undefined;

    function playTrackData(_collection: ItemCollection, trackData: TrackData) {
        activeTrackData = trackData;
        if (
            trackData.metadata.volume !== undefined &&
            isActive(_collection, trackData.track)
        ) {
            // volume is normalized to where a track with max volume of >= 38000 gets normalizer 0.3
            // a track with max volume of <= 15000 gets normalizer 1 (so full volume)
            const volumeToNormalizer = (x: number) =>
                -0.06363636364 * (x + 7) + 0.3;
            volumeNormalizer.value = Math.max(
                Math.min(1, volumeToNormalizer(trackData.metadata.volume.mean)),
                0.3,
            );
        }

        if (
            trackData.metadata.imageColor !== undefined &&
            isActive(_collection, trackData.track)
        ) {
            base.themeColorDark = trackData.metadata.imageColor.dark;
            base.themeColorLight = trackData.metadata.imageColor.light;
        }

        if (
            trackData.metadata.trackBars !== undefined &&
            isActive(_collection, trackData.track)
        )
            canvasBars = trackData.metadata.trackBars.trackBars;

        if (
            trackData.path !== undefined &&
            sourcePath.value !== trackData.path &&
            isActive(_collection, trackData.track)
        ) {
            duration.value =
                trackData.metadata.sourceDuration ??
                trackData.track.duration_ms / 1000;

            sourcePath.value = trackData.path;
            playerElement.src = trackData.path;

            if (trackData.likedInfo?.startTime)
                playerElement.currentTime = trackData.likedInfo?.startTime;
        }
    }

    async function load(
        _collection: ItemCollection,
        _track: SpotifyApi.TrackObjectFull,
        autoplay = true,
    ) {
        if (
            trackId.value === _track.id &&
            collection.value?.id !== _collection.id
        ) {
            // load same track in different collection
            // so set source path to "", otherwise the track won't reload
            sourcePath.value = "";
        }
        const _trackId = _track.id;
        console.log(_trackId);
        // if track is already playing, exit
        if (isActive(_collection, _track)) return;

        let isLoading = tracksLoading.has(_trackId);
        tracksLoading.add(_trackId);

        _track = toRaw(_track);

        loading.value = true;
        loadProgress.value = NaN;
        volumeNormalizer.value = 0.5;
        _collection = toRaw(_collection);
        _collection.tracks = _collection.tracks.map((t) => toRaw(t));
        _collection.context = toRaw(_collection.context);

        // add to recently played
        if (collection.value?.id !== _collection.id && library.valuesLoaded) {
            let recentIndex = library.recentPlays.findIndex(
                (r) => r.id === _collection.id,
            );
            if (recentIndex !== -1) library.recentPlays.splice(recentIndex, 1);
            library.recentPlays.unshift(_collection);
            db.put("spotify", toRaw(library.recentPlays), "recentPlays").then();
        }

        collection.value = _collection;
        _track = toRaw(_track);
        track.value = _track;
        trackId.value = _trackId;

        // if track is being loaded by other call to `load`
        // exit here because the track and collection values do need to be set
        if (isLoading) return;

        let onProgress: (p: number) => void;
        onProgress = (percent) => {
            // Check if user hasn't changed track while it was progressing
            if (isActive(_collection, _track)) {
                loadProgress.value = percent;
                if (percent === 100) {
                    base.events.off(_trackId + "progress", onProgress);
                }
            }
        };
        base.events.on(_trackId + "progress", onProgress);

        platform.setPlatformPlaying(autoplay);
        setMetadata(_track);
        playerStats.collectTrackStat(_track).then();
        canvasBars = trackLoader.getEmptyMetaTrackBars().trackBars;

        currentTime.value = 0;
        // swap player element with backup element
        // this causes the media session to stay alive while loading the new track
        removeAudioEvents(playerElement);
        playerElement.pause();
        [playerElement, backupPlayer] = [backupPlayer, playerElement];
        addAudioEvents(playerElement);
        playerElement.autoplay = autoplay;

        if (!isTrackDataLoading.has(_trackId)) {
            isTrackDataLoading.add(_trackId);
            // getTrackData yields when new data is available
            // * path is always there
            // * trackbars, volume stats, imageColor can get added later
            trackLoader
                .getTrackData(
                    _track,
                    (trackData) => {
                        if (trackLoader.isLoadedTrackData(trackData))
                            isTrackDataLoading.delete(_trackId);

                        playTrackData(_collection, trackData);
                        tracksLoading.delete(_trackId);
                    },
                    _collection,
                )
                .then();
        }

        initializeCanvas();
        // set nowPlaying database / localStorage value
        setTimeout(() => {
            if (isActive(_collection, _track)) {
                localStorage.hasTrackInMemory = "true";
                localStorage.trackInMemory = JSON.stringify(_track);
            }
        }, 100);
    }

    async function deleteTrack(deleteTrack: SpotifyApi.TrackObjectFull) {
        if (deleteTrack === null) return;
        await platform.deleteTrackCache(deleteTrack);
        // delete file, and remove metadata, so it can be recalculated for the new mp3 file
        db.get("trackMetadata", deleteTrack.id).then((d?: TrackMetadata) => {
            if (d === undefined) return;
            delete d.sourceDuration;
            delete d.trackBars;
            delete d.volume;
            db.put("trackMetadata", d).then();
        });
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
        currentTime.value = 0;
        loading.value = false;
        loadProgress.value = NaN;
        collection.value = null;
        track.value = null;
        trackId.value = "";

        canvasBars = trackLoader.getEmptyMetaTrackBars().trackBars;
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
            let dur = element.duration;
            if (activeTrackData === undefined) {
                duration.value = dur;
                return;
            }
            activeTrackData.metadata.sourceDuration = dur;
            if (trackLoader.isLoadedTrackData(activeTrackData)) {
                db.put("trackMetadata", activeTrackData.metadata).then();
            }
            if (
                activeTrackData.likedInfo?.startTime !== undefined &&
                activeTrackData.likedInfo?.endTime !== undefined
            ) {
                dur =
                    activeTrackData.likedInfo?.endTime -
                    activeTrackData.likedInfo?.startTime;
            }
            // If it's a liked track and the currently playing track duration does not match the stored duration
            // update it in the db and the list
            // but don't use endTime-startTime for this
            if (
                activeTrackData.likedInfo !== undefined &&
                Math.abs(
                    activeTrackData.likedInfo.track.duration_ms / 1000 - dur,
                ) > 1
            ) {
                activeTrackData.likedInfo.track.duration_ms =
                    element.duration * 1000;
                db.put("tracks", toRaw(activeTrackData.likedInfo)).then();
            }
            duration.value = dur;
        };
        element.oncanplay = () => {
            loading.value = false;
        };
        element.ontimeupdate = async () => {
            let startTime = activeTrackData?.likedInfo?.startTime ?? 0;
            let endTime = activeTrackData?.likedInfo?.endTime;
            if (endTime !== undefined && element.currentTime >= endTime) {
                element.src = "";
                await skip(1);
            }
            currentTime.value = element.currentTime - startTime;
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

    function initializeCanvas() {
        canvas = document.querySelector(".progress-canvas");
        if (canvas !== null) {
            canvas.width = 300;
            canvas.height = 100;
            context = canvas.getContext("2d");
        }
        let bars = activeTrackData?.metadata?.trackBars;
        if (bars && activeTrackData?.track === track.value)
            canvasBars = bars.trackBars;
    }

    let renderedBars = trackLoader.getEmptyMetaTrackBars().trackBars;
    let renderedNormalizer = 1;

    function renderProgress() {
        requestAnimationFrame(renderProgress);
        if (context === null || canvasBars === null || canvas === null) return;

        let mouseHoverBarIndex =
            canvasBars.binPos.length * mouseHoverPercent.value;
        const defaultBarFill = theme.current.value.dark
            ? "rgba(255,255,255,0.4)"
            : "rgba(0,0,0,0.2)";
        let { binWidth, barSpacing } = canvasBars;
        context.clearRect(0, 0, canvas.width, canvas.height);
        let mapping = (x: number) => 2.14285714286 * x + 0.35714285714;
        let normalizer =
            mapping(normalizeVolume.value ? volumeNormalizer.value : 0.3) * 0.7;
        let normDiff = normalizer - renderedNormalizer;
        renderedNormalizer += normDiff / 20;
        if (Math.abs(normDiff) < 0.005) renderedNormalizer = normalizer;

        for (let i = 0; i < canvasBars.binPos.length; i++) {
            let posDiff = canvasBars.binPos[i] - renderedBars.binPos[i];
            let negDiff = canvasBars.binNeg[i] - renderedBars.binNeg[i];
            renderedBars.binPos[i] += posDiff / 20;
            renderedBars.binNeg[i] += negDiff / 20;
            if (Math.abs(posDiff) < 0.005) {
                renderedBars.binPos[i] = canvasBars.binPos[i];
                renderedBars.binNeg[i] = canvasBars.binNeg[i];
            }

            let timePercent = currentTime.value / duration.value;
            let isActiveBar =
                ((canvasBars.binPos.length * timePercent) | 0) === i;
            let barPartFill = (canvasBars.binPos.length * timePercent) % 1;

            let binPos = renderedBars.binPos[i] * renderedNormalizer;
            let binNeg = renderedBars.binNeg[i] * renderedNormalizer;
            let posHeight = binPos * canvas.height;
            let negHeight = -binNeg * canvas.height;
            let x = ((binWidth + barSpacing) * i) | 0;

            context.fillStyle = defaultBarFill;
            if (x / canvas.width < currentTime.value / duration.value)
                context.fillStyle = base.themeColor;

            let h = negHeight + posHeight;
            let y = (canvas.height / 2 - negHeight) | 0;
            if (mouseActive.value || mouseHover.value) {
                let mouseDistanceToBar = Math.abs(mouseHoverBarIndex - i);
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
                playerStats
                    .collectSkipStat(collection.value, track.value)
                    .then();
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
        let startTime = activeTrackData?.likedInfo?.startTime ?? 0;
        playerElement.currentTime = Math.max(startTime, startTime + time);
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
        unload,
        initializeCanvas,
        isActive,
        sourcePath,
    };
});
