<template>
    <v-menu
        :model-value="contextMenu.show"
        :style="{
            transform: `translate(${contextMenu.x}px, ${contextMenu.y}px)`
        }"
        @update:model-value="contextMenu.show = $event"
    >
        <item-menu
            :key="contextMenu.x"
            :item="contextMenu.item"
            :show-descriptor="contextMenu.item.type === 'track'"
        />
    </v-menu>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import ItemMenu from '../item/ItemMenu.vue'
import { onMounted, onUnmounted } from 'vue'
import { useDialogStore } from '../../store/UI/dialogStore'

const dialog = useDialogStore()
const { contextMenu } = storeToRefs(dialog)

const onBlur = () => (contextMenu.value.show = false)
onMounted(() => {
    window.addEventListener('blur', onBlur, false)
})
onUnmounted(() => {
    window.removeEventListener('blur', onBlur)
})
</script>

<style lang="less" scoped></style>
