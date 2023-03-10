<template>
    <div class="blur-bg"></div>
    <div class="menu-gradient"></div>
    <div class="main">
        <top-menu class="top-menu"></top-menu>
        <div class="router-view">
            <router-view></router-view>
        </div>
        <music-player class="music-player"></music-player>
    </div>
</template>

<script setup lang="ts">
import TopMenu from "./components/top-menu.vue";
import MusicPlayer from "./components/music-player.vue";

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
    height: 300px;
    /*background-image: linear-gradient(rgba(255, 255, 255, .5) 0%, rgba(0, 0, 0, 0) 100%);*/
}

.top-menu {
    position: fixed;
    width: 100%;
    top: 0;
    left: 0;
    height: 100px;
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
    height: calc(100% - 120px);
    top: 100px;
    left: 20px;
    width: calc(100% - 60vh - 20px);
}

.music-player {
    width: 60vh;
    position: fixed;
    right: 0;
    height: calc(100% - 100px);
    top: 100px;
}


::-webkit-scrollbar {
    width: 5px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
}

::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.4);
    border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.7);
}
</style>
