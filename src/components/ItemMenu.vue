<template>
    <v-list density="compact">
        <v-list-subheader v-if="showDescriptor" class="descriptor">{{ descriptor }}</v-list-subheader>
        <v-list-item @click="library.toggleLike(item)">
            <template v-slot:prepend>
                <v-icon v-if="isLiked" icon="mdi-heart"></v-icon>
                <v-icon v-else icon="mdi-heart-outline"></v-icon>
            </template>
            <v-list-item-title v-if="isLiked">Remove from library</v-list-item-title>
            <v-list-item-title v-else>Add to library</v-list-item-title>
        </v-list-item>
        <v-list-item v-if="item.type==='track'" @click="library.chooseSource(item)">
            <template v-slot:prepend>
                <v-icon icon="mdi-youtube"/>
            </template>
            <v-list-item-title>Choose different source</v-list-item-title>
        </v-list-item>
        <v-list-item v-if="item.type==='track' && isDownloaded" @click="deleteTrack">
            <template v-slot:prepend>
                <v-icon icon="mdi-trash-can"/>
            </template>
            <v-list-item-title>Delete file</v-list-item-title>
        </v-list-item>
    </v-list>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import type {PropType} from "vue";
import {useBaseStore} from "../scripts/store/base";
import {useLibraryStore} from "../scripts/store/library";
import type {Item} from "../scripts/types";
import {usePlatformStore} from "../scripts/store/electron";

const props = defineProps({
    item: {
        type: Object as PropType<Item>,
        required: true,
    },
    showDescriptor: {
        type: Boolean,
        default: false,
    },
})
const base = useBaseStore()
const library = useLibraryStore()
const platform = usePlatformStore()
const isDownloaded = ref(false)
onMounted(() => {
    if (props.item.type === 'track')
        platform.trackIsDownloaded(props.item as SpotifyApi.TrackObjectFull).then(v => {
            console.log("is downloaded", v)
            isDownloaded.value = v
        })
})

async function deleteTrack() {
    await platform.deleteTrack(props.item as SpotifyApi.TrackObjectFull);
    isDownloaded.value = false
}

const descriptor = computed(() => {
    const item = props.item
    if (item.type === 'track') {
        return `${item.name} - ${item.artists.map(a => a.name).join(', ')}`
    }
    if (item.type === 'playlist')
        return item.name
})

const isLiked = computed(() => library.checkLiked(props.item.type, props.item.id))

</script>

<style scoped lang="scss">
.descriptor {
    max-width: 250px;
    overflow-x: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>