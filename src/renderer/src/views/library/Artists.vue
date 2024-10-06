<template>
    <div class="artists pt-4">
        <item-card v-for="artist in library.saved.artist" :item="artist" class="mb-4" />
    </div>
</template>

<script lang="ts" setup>
import { useLibraryStore } from '../../store/library'
import ItemCard from '../../components/item/ItemCard.vue'

const library = useLibraryStore()
</script>

<style lang="less" scoped>
.artists {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: space-evenly;
}
</style>
