<template>
    <div class="album" v-if="album">
    </div>
</template>

<script setup lang="ts">
import {ref} from "vue";

const album = ref(null);
</script>

<style scoped>
</style>