import {defineStore} from 'pinia'
import {usePlatformStore} from "./electron";
import {computed, ref, toRaw} from "vue";
import EventEmitter from "events";
import {baseDb, useBaseStore} from "./base";
import type {IDBPDatabase} from "idb";
import {useTheme} from "vuetify";

const events = new EventEmitter()


export const usePlayerStore = defineStore('player', () => {
    const base = useBaseStore()
    const theme = useTheme()
    const platform = usePlatformStore();
    let db: IDBPDatabase
    baseDb.then(r => db = r)

    let playerElement = createAudioElement()
    let playerSwapElement = createAudioElement()
    let mouseHoverPercent = ref(0)
    let mouseActive = ref(false)

    function createAudioElement() {
        let element = document.createElement('audio')
        element.autoplay = true
        element.addEventListener('play', () => {
            playing.value = !element.paused
            console.log("Playing status is", playing.value)
            platform.setPlatformPlaying(true)
        })
        element.addEventListener('pause', () => {
            playing.value = !element.paused
            console.log("Playing status is", playing.value)
            platform.setPlatformPlaying(false)
        })
        element.addEventListener('durationchange', () => {
            duration.value = element.duration
            console.log("audio duration change", duration.value)
        })
        element.addEventListener('canplay', () => {
            console.log("audio load")
            loading.value = false
        })
        element.addEventListener('timeupdate', () => {
            // console.log("audio timeupdate")
            currentTime.value = element.currentTime
        })
        element.addEventListener('ended', async () => {
            console.log("audio ended")
            await skip(1)
        })
        return element
    }

    const loading = ref(false)
    const playing = ref(false)
    const duration = ref(0)
    const currentTime = ref(0)
    const loadProgress = ref(NaN)
    const track = ref(null as null | SpotifyApi.TrackObjectFull)
    const repeat = ref(true)
    const shuffle = ref(false)

    const collection = ref(null as any | null)
    const tracks = computed(() => base.getCollectionTracks(collection.value))
    const collectionIndex = ref(0)

    let canvasBars: { binSize: number, binWidth: number, barSpacing: number, binPos: number[], binNeg: number[] } | null = null
    let canvas: HTMLCanvasElement | null = null
    let context: CanvasRenderingContext2D | null = null
    requestAnimationFrame(renderProgress)

    async function load(_collection: any, index: number) {
        console.log("Load", {_collection, index})
        playerElement.src = ''

        // playerElement.volume = 0

        duration.value = 1
        currentTime.value = 1
        loading.value = true
        loadProgress.value = NaN
        collection.value = _collection
        track.value = tracks.value[index]
        setMetadata(track.value)
        console.log(tracks, tracks.value, tracks.value[index])
        collectionIndex.value = index
        console.log("Playing item", toRaw(track.value))

        // get track bars from db or create empty structure
        const binWidth = 2
        const barSpacing = 1
        const canvasWidth = 300
        const barCount = canvasWidth / (binWidth + barSpacing)
        await baseDb
        let dbTrackBars = await db.get('trackBars', track.value.id)
        console.log(dbTrackBars)
        if (dbTrackBars !== undefined) {
            canvasBars = dbTrackBars
        } else {
            canvasBars = {
                binSize: 1,
                binWidth,
                barSpacing,
                binPos: new Array<number>(barCount).fill(.05),
                binNeg: new Array<number>(barCount).fill(-.05),
            }
        }

        events.on(track.value.id + 'progress', progress => {
            // Check if user hasn't changed track while it was progressing
            if (_collection.id === collection.value.id && index === collectionIndex.value)
                loadProgress.value = progress.percent
        })
        let outPath = await platform.getTrackFile(track.value, events)
        // Check if user hasn't changed track while it was loading
        if (_collection.id === collection.value.id && index === collectionIndex.value)
            playerElement.src = outPath
        console.log(playerElement)

        canvas = document.querySelector('.progress-canvas')
        if (canvas === null) return
        canvas.width = canvasWidth
        canvas.height = 100
        context = canvas.getContext('2d')
        if (context === null) return
        // only calculate track bars if they werent retrieved from db cache
        if (dbTrackBars === undefined) calculateTrackBars(outPath, track.value.id, barCount, binWidth, barSpacing).then()
    }

    async function calculateTrackBars(outPath: string, trackId: string, barCount: number, binWidth: number, barSpacing: number) {
        let audioContext = new AudioContext()
        let response = await fetch(outPath)
        let decoded = await audioContext.decodeAudioData(await response.arrayBuffer())
        let channelData = decoded.getChannelData(0)

        let binSize = (channelData.length / barCount | 0)
        let binPos = 0
        let binNeg = 0
        //only set canvasBars if the playing track is still the one being calculated
        let bars = {binSize, binWidth, barSpacing, binPos: [] as number[], binNeg: [] as number[]}
        for (let i = 0; i < channelData.length; i++) {
            if (channelData[i] > 0)
                binPos += channelData[i]
            else
                binNeg += channelData[i]
            if (i % binSize === binSize - 1) {
                bars.binPos.push(binPos)
                bars.binNeg.push(binNeg)
                binPos = 0
                binNeg = 0
            }
        }
        if (track.value !== null && track.value.id === trackId)
            canvasBars = bars
        db.put('trackBars', bars, trackId).then()
    }

    function renderProgress() {
        requestAnimationFrame(renderProgress)
        if (context === null || canvasBars === null || canvas === null) return
        let duration = 1, currentTime = playerElement.currentTime
        if (playerElement.duration)
            duration = playerElement.duration

        let mouseHoverBar = canvasBars.binPos.length * mouseHoverPercent.value
        const defaultBarFill = theme.current.value.dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.2)'
        let {binSize, binWidth, barSpacing} = canvasBars
        context.clearRect(0, 0, canvas.width, canvas.height)
        for (let i = 0; i < canvasBars.binPos.length; i++) {
            let timePercent = currentTime / duration
            let isActiveBar = (canvasBars.binPos.length * timePercent | 0) === i
            let barPartFill = canvasBars.binPos.length * timePercent % 1

            let binPos = canvasBars.binPos[i]
            let binNeg = canvasBars.binNeg[i]
            let posHeight = binPos / binSize * canvas.height
            let negHeight = -binNeg / binSize * canvas.height
            let x = (binWidth + barSpacing) * i | 0

            context.fillStyle = defaultBarFill
            if (x / canvas.width < currentTime / duration)
                context.fillStyle = base.themeColor.value

            let h = negHeight + posHeight
            let y = (canvas.height / 2 - negHeight) | 0
            if (mouseActive.value) {
                let mouseDistanceToBar = Math.abs(mouseHoverBar - i)
                let addedHeight = 20 - mouseDistanceToBar * 3
                if (addedHeight > 0) {
                    y -= addedHeight / 2
                    h += addedHeight
                }
            }

            if (isActiveBar) {
                context.fillRect(x, y, binWidth * barPartFill, h)
                context.fillStyle = defaultBarFill
                context.fillRect(x + (binWidth * barPartFill), y, binWidth * (1 - barPartFill), h)
            } else {
                context.fillRect(x, y, binWidth, h)
            }
        }
    }

    // setInterval(() => {
    //     // console.log(`Current collection id: ${collection.value.id}, current index: ${collectionIndex.value}, current track: ${track.value?.name}`)
    // }, 1000)


    function setMetadata(track: SpotifyApi.TrackObjectFull) {
        let artistsString = track.artists.map(a => a.name).join(', ');
        document.title = track.name + ' - ' + artistsString;

        if (!('mediaSession' in navigator))
            return;

        let artwork = [{
            src: base.notFoundImage(),
            type: 'image/png',
            sizes: '512x512',
        }];
        if (track.album.images.length > 0)
            artwork = track.album.images.map(i => ({
                src: i.url,
                type: 'image/png',
                sizes: `${i.width}x${i.height}`,
            }));

        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.name,
            artist: artistsString,
            album: track.album.name,
            artwork
        });

        navigator.mediaSession.setActionHandler('previoustrack', () => skip(-1));
        navigator.mediaSession.setActionHandler('nexttrack', () => skip(1));

        let defaultSkipTime = 10;
        navigator.mediaSession.setActionHandler('seekbackward', (event) => {
            const skipTime = event.seekOffset || defaultSkipTime;
            playerElement.currentTime = Math.max(playerElement.currentTime - skipTime, 0);
        });

        navigator.mediaSession.setActionHandler('seekforward', (event) => {
            const skipTime = event.seekOffset || defaultSkipTime;
            playerElement.currentTime = Math.min(playerElement.currentTime + skipTime, playerElement.duration);
        });

        navigator.mediaSession.setActionHandler('play', () => play());

        navigator.mediaSession.setActionHandler('pause', () => pause());

        try {
            navigator.mediaSession.setActionHandler('stop', () => pause());
        } catch (error) {
            console.warn('Warning! The "stop" media session action is not supported.');
        }

        try {
            navigator.mediaSession.setActionHandler('seekto', (event) => {
                if (event.seekTime !== undefined && event.seekTime !== null)
                    playerElement.currentTime = event.seekTime
            });
        } catch (error) {
            console.warn('Warning! The "seekto" media session action is not supported.');
        }
    }


    async function skip(n = 1) {
        if (n === -1 && currentTime.value > 5) {
            playerElement.currentTime = 0
            return
        }
        console.log("Skip next song", n)
        let newIndex = collectionIndex.value + n
        let repeatRequired = false
        if (newIndex >= tracks.value.length) {
            repeatRequired = true
            newIndex = 0
        }
        if (newIndex < 0) {
            repeatRequired = true
            newIndex = tracks.value.length - 1
        }
        if (repeatRequired && !repeat.value)
            return;
        await load(collection.value, newIndex)
    }

    async function togglePlay() {
        if (playing.value) {
            await pause();
        } else {
            await play();
        }
    }

    async function play() {
        await playerElement.play()
    }

    async function pause() {
        await playerElement.pause()
    }

    function seekTo(time: number) {
        playerElement.currentTime = time
    }

    return {
        loading,
        playing,
        duration,
        currentTime,
        loadProgress,
        track,
        collection,
        collectionIndex,
        load,
        skip,
        play,
        pause,
        togglePlay,
        seekTo,
        mouseHoverPercent,
        mouseActive,
    }
})