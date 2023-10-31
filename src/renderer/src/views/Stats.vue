<template>
    <div class="stats">
        <h1>Listen stats</h1>
        <v-divider class="mt-5" />
        <line-chart
            :data="data"
            data-label="Minutes listened"
            :labels="labels"
        />
    </div>
</template>

<script lang="ts" setup>
import LineChart from "../components/LineChart.vue";
import { baseDb } from "../store/base";
import { ref } from "vue";

const labels = ref([] as string[]);
const data = ref([] as number[]);

async function init() {
    let db = await baseDb;
    let result = await db.get("statistics", "historyMinutes");
    if (!result) return;
    labels.value = Object.keys(result);
    data.value = Object.values(result);
}

init();
</script>

<style lang="less" scoped>
.stats {
    padding-top: 70px;
    padding-right: 10px;
    padding-left: 10px;
}
</style>
