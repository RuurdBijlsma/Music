import { defineStore } from 'pinia'
import {
    ArtistStat,
    CollectionStat,
    ItemCollection,
    Statistics,
    TrackStat
} from '../../scripts/types'
import { toRaw } from 'vue'
import { usePlayerStore } from './player'
import { useBaseStore } from '../base'
import { useSpotifyApiStore } from '../spotify-api'
import { baseDb } from '../../scripts/database'

export const useStatsStore = defineStore('playerStats', () => {
    const player = usePlayerStore()
    const spotify = useSpotifyApiStore()
    const base = useBaseStore()

    let intervalSeconds = base.isDev ? 5 : 30
    const collectStatsPeriod = base.isDev ? 10 : 60

    setInterval(() => {
        if (
            player.playing &&
            intervalSeconds++ % collectStatsPeriod === 0 &&
            player.track !== null &&
            player.collection !== null
        ) {
            collectMinuteStats(player.collection, player.track).then()
        }
    }, 1000)

    const emptyTrackStats = (track: SpotifyApi.TrackObjectFull): TrackStat => ({
        id: track.id,
        track: toRaw(track),
        skips: 0,
        listenMinutes: 0,
        listenCount: 0
    })
    const emptyArtistStats = (artist: SpotifyApi.ArtistObjectSimplified): ArtistStat => ({
        id: artist.id,
        artist: toRaw(artist),
        skips: 0,
        listenMinutes: 0,
        history: {}
    })
    const emptyCollectionStats = (collection: ItemCollection): CollectionStat => ({
        name: collection.name,
        id: collection.id,
        buttonText: collection.buttonText,
        to: collection.to,
        context: toRaw(collection.context),
        skips: 0,
        listenMinutes: 0
    })

    async function collectTrackStat(track: SpotifyApi.TrackObjectFull) {
        const currentTrack = track
        const db = await baseDb

        let listenCount = await db.get('statistics', 'listenCount')
        if (listenCount === undefined) listenCount = 0
        await db.put('statistics', ++listenCount, 'listenCount')

        if (currentTrack === null) return

        let trackStats: TrackStat = await db.get('trackStats', currentTrack.id)
        if (!trackStats) trackStats = emptyTrackStats(track)
        trackStats.listenCount++
        await db.put('trackStats', trackStats)
    }

    async function collectSkipStat(collection: ItemCollection, track: SpotifyApi.TrackObjectFull) {
        const db = await baseDb
        // gets called after every 60 seconds of audio play is elapsed
        if (track === null || collection === null) return

        let skips = await db.get('statistics', 'skips')
        if (skips === undefined) skips = 0
        await db.put('statistics', ++skips, 'skips')

        let trackStats: TrackStat = await db.get('trackStats', track.id)
        if (!trackStats) trackStats = emptyTrackStats(track)
        trackStats.skips++
        await db.put('trackStats', trackStats)

        for (const artist of track.artists) {
            let artistStats: ArtistStat = await db.get('artistStats', artist.id)
            if (!artistStats) artistStats = emptyArtistStats(artist)
            artistStats.skips++
            await db.put('artistStats', artistStats)
        }

        let collectionStats: CollectionStat = await db.get('collectionStats', collection.id)
        if (!collectionStats) collectionStats = emptyCollectionStats(collection)
        collectionStats.skips++
        await db.put('collectionStats', collectionStats)
    }

    async function collectMinuteStats(
        collection: ItemCollection,
        track: SpotifyApi.TrackObjectFull
    ) {
        // gets called after every 60 seconds of audio play is elapsed
        const db = await baseDb
        const today = new Date().toISOString().substring(0, 10)

        let listenMinutes = await db.get('statistics', 'listenMinutes')
        if (listenMinutes === undefined) listenMinutes = 0
        await db.put('statistics', ++listenMinutes, 'listenMinutes')

        let historyMinutes = await db.get('statistics', 'historyMinutes')
        if (historyMinutes === undefined) historyMinutes = {}
        historyMinutes[today] = (historyMinutes[today] ?? 0) + 1
        await db.put('statistics', historyMinutes, 'historyMinutes')

        let trackStats: TrackStat = await db.get('trackStats', track.id)
        if (!trackStats) trackStats = emptyTrackStats(track)
        trackStats.listenMinutes++
        await db.put('trackStats', trackStats)

        for (const artist of track.artists) {
            let artistStats: ArtistStat = await db.get('artistStats', artist.id)
            if (!artistStats) artistStats = emptyArtistStats(artist)
            artistStats.history[today] = (artistStats.history[today] ?? 0) + 1
            artistStats.listenMinutes++
            await db.put('artistStats', artistStats)
        }

        let collectionStats: CollectionStat = await db.get('collectionStats', collection.id)
        if (!collectionStats) collectionStats = emptyCollectionStats(collection)
        collectionStats.listenMinutes++
        await db.put('collectionStats', collectionStats)

        addToHistoryMinutes(today, 'duration', track.duration_ms / 1000).then()

        // collect spotify specific info
        if (track.id.startsWith('yt-')) return
        const stats = await spotify.getTrackFeatures(track.id)
        await Promise.all([
            addToHistoryMinutes(today, 'popularity', track.popularity),
            addToHistoryMinutes(today, 'acousticness', stats.acousticness),
            addToHistoryMinutes(today, 'danceability', stats.danceability),
            addToHistoryMinutes(today, 'energy', stats.energy),
            addToHistoryMinutes(today, 'instrumentalness', stats.instrumentalness),
            addToHistoryMinutes(today, 'key', stats.key),
            addToHistoryMinutes(today, 'liveness', stats.liveness),
            addToHistoryMinutes(today, 'loudness', stats.loudness),
            addToHistoryMinutes(today, 'mode', stats.mode),
            addToHistoryMinutes(today, 'speechiness', stats.speechiness),
            addToHistoryMinutes(today, 'tempo', stats.tempo),
            addToHistoryMinutes(today, 'timeSignature', stats.time_signature),
            addToHistoryMinutes(today, 'valence', stats.valence)
        ])
    }

    async function addToHistoryMinutes(today: string, statKey: string, value?: number) {
        if (value === undefined) return
        const db = await baseDb
        let history = await db.get('statistics', statKey)
        if (history === undefined) history = {}
        if (!history.hasOwnProperty(today)) {
            history[today] = {
                sum: 0,
                minutes: 0
            }
        }
        history[today].sum += value
        history[today].minutes++
        await db.put('statistics', history, statKey)
    }

    async function getTopFromIndex<T>(
        store: string,
        indexKey: string,
        limit = 10,
        highToLow = true
    ) {
        const db = await baseDb
        const tx = db.transaction(store, 'readonly')
        const index = tx.store.index(indexKey)
        let cursor = await index.openCursor(null, highToLow ? 'prev' : 'next')
        const result: T[] = []

        for (let i = 0; i < limit; i++) {
            if (!cursor) break
            result.push(cursor.value)
            cursor = await cursor.continue()
        }

        return result
    }

    function augmentHistoryMinutes<T>(historyMinutes: { [key: string]: T }, emptyVal: T) {
        console.log('Augmenting', historyMinutes)
        const dates = Object.keys(historyMinutes).map((k) => +new Date(k))
        const firstDate = Math.min(...dates)
        const day = 1000 * 60 * 60 * 24
        for (let date = firstDate + day; date < +new Date(); date += day) {
            const dateKey = new Date(date).toISOString().substring(0, 10)
            if (!historyMinutes.hasOwnProperty(dateKey)) historyMinutes[dateKey] = emptyVal
        }
    }

    async function generateWrapStats(trackLimit = 10, artistLimit = 5) {
        // TOP LISTENED STUFF
        const topArtists = await getTopFromIndex<ArtistStat>(
            'artistStats',
            'listenMinutes',
            artistLimit
        )
        const topCollections = await getTopFromIndex<CollectionStat>(
            'collectionStats',
            'listenMinutes',
            5
        )
        const topTracks = await getTopFromIndex<TrackStat>(
            'trackStats',
            'listenMinutes',
            trackLimit
        )
        // MOST SKIPPED STUFF
        const skipArtists = await getTopFromIndex<ArtistStat>('artistStats', 'skips', artistLimit)
        let skipTracks = await getTopFromIndex<TrackStat>('trackStats', 'skips', trackLimit * 10)
        skipTracks = skipTracks
            .map((s) => ({
                ...s,
                skipPercentage: Math.min(100, (100 * s.skips) / s.listenCount)
            }))
            .sort((a, b) => b.skipPercentage - a.skipPercentage)
            .slice(0, trackLimit)

        const db = await baseDb
        const statValues = await db.getAll('statistics')
        const statKeys = await db.getAllKeys('statistics')
        const statistics = statKeys.reduce(
            (acc, key, i) => ({ ...acc, [key.toString()]: statValues[i] }),
            {}
        ) as Statistics
        augmentHistoryMinutes(statistics.historyMinutes, 0)
        return {
            topArtists,
            topCollections,
            topTracks,
            skipArtists,
            skipTracks,
            statistics
        }
    }

    return {
        collectSkipStat,
        collectTrackStat,
        generateWrapStats,
        augmentHistoryMinutes
    }
})
