<template>
    <div class="glow-image" :style="{
        width: width + 'px',
        borderRadius: rounding,
    }">
        <div class="album-art album-background"
             :style="{
                    backgroundImage: `url(${src})`,
                    opacity: theme.current.value.dark ? 0.4 : 0.7 / effectScale,
                    minWidth: width + 'px',
                    height: height + 'px',
                    right: (-width / 2) + 'px',
                    borderRadius: rounding,
                    top: (height / 16) + 'px',
                    filter: `blur(${(width * effectScale) / 16}px) saturate(150%) brightness(${effectScale})`,
                    transform: `scale(${effectScale})`,
                 }"></div>
        <div class="album-art album-normal" :style="{
            backgroundImage: `url(${src})`,
            minWidth: width + 'px',
            height: height + 'px',
            left: (-width / 2) + 'px',
            borderRadius: rounding,
        }"></div>
    </div>
</template>

<script setup lang="ts">
import { useTheme } from "vuetify";

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
        default: "0"
    },
    effectScale: {
        type: Number,
        default: () => 1,
        required: false
    }
});
const theme = useTheme();
</script>

<style scoped lang="less">
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
    transition: .1s;
    box-shadow: 0 10px 30px 0 rgba(0, 0, 0, .2);
}
</style>
