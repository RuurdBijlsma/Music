<template>
    <div>
        home world
        <p>Count: {{ store.count }}</p>
        <p>Double count: {{ store.doubleCount }}</p>
    </div>
    <v-btn @click="store.increment()">click me</v-btn>
</template>

<script setup>
import {useCounterStore} from "../scripts/store/counter";

const store = useCounterStore();
</script>

<style scoped>

</style>