<template>
    <v-btn
        :color="color"
        :icon="iconButton"
        :loading="likedLoading"
        rounded
        variant="text"
        @click="toggleLike()"
    >
        <v-icon>{{ fill ? "mdi-heart" : "mdi-heart-outline" }}</v-icon>
    </v-btn>
</template>

<script lang="ts" setup>
import { useBaseStore } from "../store/base";
import type { PropType } from "vue";
import { computed, ref } from "vue";
import type { Item } from "../scripts/types";
import { useLibraryStore } from "../store/library";

const base = useBaseStore();
const library = useLibraryStore();

const props = defineProps({
    item: {
        type: Object as PropType<Item>,
        required: true,
    },
    variant: {
        type: String as PropType<"color" | "fill" | "no-theme">,
        default: "color",
    },
    iconButton: {
        type: Boolean,
        default: false,
    },
});

const isLiked = computed(() =>
    library.checkLiked(props.item.type, props.item.id),
);
const color = computed(() =>
    props.variant !== "no-theme" && (props.variant === "fill" || isLiked.value)
        ? base.themeColor
        : "default",
);
const fill = computed(
    () =>
        isLiked.value &&
        (props.variant !== "color" || base.themeTooSimilarToFg),
);

let likedLoading = ref(false);

async function toggleLike() {
    likedLoading.value = true;
    await library.toggleLike(props.item);
    likedLoading.value = false;
}
</script>

<style lang="less" scoped></style>
