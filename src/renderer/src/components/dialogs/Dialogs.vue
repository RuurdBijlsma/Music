<template>
    <div class="notifications">
        <template v-for="notification in dialog.notifications">
            <notification v-if="notification.show" :notification="notification" />
        </template>
    </div>

    <source-dialog />
    <edit-info-dialog />
    <item-context-menu />
    <create-playlist-dialog />
    <v-snackbar v-for="snack in dialog.snackbars" v-model="snack.open" :timeout="snack.timeout">
        {{ snack.text }}
        <template #actions>
            <v-btn variant="text" @click="snack.open = false"> Dismiss</v-btn>
        </template>
    </v-snackbar>
</template>

<script lang="ts" setup>
import SourceDialog from './SourceDialog.vue'
import ItemContextMenu from './ItemContextMenu.vue'
import EditInfoDialog from './EditInfoDialog.vue'
import CreatePlaylistDialog from './CreatePlaylistDialog.vue'
import { useDialogStore } from '../../store/UI/dialogStore'
import Notification from './Notification.vue'

const dialog = useDialogStore()
</script>

<style lang="less" scoped>
.notifications {
    position: fixed;
    right: 10px;
    bottom: 10px;
    width: calc(100% - 90px);
    display: flex;
    flex-direction: column;
    gap: 10px;
}
</style>
