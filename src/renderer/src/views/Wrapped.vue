<template>
    <div class="wrapped">
        <h1>Your Music Wrapped</h1>
        <v-divider class="mt-6 mb-4" />

        <v-btn variant="tonal" :color="ui.themeColor">Theme color</v-btn>
    </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import {useUIStore} from "../store/UIStore";

const route = useRoute();
const ui = useUIStore();

function init() {
    let lsKey = "wrapped" + new Date().getFullYear();
    localStorage[lsKey] = "true";

}

init();
</script>

<style scoped lang="less">
.wrapped {
    padding-top: 70px;
    display: flex;
    justify-content: center;
    flex-direction: column;
    padding-right:20px;
}

h1 {
    font-weight: 600;
    letter-spacing: 3px;
    opacity: 0.9;
}
</style>
