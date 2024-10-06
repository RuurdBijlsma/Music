<template>
    <div
        :style="{
            width: width + 'px',
            borderRadius: rounding
        }"
        class="glow-image"
    >
        <div
            :style="{
                backgroundImage: `url(${src})`,
                opacity: theme.current.value.dark ? 0.4 : 0.7 / effectScale,
                minWidth: width + 'px',
                height: height + 'px',
                right: -width / 2 + 'px',
                borderRadius: rounding,
                top: height / 16 + 'px',
                filter: `blur(${
                    (width * effectScale) / 16
                }px) saturate(150%) brightness(${effectScale})`,
                transform: `scale(${effectScale})`
            }"
            class="album-art album-background"
        ></div>
        <div
            :style="{
                backgroundImage: `url(${src})`,
                minWidth: width + 'px',
                height: height + 'px',
                left: -width / 2 + 'px',
                borderRadius: rounding
            }"
            class="album-art album-normal"
        ></div>
    </div>
</template>

<script lang="ts" setup>
import { useTheme } from 'vuetify'

defineProps({
    src: {
        type: String,
        default: undefined
    },
    width: {
        type: Number,
        default: 300
    },
    height: {
        type: Number,
        default: 300
    },
    rounding: {
        type: String,
        default: '0'
    },
    effectScale: {
        type: Number,
        default: () => 1,
        required: false
    }
})
const theme = useTheme()
</script>

<style lang="less" scoped>
.glow-image {
    display: inline-flex;
    justify-content: center;
}

.album-art {
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    position: relative;
    z-index: 3;
    transition: 0.1s;
    box-shadow: 0 10px 30px 0 rgba(0, 0, 0, 0.2);
}
</style>
