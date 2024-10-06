<template>
    <v-card :color="ui.themeColor" class="notification">
        <div v-if="notification.icon" class="notification-icon">
            <v-icon :icon="notification.icon"></v-icon>
        </div>
        <div class="notification-text">
            <h3>{{ notification.title }}</h3>
            <p>{{ notification.description }}</p>
        </div>
        <div class="notification-buttons">
            <v-btn variant="plain" @click="notification.show = false">Dismiss </v-btn>
            <v-btn variant="tonal" @click="doAction()">
                {{ notification.viewText }}
            </v-btn>
        </div>
    </v-card>
</template>

<script lang="ts" setup>
import { useUIStore } from '../../store/UI/UIStore'
import { PropType } from 'vue'
import { Notification } from '../../scripts/types'

const props = defineProps({
    notification: {
        type: Object as PropType<Notification>,
        required: true
    }
})

const ui = useUIStore()

function doAction() {
    props.notification.action()
    props.notification.show = false
}
</script>

<style lang="less" scoped>
.notification {
    height: 80px;
    display: flex;
    align-items: center;
    padding: 10px;
    border-radius: 8px;
    box-shadow: 0 4px 2px 0 rgba(0, 0, 0, 0.2);
}

.notification-icon {
    width: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.notification-text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex-grow: 1;
}

.notification-text > h3 {
    font-weight: 500;
}

.notification-text > p {
    opacity: 0.8;
    font-weight: 300;
    font-size: 15px;
}

.notification-buttons {
    padding-right: 10px;
    display: flex;
    gap: 10px;
}
</style>
