import { defineStore } from 'pinia'
import { LikedTrack, MetaTrackBars, TrackBars, TrackData, TrackMetadata } from '../../scripts/types'
import { usePlatformStore } from '../electron'
import { useLibraryStore } from '../library'
import { baseDb } from '../../scripts/database'
import { useDialogStore } from '../UI/dialogStore'
import log from 'electron-log/renderer'

export const useTrackLoaderStore = defineStore('trackLoader', () => {
    const platform = usePlatformStore()
    const library = useLibraryStore()
    const dialog = useDialogStore()
    const changeSourceTracks = new Map<string, string>()

    function isLoadedTrackData(trackData: TrackData) {
        return (
            trackData.metadata.volume !== undefined &&
            trackData.metadata.trackBars !== undefined &&
            !trackData.metadata.trackBars.empty &&
            trackData.metadata.imageColor !== undefined
        )
    }

    async function getTrackData(
        track: SpotifyApi.TrackObjectFull,
        onData: (data: TrackData) => any
    ) {
        const db = await baseDb
        const metadata: TrackMetadata | undefined = await db.get('trackMetadata', track.id)
        let trackPath: string | undefined = platform.trackToNames(track).outPath
        if (changeSourceTracks.has(track.id)) {
            trackPath = `${platform.directories?.temp}/${changeSourceTracks.get(track.id)}.mp3`
        }
        const fileSize = await platform.fileSize(trackPath)
        const fileExists = fileSize !== -1

        const likedInfo: undefined | LikedTrack = library.tracks.find((t) => t.id === track.id)
        if (track.album === null) await library.fixTrackAlbum(track)
        const trackData: TrackData = {
            path: fileExists ? trackPath : undefined,
            metadata: metadata ?? {
                id: track.id
            },
            track,
            likedInfo
        }
        trackData.metadata.trackBars ??= getEmptyMetaTrackBars()

        const sendData = (data: TrackData) => {
            if (isLoadedTrackData(data)) {
                // Done with calculations for track
                db.put('trackMetadata', data.metadata)
            }
            onData(data)
        }

        // send initial track data, who knows what's available in the metadata
        if (fileExists) {
            sendData(trackData)
        } else {
            const { jpg, colors } = await platform.getTrackJpg(track)
            trackData.metadata.imageColor = colors
            sendData(trackData)

            const { path, ytId } = await platform.downloadTrackFile(
                track,
                trackData.metadata.youTubeSource,
                jpg,
                trackPath
            )
            trackData.metadata.youTubeSource = ytId
            trackData.path = path
            sendData(trackData)
        }

        if (trackData.path === undefined) {
            throw new Error('Track path is undefined')
        }

        // Track Bars
        async function trackBars() {
            if (fileSize > 300000000) {
                log.warn('File is too big to generate track bars', fileSize)
                const bars = getEmptyMetaTrackBars()
                bars.empty = false
                trackData.metadata.trackBars = bars
            } else {
                // get track bars and set to metadata en do sendData
                const bars = await calculateTrackBars(trackData)
                if (bars === undefined) {
                    dialog.addSnack("Oops, can't calculate trackbars")
                } else {
                    trackData.metadata.trackBars = makeMetaTrackBars(bars)
                }
            }
            return trackData
        }

        // Volume mean and peak
        async function volume() {
            if (trackData.path === undefined) return trackData
            // get volume stats and set to metadata en do sendData
            trackData.metadata.volume = await platform.getVolumeStats(trackData.path)
            return trackData
        }

        // Theme color
        async function imageColor() {
            const { colors } = await platform.getTrackJpg(track)
            trackData.metadata.imageColor = colors
            return trackData
        }

        const emptyBars =
            trackData.metadata.trackBars === undefined || trackData.metadata.trackBars.empty
        if (emptyBars) trackBars().then(sendData)
        if (trackData.metadata.imageColor === undefined) imageColor().then(sendData)
        if (trackData.metadata.volume === undefined) volume().then(sendData)
    }

    async function getFullTrackData(track: SpotifyApi.TrackObjectFull) {
        return new Promise<TrackData>((resolve) => {
            getTrackData(track, (data) => {
                if (isLoadedTrackData(data)) resolve(data)
            })
        })
    }

    const canvasWidth = 300
    const binWidth = 2
    const barSpacing = 1
    const barCount = canvasWidth / (binWidth + barSpacing)

    function makeMetaTrackBars(trackBars: TrackBars, empty = false) {
        return {
            barCount,
            barSpacing,
            binWidth,
            canvasWidth,
            trackBars,
            empty
        }
    }

    function getEmptyMetaTrackBars(): MetaTrackBars {
        return makeMetaTrackBars(
            {
                binSize: 1,
                binWidth,
                barSpacing,
                binPos: new Array<number>(barCount).fill(0.02),
                binNeg: new Array<number>(barCount).fill(-0.02),
                maxVolume: 1
            },
            true
        )
    }

    async function calculateTrackBars(trackData: TrackData) {
        if (!trackData.path) return
        const audioContext = new AudioContext()
        const response = await fetch(trackData.path)
        if (!response.ok) {
            return
        }
        const decoded = await audioContext.decodeAudioData(await response.arrayBuffer())
        let channelData = decoded.getChannelData(0)
        // if track is liked, and start- and endTime are set,
        // clamp channelData to the right range
        if (
            trackData.likedInfo !== undefined &&
            trackData.likedInfo.startTime !== undefined &&
            trackData.likedInfo.endTime !== undefined
        ) {
            const duration = trackData.likedInfo.endTime - trackData.likedInfo.startTime
            channelData = channelData.slice(
                Math.floor((trackData.likedInfo.startTime / duration) * channelData.length),
                Math.ceil(trackData.likedInfo.endTime / duration) * channelData.length
            )
        }

        const binSize = (channelData.length / barCount) | 0
        let binPos = 0
        let binNeg = 0
        //only set canvasBars if the playing track is still the one being calculated
        const bars = {
            binSize,
            binWidth,
            barSpacing,
            binPos: [] as number[],
            binNeg: [] as number[],
            maxVolume: 0
        } as TrackBars
        for (let i = 0; i < channelData.length; i++) {
            if (channelData[i] > 0) binPos += channelData[i]
            else binNeg += channelData[i]
            if (i % binSize === binSize - 1) {
                if (Math.abs(binPos - binNeg) > bars.maxVolume) bars.maxVolume = binPos - binNeg
                bars.binPos.push(binPos / binSize)
                bars.binNeg.push(binNeg / binSize)
                binPos = 0
                binNeg = 0
            }
        }
        return bars
    }

    return {
        getTrackData,
        getEmptyMetaTrackBars,
        isLoadedTrackData,
        getFullTrackData,
        changeSourceTracks
    }
})
