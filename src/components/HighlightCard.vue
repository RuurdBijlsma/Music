<template>
    <div class="highlight-featured mr-2">
        <div class="card-info">
            <h2>{{ props.title }}</h2>
            <p class="card-description mt-3">
                {{ props.description }}
            </p>
            <v-spacer/>
            <div class="buttons mt-3">
                <v-btn size="40" class="mr-3" icon="mdi-play" variant="tonal"/>
                <v-btn size="40" icon="mdi-shuffle" variant="tonal"/>
            </div>
        </div>
        <v-spacer></v-spacer>
        <div class="card-image" :style="{backgroundImage: `url(${props.img})`}"/>
    </div>
</template>

<script setup>
const props = defineProps({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false,
        default: () => "",
    },
    img: {
        type: String,
        required: true
    },
})

</script>

<style scoped>
.highlight-featured {
    min-height: 202px;
    /*min-width: 485px;*/
    max-width: 800px;
    height: calc((100vw - 500px) / 4);
    display: flex;
    flex-direction: row;

    background-color: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(100px) saturate(300%) brightness(105%);
    border-radius: 10px;
    box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.2);
}

.card-image {
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
    background-size: cover;
    aspect-ratio: 1;
    height: calc((100vw - 500px) / 4);
    min-height: 202px;
}

.card-info {
    min-width:200px;
    padding: 20px;
    display: flex;
    flex-direction: column;
}

.card-info > h2 {
    white-space: nowrap;
    height: 40px;
    text-overflow: ellipsis;
}

.card-description {
    overflow-y: auto;
    width: 100%;
    word-wrap: anywhere;
    opacity: 0.7;
}
</style>