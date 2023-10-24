<template>
    <v-menu
        :model-value="contextMenu.show"
        :style="{
            transform: `translate(${contextMenu.x}px, ${contextMenu.y}px)`,
        }"
        @update:modelValue="contextMenu.show = $event"
    >
        <item-menu
            :key="contextMenu.x"
            :item="contextMenu.item"
            :show-descriptor="contextMenu.item.type === 'track'"
        />
    </v-menu>
</template>

<script lang="ts" setup>
import { useBaseStore } from "../store/base";
import { storeToRefs } from "pinia";
import ItemMenu from "./ItemMenu.vue";
import { onMounted, onUnmounted } from "vue";

const base = useBaseStore();
const { contextMenu } = storeToRefs(base);

const onBlur = () => (contextMenu.value.show = false);
onMounted(() => {
    window.addEventListener("blur", onBlur, false);
});
onUnmounted(() => {
    window.removeEventListener("blur", onBlur);
});
</script>

<style lang="less" scoped></style>
