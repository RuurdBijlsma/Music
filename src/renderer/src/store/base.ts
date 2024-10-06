import { defineStore } from 'pinia'
import { EventEmitter } from 'events'
import { persistentRef } from '../scripts/utils'

export const useBaseStore = defineStore('base', () => {
    const events = new EventEmitter()
    const isDev = !location.href.startsWith('file://')
    const offlineMode = persistentRef('offlineMode', false)

    const waitFor = (name: string) => new Promise((resolve) => events.once(name, resolve))

    return {
        events,
        waitFor,
        isDev,
        offlineMode
    }
})
