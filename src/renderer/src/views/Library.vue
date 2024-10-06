<template>
    <div class="library">
        <div class="nav-buttons mt-2 mb-2">
            <v-btn :active="tab === 'tracks'" variant="text" @click="tab = 'tracks'">Tracks </v-btn>
            <v-btn :active="tab === 'albums'" variant="text" @click="tab = 'albums'">Albums </v-btn>
            <v-btn :active="tab === 'artists'" variant="text" @click="tab = 'artists'"
                >Artists
            </v-btn>
            <v-btn :active="tab === 'playlists'" variant="text" @click="tab = 'playlists'"
                >Playlists
            </v-btn>
        </div>
        <v-window v-model="tab">
            <v-window-item value="tracks">
                <tracks />
            </v-window-item>
            <v-window-item value="albums">
                <albums />
            </v-window-item>
            <v-window-item value="artists">
                <artists />
            </v-window-item>
            <v-window-item value="playlists">
                <playlists />
            </v-window-item>
        </v-window>
    </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import Tracks from './library/Tracks.vue'
import Artists from './library/Artists.vue'
import Albums from './library/Albums.vue'
import { useRoute } from 'vue-router'
import Playlists from './library/Playlists.vue'

const tab = ref('tracks')
const route = useRoute()
watch(route, () => {
    checkRoute()
})

function checkRoute() {
    if (route.path.startsWith('/library/')) {
        tab.value = route.path.slice(9)
    }
}

checkRoute()
</script>

<style lang="less" scoped>
.library {
    padding-top: 60px;
}

.nav-buttons {
    display: flex;
    gap: 20px;
    justify-content: center;
}
</style>
