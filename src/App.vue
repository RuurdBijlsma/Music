<template>
    <v-app class="root" :class="{dark: theme.current.value.dark}">
        <div class="blur-bg"></div>
        <div class="main">
            <top-menu class="top-menu"/>
            <search-suggestions/>
            <div class="fake-top-menu"/>
            <div class="left-nav">
                <v-btn class="nav-1-btn nav-button"
                       :icon="route.path === '/' ? 'mdi-play-box' : 'mdi-play-box-outline'"
                       variant="text"
                       to="/"></v-btn>
                <span class="button-text nav-1-text"
                      :class="{active: route.path === '/'}">Listen Now</span>
                <v-btn class="nav-2-btn nav-button"
                       :icon="route.path === '/browse' ? 'mdi-library' : 'mdi-library-outline'"
                       variant="text"
                       to="/browse"></v-btn>
                <span class="button-text nav-2-text"
                      :class="{active: route.path === '/browse'}">Browse</span>
                <v-btn class="nav-3-btn nav-button"
                       variant="text"
                       :icon="route.path === '/library' ? 'mdi-music-note' : 'mdi-music-note-outline'"
                       rounded
                       to="/library"/>
                <span class="button-text nav-3-text"
                      :class="{active: route.path === '/library'}">Library</span>
            </div>
            <music-player class="music-player" v-if="spotify.dbLoaded"/>
            <div class="router-view" v-if="spotify.dbLoaded">
                <router-view v-slot="{ Component }">
                    <transition name="slide-fade" mode="out-in">
                        <component :is="Component"/>
                    </transition>
                </router-view>
            </div>
        </div>
    </v-app>
</template>

<script setup lang="ts">
// todo:
//  youtube search results cachen voor bepaalde tijd
//  load title index values into js memory for faster search??? TRIGRAMS???
//  maybe cache visited playlists for faster load times per session (no idb)
//  browse page
//  make maximize/minimize/close functional
//  make music player
// add spotify en youtube search

import TopMenu from "./components/TopMenu.vue";
import MusicPlayer from "./components/MusicPlayer.vue";
import {useSpotifyStore} from "./scripts/store/spotify";
import {useTheme} from "vuetify";
import {useRoute} from "vue-router";
import SearchSuggestions from "./components/SearchSuggestions.vue";

const theme = useTheme()
const spotify = useSpotifyStore()
const route = useRoute()

console.log('spotify.library', spotify.library);
console.log('theme', theme);

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
}

.blur-bg {
    background-image: linear-gradient(rgb(var(--v-theme-background), 0.5), rgb(var(--v-theme-background))), url('assets/cover2.jpg');
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

.main {
    position: fixed;
    z-index: 2;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    user-select: none;
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
    left: 70px;
    width: calc(100% - 70px);
    height: 50px;
    box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.15);
}

.left-nav {
    position: fixed;
    left: 0;
    top: 50px;
    width: 70px;
    height: calc(100% - 50px);
    backdrop-filter: blur(40px) saturate(150%);
    box-shadow: 1px 0 1px 0 rgba(0, 0, 0, 0.1);
    background-color: rgba(var(--v-theme-background), 0.3);
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 20px;
    z-index: 3;
}

.dark .left-nav {
    background-color: rgba(var(--v-theme-background), 0.5);
}

.nav-button {
    transform: translateY(0);
}

.nav-button:hover {
    transform: translateY(-5px);
}

.nav-button.v-btn--active {
    transform: translateY(-5px);
}

.button-text {
    font-size: 11px;
    font-weight: 400;
    margin-top: -10px;
    opacity: 0;
    transform: translateY(-10px);
    transition: .3s;
    pointer-events: none;
}

.nav-1-btn:hover + .nav-1-text {
    opacity: .6;
    transform: translateY(0px);
}

.nav-2-btn:hover + .nav-2-text {
    opacity: .6;
    transform: translateY(0px);
}

.nav-3-btn:hover + .nav-3-text {
    opacity: .6;
    transform: translateY(0px);
}

.button-text.active {
    opacity: .8;
    transform: translateY(0px);
}

.router-view::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
}

.router-view::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.3);
}

.router-view {
    overflow-y: auto;
    //background-color: blue;
    position: fixed;
    height: 100%;
    width: 50%;
    right: 0;
}

.music-player {
    position: fixed;
    height: 100%;
    //background-color: red;
    width: calc(50% - 70px);
    left: 70px;
}

@media only screen and (max-width: 900px) {
    .router-view {
        width: 100%;
        height: calc(100% - 100px);
        padding-left: 80px;
    }
    .music-player {
        width: 100%;
        height: 100px;
        bottom: 0;
    }
}

@media only screen and (min-width: 1000px) {
    .router-view {
        width: 50%;
    }
    .music-player {
        width: calc(50% - 70px);
        left: 70px;
    }
}

@media only screen and (min-width: 1250px) {
    .router-view {
        width: 800px;
    }
    .music-player {
        width: calc(100% - 870px);
        left: 70px;
        padding-left: 10px;
    }
}

@media only screen and (min-width: 1550px) {
    .router-view {
        width: 1000px;
    }
    .music-player {
        width: calc(100% - 1070px);
        left: 70px;
        padding-left: 10px;
    }
}

@media only screen and (min-width: 1800px) {
    .router-view {
        width: 1000px;
    }
    .music-player {
        width: calc(90% - 1070px);
        left: calc(70px + 5%);
        padding-left: 10px;
    }
}

@media only screen and (min-width: 2200px) {
    .router-view {
        width: 1000px;
    }
    .music-player {
        width: calc(75% - 1070px);
        left: calc(70px + 12.5%);
        padding-left: 10px;
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
</style>
