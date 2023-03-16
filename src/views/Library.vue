<template>
    <div>
        <div class="nav-buttons mt-2 mb-2">
            <v-btn :variant="tab === 'tracks' ? 'tonal' : 'text'" @click="tab='tracks'">Tracks</v-btn>
            <v-btn :variant="tab === 'albums' ? 'tonal' : 'text'" @click="tab='albums'">Albums</v-btn>
            <v-btn :variant="tab === 'artists' ? 'tonal' : 'text'" @click="tab='artists'">Artists</v-btn>
        </div>
        <v-window v-model="tab">
            <v-window-item value="tracks">
                <tracks/>
            </v-window-item>
            <v-window-item value="albums">
                <albums/>
            </v-window-item>
            <v-window-item value="artists">
                <artists/>
            </v-window-item>
        </v-window>
    </div>
</template>

<script setup lang="ts">
import {ref, watch} from "vue";
import Tracks from "./library/Tracks.vue";
import Artists from "./library/Artists.vue";
import Albums from "./library/Albums.vue";
import {useRoute} from "vue-router";

const tab = ref('tracks');
const route = useRoute();
watch(route, () => {
    checkRoute();
})

function checkRoute() {
    if (route.path.startsWith('/library/')) {
        tab.value = route.path.slice(9);
        console.log(tab.value);
    }
}

checkRoute();
</script>

<style scoped>
.nav-buttons {
    display: flex;
    gap: 20px;
    justify-content: center;
}
</style>