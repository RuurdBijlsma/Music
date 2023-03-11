<template>
    <div class="blur-bg"></div>
    <div class="main">
        <top-menu class="top-menu"></top-menu>
        <div class="menu-gradient"></div>
        <div class="router-view" v-if="spotify.dbLoaded">
            <router-view></router-view>
        </div>
        <music-player class="music-player" v-if="spotify.dbLoaded"/>
    </div>
</template>

<script setup lang="ts">
import TopMenu from "./components/TopMenu.vue";
import MusicPlayer from "./components/MusicPlayer.vue";
import {useSpotifyStore} from "./scripts/store/spotify";

const spotify = useSpotifyStore();
console.log("[App.vue]", `Hello world from Electron ${process.versions.electron}!`)
</script>

<style>
html, body {
    overflow-y: hidden !important;
    height: 100%;
    background-color: white;
}

.blur-bg {
    background-image: linear-gradient(rgba(255, 255, 255, 0), rgba(255, 255, 255, 1)), url('assets/cover2.jpg');
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

.menu-gradient {
    position: fixed;
    width: 100%;
    top: 0;
    left: 0;
    height: 150px;
    z-index: 4;
    /*background-image: linear-gradient(rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, .7) 50%, rgba(0, 0, 0, 0) 100%);*/
    pointer-events: none;
}

.top-menu {
    position: fixed;
    width: 100%;
    top: 0;
    left: 0;
    height: 70px;
    z-index: 5;
    backdrop-filter: blur(40px) saturate(150%);
    box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.15);
    background-color: rgba(255, 255, 255, 0.5);
}

.main {
    position: fixed;
    z-index: 2;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    user-select: none;
    font-family: "Segoe UI", Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;
}

.router-view {
    position: fixed;
    height: 100%;
    padding-top: 100px;
    right: 0;
    width: calc(100% - 60vh);
    overflow-y: auto;
    z-index: 2;
}

.router-view::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
}

.router-view::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.3);
}

.music-player {
    width: 60vh;
    position: fixed;
    left: 0;
    height: calc(100% - 100px);
    top: 100px;
    z-index: 6;
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
