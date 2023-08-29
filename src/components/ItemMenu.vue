<template>
    <v-list density="compact">
        <v-list-subheader v-if="showDescriptor" class="descriptor">{{ descriptor }}</v-list-subheader>
        <v-list-item @click="spotify.toggleLike(item.type, item)">
            <template v-slot:prepend>
                <v-icon v-if="isLiked" icon="mdi-heart"></v-icon>
                <v-icon v-else icon="mdi-heart-outline"></v-icon>
            </template>
            <v-list-item-title v-if="isLiked">Remove from library</v-list-item-title>
            <v-list-item-title v-else>Add to library</v-list-item-title>
        </v-list-item>
    </v-list>
</template>

<script setup lang="ts">
import {computed} from "vue";
import type {PropType} from "vue";
import {useBaseStore} from "../scripts/store/base";
import {useSpotifyStore} from "../scripts/store/spotify";
import type {Item} from "../scripts/types";

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
const spotify = useSpotifyStore()
const descriptor = computed(() => {
    const item = props.item
    if (item.type === 'track') {
        return `${item.name} - ${item.artists.map(a => a.name).join(', ')}`
    }
})

const isLiked = computed(() => spotify.checkLiked(props.item.type, props.item.id))

</script>

<style scoped lang="scss">
.descriptor {
    max-width: 250px;
    overflow-x: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>