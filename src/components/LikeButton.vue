<template>
    <v-btn rounded variant="text" :loading="likedLoading" :color="isLiked ? base.themeColor : 'default'"
           @click="toggleLike()">
        <v-icon>{{ base.themeTooSimilarToFg && isLiked ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
    </v-btn>
</template>

<script setup lang="ts">
import {useBaseStore} from "../scripts/store/base";
import {computed, ref} from "vue";
import type {Item} from "../scripts/types";
import type {PropType} from 'vue'
import {useSpotifyStore} from "../scripts/store/spotify";

const base = useBaseStore()
const spotify = useSpotifyStore()

const props = defineProps({
    item: {
        type: Object as PropType<Item>,
        required: true,
    },
})
const isLiked = computed(() => spotify.checkLiked(props.item.type, props.item.id))
let likedLoading = ref(false)

async function toggleLike() {
    likedLoading.value = true
    await spotify.toggleLike(props.item)
    likedLoading.value = false
}
</script>

<style scoped lang="scss">
</style>