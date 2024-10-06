import { defineStore } from 'pinia'
import { ref } from 'vue'
import log from 'electron-log/renderer'

export const useUpdateStore = defineStore('update', () => {
    const updateState = ref({
        checkingForUpdate: false,
        latest: true,
        downloaded: false,
        error: '',
        progress: {
            percent: 0,
            total: 1,
            transferred: 0
        },
        updateVersion: '',
        releaseNotes: ''
    })

    window.events.on('log', (...args: any[]) => {
        if (args[0] !== '[auto updater]' || args.length !== 3) return
        const [, type, data] = args
        log.info({ type, data })
        switch (type) {
            case 'error':
                updateState.value.error = data.message
                break
            case 'checking-for-update':
                updateState.value.checkingForUpdate = true
                break
            case 'update-available':
                updateState.value.checkingForUpdate = false
                updateState.value.latest = false
                updateState.value.updateVersion = data.version
                updateState.value.releaseNotes = data.releaseNotes
                break
            case 'update-not-available':
                updateState.value.checkingForUpdate = false
                updateState.value.latest = true
                break
            case 'download-progress':
                updateState.value.progress.percent = data.percent
                updateState.value.progress.total = data.total
                updateState.value.progress.transferred = data.transferred
                break
            case 'update-downloaded':
                updateState.value.downloaded = true
                break
        }
    })

    return { updateState }
})
