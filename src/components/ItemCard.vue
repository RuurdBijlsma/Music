<template>
    <div>
        <div class="image" :style="{backgroundImage: `url(${props.img})`}"/>
        <div class="info mt-2">
            <p class="title" v-if="props.title">{{ props.title }}</p>
            <p class="description" v-html="props.description"></p>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    title: {
        type: String,
        required: false,
        default: () => "",
    },
    description: {
        type: String,
        required: true
    },
    img: {
        type: String,
        required: true
    },
})
</script>

<style scoped>
.image {
    border-radius: 10px;
    box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.2);
    height: calc((100vw - 500px) / 4 - 39px);
    aspect-ratio: 1;
    background-size: cover;
    min-height: 163px;
}

.info {
    width: calc((100vw - 500px) / 4 - 39px);
    font-size: 13px;
    min-width: 163px;
    overflow: hidden;
}

.title {
    font-size: 13px;
    opacity: .9;
    margin-bottom: 0 !important;
    font-weight: 500;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.description {
    opacity: .7;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2; /* number of lines to show */
    line-clamp: 2;
    -webkit-box-orient: vertical;
}
</style>