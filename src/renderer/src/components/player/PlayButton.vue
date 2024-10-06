<template>
    <v-btn :color="color" :size="size" :variant="variant" density="compact" icon @click="onClick">
        <v-progress-circular
            v-if="loading"
            :indeterminate="isNaN(loadProgress)"
            :model-value="loadProgress"
            :size="Math.round(size * 0.7)"
        />
        <v-icon v-else-if="playing" :size="iconSize">mdi-pause</v-icon>
        <v-icon v-else :size="iconSize">mdi-play</v-icon>
    </v-btn>
</template>

<script lang="ts" setup>
import { PropType } from 'vue'

defineProps({
    playing: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    loadProgress: { type: Number, default: 0 },
    density: {
        type: String as PropType<'compact' | 'default' | 'comfortable'>,
        default: 'default'
    },
    variant: {
        type: String as PropType<'flat' | 'text' | 'tonal' | 'elevated' | 'outlined' | 'plain'>,
        default: 'tonal'
    },
    size: {
        type: Number,
        default: 30
    },
    iconSize: {
        type: Number,
        default: 24
    },
    color: {
        type: String,
        default: 'default'
    }
})
const emit = defineEmits(['click'])

function onClick() {
    emit('click')
}
</script>

<style lang="less" scoped></style>
