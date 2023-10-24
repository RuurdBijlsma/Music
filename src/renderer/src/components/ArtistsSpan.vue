<template>
    <span v-for="(artist, i) in artists" class="mr-2">
        <router-link :to="base.itemUrl(artist)" no-style>{{
            artist.name
        }}</router-link
        >{{ i === artists.length - 1 ? "" : ", " }}
    </span>
</template>

<script lang="ts" setup>
import { useBaseStore } from "../store/base";
import type { PropType } from "vue";

const base = useBaseStore();
defineProps({
    artists: {
        type: Array as PropType<any[]>,
        required: true,
    },
});
</script>
