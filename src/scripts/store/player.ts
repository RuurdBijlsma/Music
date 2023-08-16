import {defineStore} from 'pinia'
import {usePlatformStore} from "./electron";
import {ref} from "vue";
import EventEmitter from "events";

const events = new EventEmitter()


export const usePlayerStore = defineStore('player', () => {
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
            console.log("audio timeupdate")
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

    async function load(item: SpotifyApi.TrackObjectSimplified) {
        duration.value = 1
        currentTime.value = 1
        loading.value = true
        loadProgress.value = NaN
        track.value = item
        console.log("Playing item", item)
        let artistsString = item.artists.map(a => a.name).join(', ')
        let query = `${artistsString} - ${item.name}`
        let filename = `${item.name} - ${artistsString}`
        console.log("Query", query, 'filename', filename)
        events.on(query + 'progress', progress => {
            loadProgress.value = progress.percent
        })
        let outPath = await platform.getTrackFile(query, filename, events)
        playerElement.src = outPath
        console.log(playerElement)
    }

    async function skip(n = 1) {
        console.log("Skip next song", n)
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

    return {loading, playing, duration, currentTime, loadProgress, track, load, skip, play, pause, togglePlay}
})