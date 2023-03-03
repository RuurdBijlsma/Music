<template>
    <div class="blur-bg"></div>
    <div class="main">
        <top-menu></top-menu>
        <router-view></router-view>
        <bottom-bar class="bottom-bar"></bottom-bar>
    </div>
</template>

<script setup lang="ts">
import TopMenu from "./components/top-menu.vue";
import BottomBar from "./components/bottom-bar.vue";

console.log("[App.vue]", `Hello world from Electron ${process.versions.electron}!`)
</script>

<style>
html, body {
    overflow-y: hidden !important;
    height: 100%;
}

.blur-bg {
    background-image: linear-gradient(rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.5)), url('assets/cover.jpg');
    background-position: center;
    background-size: 200%;
    width: 100%;
    height: 100%;
    position: fixed;
    z-index: 1;
    filter: blur(50px);
}

.main {
    font-weight: 300;
    position: fixed;
    z-index: 2;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    user-select: none;
    font-family: Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;
}

.bottom-bar {
    position: fixed;
    bottom: 10px;
    left: 10px;
}
</style>
