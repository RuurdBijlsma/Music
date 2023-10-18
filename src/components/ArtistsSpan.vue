<template>
<span class="mr-2" v-for="(artist, i) in artists">
    <router-link no-style
                 :to="base.itemUrl(artist)">{{ artist.name }}</router-link>{{ i === artists.length - 1 ? "" : ", " }}
</span>
</template>

<script setup lang="ts">
import { useBaseStore } from "../scripts/store/base";
import type { PropType } from "vue";

const base = useBaseStore();
defineProps({
    artists: {
        type: Array as PropType<any[]>,
        required: true
    }
});
</script>