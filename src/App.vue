<template>
    <v-app class="root" :class="{dark: theme.current.value.dark}">
        <div class="blurry-bg" :style="{
            backgroundImage: `linear-gradient(rgb(var(--v-theme-background), 0.5), rgb(var(--v-theme-background))), url('${blurBgSrc}')`
        }"></div>
        <div class="blurry-bg-transition" :style="{
            transitionDuration,
            opacity: transitionBgOpacity,
            backgroundImage: `linear-gradient(rgb(var(--v-theme-background), 0.5), rgb(var(--v-theme-background))), url('${transitionBgSrc}')`
        }"></div>
        <div class="main">
            <top-menu class="top-menu" />
            <search-suggestions />
            <div class="fake-top-menu" />
            <left-navigation />
            <bottom-music-player class="music-player" v-if="base.windowWidth < 930"></bottom-music-player>
            <music-player class="music-player" v-else :style="{
                    transform: player.track === null ? 'translateX(-100%)' : 'translateX(0%)',
                    transitionDuration: musicPlayerTransitionDuration,
            }" v-if="base.dbLoaded" />
            <div class="router-view" v-if="base.dbLoaded" :style="{
                    width: player.track === null ? 'calc(100% - 90px)' : '50%',
                    transitionDuration: musicPlayerTransitionDuration,
                }">
                <router-view v-slot="{ Component }">
                    <transition name="slide-fade" mode="out-in">
                        <component :is="Component" />
                    </transition>
                </router-view>
            </div>
        </div>
        <source-dialog />
        <item-context-menu />
        <v-snackbar
            v-for="snack in base.snackbars"
            :timeout="snack.timeout"
            v-model="snack.open">
            {{ snack.text }}
            <template v-slot:actions>
                <v-btn variant="text"
                       @click="snack.open = false">
                    Dismiss
                </v-btn>
            </template>
        </v-snackbar>
    </v-app>
</template>


<script setup lang="ts">
// todo
// support smaller window
// paste youtube link in search balk
// playlists, etc. in search functie
// maak knop om ytdlp te updaten
// browse page
// edit information about yt track (change title, artist)
// edit information about any track (start/end time, more?)
// maak knop: export database naar file of cloud?
// in die database kan dan: track customizations (start/end time, etc), spotify api keys, yt liked tracks
// fix get dominant color for youtube tracks
// if delete file thats currently playing, do something about it?
// possibly replace color thief with something without vulnerabilities
// radio
// het is best weird dat de error event nu firet voor ytDownload via search, test even tracks die het horen te doen zie hoe dat gaat, zie hoe een echte error nu handled wordt

import TopMenu from "./components/TopMenu.vue";
import MusicPlayer from "./components/MusicPlayer.vue";
import { useLibraryStore } from "./scripts/store/library";
import { useTheme } from "vuetify";
import { useRoute } from "vue-router";
import SearchSuggestions from "./components/SearchSuggestions.vue";
import { useBaseStore } from "./scripts/store/base";
import { usePlayerStore } from "./scripts/store/player";
import { computed, onUnmounted, ref, toRaw, watch } from "vue";
import ItemContextMenu from "./components/ItemContextMenu.vue";
import SourceDialog from "./components/SourceDialog.vue";
import { storeToRefs } from "pinia";
import LeftNavigation from "./components/LeftNavigation.vue";
import BottomMusicPlayer from "./components/BottomMusicPlayer.vue";

const theme = useTheme();
const library = useLibraryStore();
const route = useRoute();
const base = useBaseStore();
const player = usePlayerStore();
const initialBg = localStorage.hasTrackInMemory === "true" ? "" : "img/cover2.jpg";
const blurBgSrc = computed(() => {
    if (player.track === null) return initialBg;
    return base.itemImage(player.track);
});


const transitionBgSrc = ref(initialBg);
const transitionDuration = ref("0s");
const transitionBgOpacity = ref("1");
const timeoutId = ref(-1);
const musicPlayerTransitionDuration = ref("0s");
setTimeout(() => {
    musicPlayerTransitionDuration.value = "0.5s";
    transitionDuration.value = "3s";
}, 1500);

// Fade transition when switching blurry bg
watch(blurBgSrc, () => {
    clearTimeout(timeoutId.value);
    console.log("Blur change", blurBgSrc.value);
    transitionBgOpacity.value = "0";
    //@ts-ignore
    timeoutId.value = setTimeout(() => {
        transitionBgSrc.value = blurBgSrc.value;
        transitionDuration.value = "0s";
        transitionBgOpacity.value = "1";
        //@ts-ignore
        timeoutId.value = setTimeout(() => {
            transitionDuration.value = "3s";
        }, 50);
    }, 3000);
});

console.log("library.saved", library.saved);
console.log("theme", theme);

</script>

<style lang="scss">
.slide-fade-enter-active {
    transition: all 0.08s ease-out;
}

.slide-fade-leave-active {
    transition: all 0.10s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
    transform: translateX(20px);
    opacity: 0;
}

html, body {
    overflow-y: hidden !important;
    height: 100%;
    background-color: rgb(var(--v-theme-background));
    user-select: none;
}

.blurry-bg, .blurry-bg-transition {
    background-position: center;
    background-size: cover;
    width: calc(100% + 150px);
    height: calc(100% + 150px);
    left: -75px;
    top: -75px;
    position: fixed;
    z-index: 1;
    filter: blur(60px);
}

.blurry-bg-transition {
    transition: opacity 3s;
    opacity: 1;
}

.main {
    position: fixed;
    z-index: 2;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    font-family: "Segoe UI", Helvetica Neue, Helvetica, Arial, sans-serif;
}

.top-menu {
    position: fixed;
    width: 100%;
    top: 0;
    left: 0;
    height: 50px;
    z-index: 5;
    backdrop-filter: blur(40px) saturate(150%);
    background-color: rgba(var(--v-theme-background), 0.3);
}

.dark .top-menu {
    background-color: rgba(var(--v-theme-background), 0.5);
}

.fake-top-menu {
    position: fixed;
    pointer-events: none;
    top: 0;
    right: 0;
    width: calc(100% - 71px);
    height: 50px;
    box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.15);
}

.router-view::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
}

.router-view::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.3);
}

.router-view {
    transition: width 0.5s;
    overflow-y: auto;
    position: fixed;
    height: 100%;
    width: 50%;
    right: 0;
}

.music-player {
    position: fixed;
    height: 100%;
    width: calc(50% - 70px);
    left: 70px;
    transform: translateX(-100%);
    transition: transform 0.5s;
}

@media (max-width: 930px) {
    .router-view {
        width: calc(100% - 70px);
        height: calc(100% - 250px);
        left: 70px;
    }

    .music-player {
        height: 250px;
        width: calc(100% - 70px);
        left: 70px;
        bottom: 0;
    }
}

a[no-style] {
    text-decoration: none;
    color: inherit !important;
}

a[no-style]:hover {
    text-decoration: underline;
}

::-webkit-scrollbar {
    width: 5px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0);
    border-radius: 3px;
}

::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.00);
    border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.4);
}

.v-btn--icon {
    transition: transform 0.3s, color 1s, caret-color 1s !important;
}
</style>
