<template>
    <div class="albums pt-4">
        <item-card v-for="album in library.saved.album" :item="album" class="mb-4" />
    </div>
</template>

<script lang="ts" setup>
import { useLibraryStore } from '../../store/library'
import ItemCard from '../../components/item/ItemCard.vue'

const library = useLibraryStore()
</script>

<style lang="less" scoped>
.albums {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: space-evenly;
}
</style>
