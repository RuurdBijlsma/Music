<template>
    <v-menu :close-on-content-click="false" transition="none" :class="{dark: theme.current.value.dark}">
        <template v-slot:activator="{ props }">
            <v-btn rounded variant="text" v-bind="props" @click="delayedScrollToTrack">
                <v-icon>mdi-playlist-play</v-icon>
            </v-btn>
        </template>
        <div v-if="collection" class="card-bg">
            <v-card-title class="card-title">{{ collection.name }}</v-card-title>
            <v-divider />
            <track-list v-if="player.queue.length < 200"
                        :collection="collection"
                        :tracks="player.queue"
                        class="list-container pb-2"
                        padding-top="0" />
            <track-list-virtual v-else
                                :collection="collection"
                                :tracks="player.queue"
                                class="list-container"
                                padding-top="10px"
                                :scroll-into-view="focusTrack"
                                height="500" />
            <v-card-actions v-if="collection.to !== ''">
                <v-btn :disabled="route.path === collection.to" :to="collection.to" :color="base.themeColor">
                    Go to {{ collection.buttonText }}
                </v-btn>
                <v-btn :color="base.themeColor" @click="scrollToTrack">
                    Scroll to track
                </v-btn>
            </v-card-actions>
        </div>
    </v-menu>
</template>

<script setup lang="ts">
import TrackListVirtual from "./TrackListVirtual.vue";
import TrackList from "./TrackList.vue";
import { usePlayerStore } from "../store/player";
import { storeToRefs } from "pinia";
import { useBaseStore } from "../store/base";
import { useRoute } from "vue-router";
import { ref } from "vue";
import { useTheme } from "vuetify";

const player = usePlayerStore();
const base = useBaseStore();
const theme = useTheme();
const route = useRoute();
const { collection } = storeToRefs(player);
const focusTrack = ref(null as SpotifyApi.TrackObjectFull | null);

let smoothScroll = false;

function delayedScrollToTrack() {
    smoothScroll = false;
    setTimeout(() => {
        scrollToTrack();
        smoothScroll = true;
    }, 100);
}

function scrollToTrack() {
    if (player.track === null) return;
    focusTrack.value = player.track;
    let index = player.queue.findIndex(t => t.id === player.trackId);
    let container = document.querySelector(".list-container");
    if (container === null) return;
    container.scrollTo({ top: (index - 3) * 50, behavior: smoothScroll ? "smooth" : "auto" });
}
</script>

<style scoped lang="less">
.card-bg {
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 5px 0 rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(40px) saturate(150%) brightness(120%);
    background-color: rgba(var(--v-theme-background), 0.4);
}

.dark .card-bg {
    backdrop-filter: blur(40px) saturate(150%) brightness(90%);
    background-color: rgba(var(--v-theme-background), 0.6);
}

.card-title {
    opacity: .7;
    font-weight: bolder;
}

.list-container {
    max-height: 500px;
    width: 450px;
    overflow-y: auto;
}
</style>