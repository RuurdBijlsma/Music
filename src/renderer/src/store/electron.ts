import { defineStore } from "pinia";
import { useLibraryStore } from "./library";
import { Ref, ref, toRaw } from "vue";
import fileNamify from "filenamify";
import { baseDb, useBaseStore } from "./base";
import type { IDBPDatabase } from "idb";
import { usePlayerStore } from "./player/player";
import type { DownloadState, YouTubeTrack } from "../scripts/types";
import { executeCached } from "../scripts/utils";
import { useSpotifyAuthStore } from "./spotify-auth";
import { useTrackLoaderStore } from "./player/trackLoader";

export const usePlatformStore = defineStore("platform", () => {
    const library = useLibraryStore();
    const base = useBaseStore();
    const player = usePlayerStore();
    const spotifyAuth = useSpotifyAuthStore();
    const trackLoader = useTrackLoaderStore();

    let db: IDBPDatabase;
    baseDb.then(async (r) => (db = r));
    let directories: { music: string; temp: string } | null = null;

    window.api.getDirectories().then((d) => (directories = d));

    window.events.on("toggleFavorite", async () => {
        if (player.track !== null) {
            let added = await library.toggleLike(player.track);

            let speech = added
                ? "Added to favourites"
                : "Removed from favourites";
            let voices = speechSynthesis.getVoices();
            let voice = voices[Math.floor(Math.random() * voices.length)];
            let utterance = new SpeechSynthesisUtterance(speech);
            utterance.voice = voice;
            speechSynthesis.speak(utterance);
        }
    });
    window.events.on("play", () => player.play());
    window.events.on("pause", () => player.pause());
    window.events.on("skip", (n) => player.skip(n));

    window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", () => {
            window.api.setTheme(
                window.matchMedia &&
                    window.matchMedia("(prefers-color-scheme: dark)").matches
                    ? "dark"
                    : "light",
            );
            setPlatformPlaying(player.playing);
        });

    function setPlatformPlaying(playing: boolean) {
        window.api.setPlatformPlaying(
            playing,
            window.matchMedia &&
                window.matchMedia("(prefers-color-scheme: dark)").matches,
        );
    }

    function stopPlatformPlaying() {
        window.api.stopPlatformPlaying();
    }

    function musicFileNamify(file: string) {
        return fileNamify(file).substring(0, 150).replaceAll("#", "!");
    }

    async function deleteFile(filename: string) {
        await window.api.deleteFile(filename);
    }

    async function trackIsDownloaded(track: SpotifyApi.TrackObjectFull) {
        let { outPath } = trackToNames(track);
        return await checkFileExists(outPath);
    }

    async function makeTempTrack(track: SpotifyApi.TrackObjectFull) {
        let { outPath, filename } = trackToNames(track);
        let tempDir = `${directories?.temp ?? ""}/${filename}.mp3`;
        await window.api.copyFile(outPath, tempDir);
        return tempDir;
    }

    function trackToNames(track: SpotifyApi.TrackObjectFull) {
        let artistsString = track.artists.map((a) => a.name).join(", ");
        const isYouTubeTrack = track.id.startsWith("yt-");
        let filename = musicFileNamify(
            isYouTubeTrack
                ? `${track.name} [${track.id.substring(3)}]`
                : `${track.name} - ${artistsString}`,
        );
        let outPath = `${directories?.music ?? ""}/${filename}.mp3`;
        let query = `${artistsString} - ${track.name}`;
        return { cacheKey: `PTI-${filename}`, filename, outPath, query };
    }

    async function deleteTrackCache(track: SpotifyApi.TrackObjectFull) {
        let { outPath } = trackToNames(track);
        if (await checkFileExists(outPath))
            await window.api.deleteFile(outPath);
    }

    async function getTrackJpg(track: SpotifyApi.TrackObjectFull) {
        let imgUrl = track.album.images[0].url;
        if (imgUrl === undefined)
            return { jpg: "", colors: { dark: "#eee", light: "#333" } };

        let jpg: string = await window.api.downloadAsJpg(imgUrl);
        let colors: { dark: string; light: string } =
            await window.api.getDominantColor(jpg);

        return { jpg, colors };
    }

    async function getTrackFile(track: SpotifyApi.TrackObjectFull) {
        let { outPath } = trackToNames(track);
        if (await checkFileExists(outPath)) return outPath;
        let { jpg } = await getTrackJpg(track);
        let result = await downloadTrackFile(track, undefined, jpg);
        return result.path;
    }

    async function downloadTrackFile(
        track: SpotifyApi.TrackObjectFull,
        youtubeSource?: string,
        imgPath = track.album.images[0]?.url,
    ) {
        const isYouTubeTrack = track.id.startsWith("yt-");

        let { filename, outPath } = trackToNames(track);

        let fun: (p: number) => void;
        fun = (percent: number) => {
            base.events.emit(track.id + "progress", percent);
            if (percent === 100) {
                window.events.off(filename + "progress", fun);
            }
        };
        window.events.on(filename + "progress", fun);

        let tags: any = {
            title: track.name,
            artist: track.artists.map((a) => a.name),
            disc: track.disc_number,
            track: track.track_number,
            id: isYouTubeTrack ? track.id.substring(3) : undefined,
        };
        if (youtubeSource !== undefined) tags.id = youtubeSource;

        if (track.hasOwnProperty("album")) {
            if (track.album.hasOwnProperty("name"))
                tags.album = track.album.name;
            if (track.album.hasOwnProperty("release_date"))
                //@ts-ignore
                tags.year = new Date(track.album.release_date).getFullYear();
        }
        let { id } = await window.api.downloadYt(filename, tags, imgPath ?? "");
        if (base.sourceDialog.tempTrackOverride.trackId === track.id) {
            outPath = await makeTempTrack(track);
            base.sourceDialog.tempTrackOverride.trackId = "";
        }

        return { path: outPath, id };
    }

    async function getVolumeStats(trackPath: string) {
        let { err } = await window.api.getVolumeStats(trackPath);
        let lines = err.split("\n") as string[];
        let volumeLines = lines.filter((l) =>
            l.startsWith("[Parsed_volumedetect_0"),
        );
        let peakLine = volumeLines.find((l) => l.includes("max_volume"));
        let meanLine = volumeLines.find((l) => l.includes("mean_volume"));
        if (meanLine === undefined || peakLine === undefined)
            return { mean: -5, peak: 0 };
        let mean: number, peak: number;
        mean = +meanLine.split("mean_volume:")[1].split("dB")[0].trim();
        peak = +peakLine.split("max_volume:")[1].split("dB")[0].trim();
        return { mean, peak };
    }

    async function youTubeInfoById(id: string) {
        return await executeCached<YouTubeTrack>(
            db,
            async () => {
                let ytr = await window.api.ytInfoById(id);
                let r = ytr[0];
                return {
                    duration: r.duration,
                    description: r.description,
                    channel: r.channel,
                    title: r.title,
                    thumbnail: r.thumbnail,
                    id: r.id,
                    channelUrl: r.channel_url,
                    channelId: r.channel_id,
                    playlist: r.playlist,
                    playlistId: r.playlist_id,
                    viewCount: r.view_count,
                    uploadDate: new Date(
                        `${r.upload_date.substring(
                            0,
                            4,
                        )}-${r.upload_date.substring(
                            4,
                            6,
                        )}-${r.upload_date.substring(6, 8)}`,
                    ),
                };
            },
            "ytId" + id,
            1000 * 60 * 60 * 24 * 365,
        );
    }

    async function checkFileExists(file: string) {
        return window.api.checkFileExists(file);
    }

    async function setTheme(theme: "dark" | "light") {
        window.api.setTheme(theme);
    }

    async function minimize() {
        window.api.minimizeWindow();
    }

    async function close() {
        window.api.closeWindow();
    }

    const maximized = ref(false);

    async function toggleMaximize() {
        maximized.value = await window.api.toggleMaximize();
    }

    const exportMp3State = ref({
        loading: false,
        exported: 0,
        total: 1,
        canceled: false,
    });

    async function exportLikedTracks() {
        let tracks = toRaw(library.tracks).map(
            (t) => t.track as SpotifyApi.TrackObjectFull,
        );
        let result = await window.api.getOutputDirectory();
        if (result.canceled) {
            return null;
        }
        let outputPath = result.filePaths[0];
        return downloadTracks("liked", tracks, async (paths) => {
            for (let p of paths) {
                await window.api.copyIfExists(p, outputPath);
            }
        });
    }

    function firstLogin() {
        return window.api.firstLogin({
            hasCredentials: spotifyAuth.hasCredentials,
            clientId: spotifyAuth.clientId,
            requestedScopes: spotifyAuth.requestedScopes,
            secret: spotifyAuth.secret,
        });
    }

    function resetSpotifyLogin() {
        window.api.resetSpotifyLogin();
    }

    async function updateYtdlp() {
        return window.api.updateYtdlp();
    }

    const downloadState = ref(new Map<string, Ref<DownloadState>>());

    function downloadTracks(
        key: string,
        tracks: SpotifyApi.TrackObjectFull[],
        processFunc: (t: string[]) => Promise<any> = async () => 0,
    ) {
        if (downloadState.value.has(key)) {
            let state = downloadState.value.get(key);
            if (state && state.value.loading) return state;
        }
        let state = ref({
            total: tracks.length,
            downloaded: 0,
            canceled: false,
            loading: true,
        } as DownloadState);

        library.offlineCollections.delete(key);
        db.put(
            "spotify",
            [...toRaw(library.offlineCollections)],
            "offlineCollections",
        ).then();
        downloadState.value.set(key, state);

        (async () => {
            let batchSize = 10;
            for (let i = 0; i < tracks.length; i += batchSize) {
                state.value.downloaded = i;
                let batch = tracks.slice(i, i + batchSize);
                try {
                    let tracks = await Promise.all(
                        batch.map((track) =>
                            trackLoader.getFullTrackData(
                                track as SpotifyApi.TrackObjectFull,
                            ),
                        ),
                    );
                    await processFunc(tracks.map((t) => t.path));
                    if (state.value.canceled) {
                        downloadState.value.delete(key);
                        return;
                    }
                } catch (e: any) {
                    console.warn(e);
                    base.addSnack(`Couldn't download. ${e.message}`, 100000);
                    state.value.loading = false;
                    return;
                }
            }

            library.offlineCollections.add(key);
            db.put(
                "spotify",
                [...toRaw(library.offlineCollections)],
                "offlineCollections",
            ).then();

            state.value.downloaded = tracks.length;
            await new Promise((resolve) => setTimeout(resolve, 100));
            state.value.loading = false;
        })().then();
        return state;
    }

    async function checkTracksDownloaded(tracks: SpotifyApi.TrackObjectFull[]) {
        return await window.api.checkTracksDownloaded(
            tracks.map((t) => trackToNames(t).outPath),
        );
    }

    return {
        downloadTrackFile,
        setTheme,
        close,
        toggleMaximize,
        minimize,
        setPlatformPlaying,
        stopPlatformPlaying,
        trackToNames,
        deleteFile,
        trackIsDownloaded,
        exportLikedTracks,
        exportMp3State,
        deleteTrackCache,
        getVolumeStats,
        youTubeInfoById,
        resetSpotifyLogin,
        firstLogin,
        updateYtdlp,
        downloadTracks,
        downloadState,
        checkTracksDownloaded,
        checkFileExists,
        getTrackJpg,
        getTrackFile,
    };
});
