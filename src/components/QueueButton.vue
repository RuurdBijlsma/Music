<template>
    <v-menu :close-on-content-click="false">
        <template v-slot:activator="{ props }">
            <v-btn rounded variant="text" v-bind="props">
                <v-icon>mdi-playlist-play</v-icon>
            </v-btn>
        </template>
        <v-card v-if="collection">
            <v-card-title>{{ collection.name }}</v-card-title>
            <track-list v-if="player.queue.length < 200"
                        :collection="collection"
                        :tracks="player.queue"
                        class="list-container"
                        padding-top="0"/>
            <track-list-virtual v-else
                                :collection="collection"
                                :tracks="player.queue"
                                class="list-container"
                                padding-top="0"
                                :scroll-into-view="focusTrack"
                                height="500"/>
            <v-card-actions v-if="collection.to !== ''">
                <v-btn :disabled="route.path === collection.to" :to="collection.to" :color="base.themeColor">
                    Go to {{ collection.buttonText }}
                </v-btn>
                <v-btn :color="base.themeColor" @click="scrollToTrack">
                    Scroll to to track
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-menu>
</template>

<script setup lang="ts">
import TrackListVirtual from "./TrackListVirtual.vue";
import TrackList from "./TrackList.vue";
import {usePlayerStore} from "../scripts/store/player";
import {storeToRefs} from "pinia";
import {useBaseStore} from "../scripts/store/base";
import {useRoute} from "vue-router";
import {ref} from "vue";

const player = usePlayerStore()
const base = useBaseStore()
const route = useRoute()
const {collection} = storeToRefs(player)
const focusTrack = ref(null as SpotifyApi.TrackObjectFull | null)

function scrollToTrack() {
    if (player.track === null) return
    focusTrack.value = player.track
    let index = player.queue.findIndex(t => t.id === player.trackId)
    let container = document.querySelector('.list-container')
    if (container === null) return
    container.scrollTop = (index - 3) * 50
}
</script>

<style scoped lang="scss">
.list-container {
    max-height: 500px;
    width: 450px;
    overflow-y: auto;
}
</style>