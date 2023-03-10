<template>
    <div class="home">
<!--        TODO STOP IN COMPONENTS-->
        <div class="home-title">
            <h1 class="featured-title mb-5 ml-4">{{ spotify.view.homePage.featured.title }}</h1>
        </div>
        <div class="featured-playlists">
            <div class="highlight-featured mr-2" v-if="highlight">
                <div class="card-info">
                    <h2>{{ highlight.name }}</h2>
                    <p class="card-description mt-3">
                        {{ highlight.description }}
                    </p>
                    <v-spacer/>
                    <div class="buttons mt-3">
                        <v-btn size="40" class="mr-3" icon="mdi-play" variant="tonal"/>
                        <v-btn size="40" icon="mdi-shuffle" variant="tonal"/>
                    </div>
                </div>
                <v-spacer></v-spacer>
                <div class="card-image" :style="{backgroundImage: `url(${highlight.images[0].url})`}"/>
            </div>
            <div class="playlist ml-2 mr-2" v-for="playlist in otherPlaylists">
                <div class="playlist-image" :style="{backgroundImage: `url(${playlist.images[0].url})`}"/>
                <div class="playlist-info mt-2" v-html="playlist.description"></div>
            </div>
        </div>
    </div>
</template>

<script setup>
import {useSpotifyStore} from "../scripts/store/spotify";
import {computed, ref} from "vue";

const spotify = useSpotifyStore();
spotify.refreshHomePage();

const highlight = computed(() => spotify.view.homePage.featured.playlists[0])
const otherPlaylists = computed(() => spotify.view.homePage.featured.playlists.slice(1))
</script>

<style scoped>
.home {
    /*padding: 10px 20px;*/
}
.home-title{
    width:100%;
    text-align:center;
    /*outline:1px solid rgba(0,0,0,0.1);*/
    border-radius:10px;
    padding:10px;
    margin-bottom: 10px;
}
.featured-title {
    margin-bottom: 0 !important;
    font-size: 23px;
    font-weight: 500;
    opacity: .8;
}

.featured-playlists {
    width: calc(100% + 20px);
    padding-right:10px;
    overflow-x: auto;
    display: flex;
    padding-bottom: 5px;
    -webkit-mask-image: linear-gradient(to left, transparent 0%, white 5%);
}

.highlight-featured {
    min-height: 202px;
    /*min-width: 485px;*/
    max-width: 800px;
    height: calc((100vw - 500px) / 4);
    display: flex;
    flex-direction: row;

    background-color: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(100px) saturate(300%) brightness(105%);
    border-radius: 10px;
    box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.2);
}

.card-image {
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
    background-size: cover;
    aspect-ratio: 1;
    height: calc((100vw - 500px) / 4);
    min-height: 202px;
}

.card-info {
    padding: 20px;
    display: flex;
    flex-direction: column;
}

.card-info > h2 {
    white-space: nowrap;
    height: 40px;
    text-overflow: ellipsis;
}

.card-description {
    overflow-y: auto;
    width: 100%;
    word-wrap: anywhere;
    opacity: 0.7;
}

.playlist-image {
    border-radius: 10px;
    box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.2);
    height: calc((100vw - 500px) / 4 - 39px);
    aspect-ratio: 1;
    background-size: cover;
    min-height: 163px;
}

.playlist-info {
    width: calc((100vw - 500px) / 4 - 39px);
    font-size: 13px;
    min-width: 163px;
    opacity: .7;
    overflow:hidden;

    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2; /* number of lines to show */
    line-clamp: 2;
    -webkit-box-orient: vertical;
}
</style>