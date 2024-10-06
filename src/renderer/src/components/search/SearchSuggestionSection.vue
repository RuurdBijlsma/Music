<template>
    <track-list-expander
        :collection="collection"
        :loading="loading"
        :tracks="collection.tracks"
        show-header
    >
        <slot></slot>
    </track-list-expander>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue'
import { computed } from 'vue'
import type { ItemCollection } from '../../scripts/types'
import { useSearchStore } from '../../store/search'
import TrackListExpander from '../track-list/TrackListExpander.vue'

const props = defineProps({
    tracks: {
        type: Object as PropType<SpotifyApi.TrackObjectFull[]>,
        required: true
    },
    loading: {
        type: Boolean,
        required: false,
        default: () => false
    },
    id: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    }
})

const search = useSearchStore()
const query = search.searchValue

const collection = computed(
    () =>
        ({
            tracks: props.tracks,
            type: 'search',
            id: 'search' + props.id,
            name: `${props.type} search "${query}"`,
            buttonText: 'Search',
            to: `/search/${query}`
        }) as ItemCollection
)
</script>

<style lang="less" scoped></style>
