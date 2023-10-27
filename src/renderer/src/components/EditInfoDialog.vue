<template>
    <v-dialog
        :class="{ dark: base.isDark }"
        v-model="library.editDialog.show"
        :scrollable="true"
        width="auto"
    >
        <div class="translucent">
            <v-card-title>Hello</v-card-title>
            <v-card-subtitle>World</v-card-subtitle>
            <v-card-item>
                <v-avatar>R</v-avatar>
            </v-card-item>
            <v-card-text
                >lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum
                lorem ipsum lorem ipsum
            </v-card-text>
            <v-card-actions>
                <v-btn :color="base.themeColor" variant="tonal">
                    Click here
                </v-btn>
            </v-card-actions>
        </div>
    </v-dialog>
</template>

<script lang="ts" setup>
import { useBaseStore } from "../store/base";
import { useLibraryStore } from "../store/library";

const base = useBaseStore();
const library = useLibraryStore();
</script>
<style lang="less" scoped>
.translucent {
    backdrop-filter: blur(40px) saturate(150%) brightness(130%);
    background-color: rgba(var(--v-theme-background), 0.5);
    border-radius: 8px;
    box-shadow: 0 4px 2px 0 rgba(0, 0, 0, 0.2);
}

.dark .translucent {
    backdrop-filter: blur(40px) saturate(150%) brightness(70%) !important;
    background-color: rgba(var(--v-theme-background), 0.7) !important;
}
</style>
