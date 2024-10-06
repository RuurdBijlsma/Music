<template>
    <v-app :class="{ dark: ui.isDark }" class="root">
        <div
            :style="{
                backgroundImage: `linear-gradient(rgb(var(--v-theme-background), 0.5), rgb(var(--v-theme-background))), url('${blurBgSrc}')`
            }"
            class="blurry-bg"
        ></div>
        <div
            :style="{
                transitionDuration,
                opacity: transitionBgOpacity,
                backgroundImage: `linear-gradient(rgb(var(--v-theme-background), 0.5), rgb(var(--v-theme-background))), url('${transitionBgSrc}')`
            }"
            class="blurry-bg-transition"
        ></div>
        <div class="main">
            <top-menu class="top-menu" />
            <search-suggestions />
            <div class="fake-top-menu" />
            <left-navigation />
            <bottom-music-player
                v-if="ui.windowWidth <= 930 && dbLoaded"
                :style="{
                    transform: player.track === null ? 'translateX(-100%)' : 'translateX(0%)',
                    transitionDuration: musicPlayerTransitionDuration
                }"
                class="music-player"
            />
            <music-player
                v-else
                v-if="dbLoaded"
                :style="{
                    transform: player.track === null ? 'translateX(-100%)' : 'translateX(0%)',
                    transitionDuration: musicPlayerTransitionDuration
                }"
                class="music-player"
            />
            <div
                v-if="dbLoaded"
                :style="{
                    width:
                        ui.windowWidth <= 930
                            ? 'calc(100% - 70px)'
                            : player.track === null
                              ? 'calc(100% - 90px)'
                              : '50%',
                    transitionDuration: musicPlayerTransitionDuration
                }"
                class="router-view"
            >
                <router-view v-slot="{ Component }">
                    <transition mode="out-in" name="slide-fade">
                        <component :is="Component" />
                    </transition>
                </router-view>
            </div>
        </div>
        <dialogs />
    </v-app>
</template>

<script lang="ts" setup>
// TODO
// Change most skipped tracks to most skipped liked tracks and only show liked tracks there

import TopMenu from './components/main-ui/TopMenu.vue'
import MusicPlayer from './components/player/MusicPlayer.vue'
import SearchSuggestions from './components/search/SearchSuggestions.vue'
import { usePlayerStore } from './store/player/player'
import { computed, ref, watch } from 'vue'
import LeftNavigation from './components/main-ui/LeftNavigation.vue'
import BottomMusicPlayer from './components/player/BottomMusicPlayer.vue'
//@ts-ignore
import coverImage from '../assets/cover.jpg?asset'
import { useUIStore } from './store/UI/UIStore'
import { dbLoaded } from './scripts/database'
import { itemImage } from './scripts/item-utils'
import Dialogs from './components/dialogs/Dialogs.vue'

const ui = useUIStore()
const player = usePlayerStore()
const initialBg = coverImage
const blurBgSrc = computed(() => {
    if (player.track === null) return initialBg
    return itemImage(player.track)
})

const transitionBgSrc = ref(blurBgSrc.value)
const transitionDuration = ref('0s')
const transitionBgOpacity = ref('1')
const timeoutId = ref(-1)
const musicPlayerTransitionDuration = ref('0s')
setTimeout(() => {
    musicPlayerTransitionDuration.value = '0.5s'
    transitionDuration.value = '3s'
}, 1500)

// Fade transition when switching blurry bg
watch(blurBgSrc, () => {
    clearTimeout(timeoutId.value)
    transitionBgOpacity.value = '0'
    //@ts-ignore
    timeoutId.value = setTimeout(() => {
        transitionBgSrc.value = blurBgSrc.value
        transitionDuration.value = '0s'
        transitionBgOpacity.value = '1'
        //@ts-ignore
        timeoutId.value = setTimeout(() => {
            transitionDuration.value = '3s'
        }, 50)
    }, 3000)
})
</script>

<style lang="less">
.slide-fade-enter-active {
    transition: all 0.08s ease-out;
}

.slide-fade-leave-active {
    transition: all 0.1s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
    transform: translateX(20px);
    opacity: 0;
}

html,
body {
    overflow-y: hidden !important;
    height: 100%;
    background-color: rgb(var(--v-theme-background));
    user-select: none;
}

.blurry-bg,
.blurry-bg-transition {
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
    font-family:
        'Segoe UI',
        Helvetica Neue,
        Helvetica,
        Arial,
        sans-serif;
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
        height: calc(100% - 150px);
        left: 70px;
    }

    .music-player {
        height: 150px;
        width: calc(100% - 70px);
        left: 70px;
        bottom: 0;
    }
}

h1,
h2,
h3,
h4 {
    font-weight: 400;
    text-align: center;
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
    background: rgba(0, 0, 0, 0);
    border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.4);
}

.v-btn--icon {
    transition:
        transform 0.3s,
        color 1s,
        caret-color 1s !important;
}

*[no-drag] {
    -webkit-app-region: no-drag;
}
</style>
