import {defineStore} from 'pinia'
import {openDB} from "idb";
import {ref, toRaw} from "vue";
import type {Item} from "./base";
import {usePlatformStore} from "./electron";

let playerElement = document.createElement('audio')
let playerSwapElement = document.createElement('audio')

export const usePlayerStore = defineStore('player', () => {
    const platform = usePlatformStore();

    async function play(item: SpotifyApi.TrackObjectSimplified) {
        console.log("Playing item", item)
        let query = `${item.artists.map(a => a.name).join(', ')} - ${item.name}`
        console.log("Query", query)
        // let results = await platform.searchYouTube(query, 3)
        // console.log('results:', results)
        await platform.downloadYouTube(query)
    }

    return {play}
})