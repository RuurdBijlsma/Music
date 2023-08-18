import {defineStore} from 'pinia'
import {usePlatformStore} from "./electron";
import {computed, ref} from "vue";
import EventEmitter from "events";
import {useBaseStore} from "./base";

const events = new EventEmitter()


export const usePlayerStore = defineStore('player', () => {
    const base = useBaseStore()
    let playerElement = createAudioElement()
    let playerSwapElement = createAudioElement()

    function createAudioElement() {
        let element = document.createElement('audio')
        element.autoplay = true
        element.addEventListener('play', () => {
            playing.value = !element.paused
            console.log("Playing status is", playing.value)
        })
        element.addEventListener('pause', () => {
            playing.value = !element.paused
            console.log("Playing status is", playing.value)
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

    const platform = usePlatformStore();
    const loading = ref(false)
    const playing = ref(false)
    const duration = ref(0)
    const currentTime = ref(0)
    const loadProgress = ref(NaN)
    const track = ref(null as null | SpotifyApi.TrackObjectSimplified)
    const repeat = ref(true)
    const shuffle = ref(false)

    const collection = ref(null as any | null)
    const tracks = computed(() => base.getCollectionTracks(collection.value))
    const collectionIndex = ref(0)

    async function load(_collection: any, index: number) {
        console.log("Load", {_collection, index})
        playerElement.src = ''
        duration.value = 1
        currentTime.value = 1
        loading.value = true
        loadProgress.value = NaN
        collection.value = _collection
        track.value = tracks.value[index]
        console.log(tracks, tracks.value, tracks.value[index])
        collectionIndex.value = index
        console.log("Playing item", track.value)
        let artistsString = track.value.artists.map(a => a.name).join(', ')
        let query = `${artistsString} - ${track.value.name}`
        let filename = `${track.value.name} - ${artistsString}`
        console.log("Query", query, 'filename', filename)
        events.on(query + 'progress', progress => {
            // Check if user hasn't changed track while it was progressing
            if (_collection.id === collection.value.id && index === collectionIndex.value)
                loadProgress.value = progress.percent
        })
        let outPath = await platform.getTrackFile(query, filename, events)
        // Check if user hasn't changed track while it was loading
        if (_collection.id === collection.value.id && index === collectionIndex.value)
            playerElement.src = outPath
        console.log(playerElement)
    }

    setInterval(() => {
        console.log(`Current collection id: ${collection.value.id}, current index: ${collectionIndex.value}, current track: ${track.value?.name}`)
    }, 1000)

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
        togglePlay
    }
})