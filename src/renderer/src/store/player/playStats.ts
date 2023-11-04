import { defineStore, storeToRefs } from "pinia";
import { ItemCollection } from "../../scripts/types";
import { toRaw, watch } from "vue";
import { usePlayerStore } from "./player";
import { baseDb } from "../base";

export const useStatsStore = defineStore("playerStats", () => {
    const player = usePlayerStore();
    const { playing } = storeToRefs(player);
    let statsInterval = 0;
    let intervalSeconds = 30;
    const collectStatsPeriod = 60;

    function createStatsInterval() {
        if (!playing.value) return;
        // @ts-ignore
        statsInterval = setInterval(() => {
            if (
                intervalSeconds++ % collectStatsPeriod === 0 &&
                player.track !== null &&
                player.collection !== null
            ) {
                collectMinuteStats(player.collection, player.track).then();
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

    const emptyTrackStats = (track: SpotifyApi.TrackObjectFull) => ({
        track: toRaw(track),
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

    async function collectTrackStat(track: SpotifyApi.TrackObjectFull) {
        let currentTrack = track;
        const db = await baseDb;

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
        if (!trackStats) trackStats = emptyTrackStats(track);
        trackStats.listenCount++;
        await db.put("trackStats", trackStats, currentTrack.id);
    }

    async function collectSkipStat(
        collection: ItemCollection,
        track: SpotifyApi.TrackObjectFull,
    ) {
        const db = await baseDb;
        // gets called after every 60 seconds of audio play is elapsed
        if (track === null || collection === null) return;

        let skips = await db.get("statistics", "skips");
        if (skips === undefined) skips = 0;
        await db.put("statistics", ++skips, "skips");

        let trackStats = await db.get("trackStats", track.id);
        if (!trackStats) trackStats = emptyTrackStats(track);
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

    async function collectMinuteStats(
        collection: ItemCollection,
        track: SpotifyApi.TrackObjectFull,
    ) {
        // gets called after every 60 seconds of audio play is elapsed
        const db = await baseDb;
        let today = new Date().toISOString().substring(0, 10);

        let listenMinutes = await db.get("statistics", "listenMinutes");
        if (listenMinutes === undefined) listenMinutes = 0;
        await db.put("statistics", ++listenMinutes, "listenMinutes");

        let historyMinutes = await db.get("statistics", "historyMinutes");
        if (historyMinutes === undefined) historyMinutes = {};
        historyMinutes[today] = (historyMinutes[today] ?? 0) + 1;
        await db.put("statistics", historyMinutes, "historyMinutes");

        let trackStats = await db.get("trackStats", track.id);
        if (!trackStats) trackStats = emptyTrackStats(track);
        trackStats.listenMinutes++;
        await db.put("trackStats", trackStats, track.id);

        for (let artist of track.artists) {
            let artistStats = await db.get("artistStats", artist.id);
            if (!artistStats) artistStats = emptyArtistStats(artist.name);
            artistStats.history[today] = (artistStats.history[today] ?? 0) + 1;
            artistStats.listenMinutes++;
            await db.put("artistStats", artistStats, artist.id);
        }

        let collectionStats = await db.get("collectionStats", collection.id);
        if (!collectionStats)
            collectionStats = emptyCollectionStats(collection.name);
        collectionStats.listenMinutes++;
        await db.put("collectionStats", collectionStats, collection.id);
    }

    return { collectSkipStat, collectTrackStat };
});
