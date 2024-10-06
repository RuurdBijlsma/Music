<template>
    <span v-for="(artist, i) in artists" class="mr-2">
        <router-link :to="itemUrl(artist)" no-style>{{ artist.name }}</router-link
        >{{ i === artists.length - 1 ? '' : ', ' }}
    </span>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue'
import { itemUrl } from '../scripts/item-utils'

defineProps({
    artists: {
        type: Array as PropType<any[]>,
        required: true
    }
})
</script>
