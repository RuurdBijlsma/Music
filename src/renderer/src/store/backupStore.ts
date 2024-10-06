import { defineStore } from 'pinia'
import { DataExport } from '../scripts/types'
import { baseDb } from '../scripts/database'
import { useBaseStore } from './base'
import { useDialogStore } from './UI/dialogStore'
import { useRuurdAuthStore } from './ruurd-auth'
import { useSpotifyAuthStore } from './spotify-auth'
import { persistentRef } from '../scripts/utils'
import { watch } from 'vue'
import log from 'electron-log/renderer'

export const useBackupStore = defineStore('backup', () => {
    const base = useBaseStore()
    const dialog = useDialogStore()
    const ruurdAuth = useRuurdAuthStore()
    const spotifyAuth = useSpotifyAuthStore()

    const autoBackup = persistentRef('autobackup', false)
    watch(autoBackup, () => {
        if (autoBackup.value) checkAutoBackup().then()
    })
    setInterval(() => checkAutoBackup(), 1000 * 60 * 60)
    checkAutoBackup().then()

    async function checkAutoBackup() {
        if (!autoBackup.value || base.isDev) return
        let lastBackup = 0
        if (!isNaN(+localStorage.lastAutoBackup)) lastBackup = +localStorage.lastAutoBackup

        const now = Date.now()
        const difference = now - lastBackup
        if (difference < 1000 * 60 * 60 * 24) return

        await exportToServer()
        localStorage.lastAutoBackup = now
    }

    async function exportToFile() {
        const dataPromise = getDataExport()
        dataPromise.then()

        const now = new Date()
        const filename = `RuurdMusicExport-${now.toISOString().substring(0, 10)}.json`
        const result = await window.api.getSaveFilePath(filename, 'Export')
        if (result.canceled) return false

        const outputPath = result.filePath
        const data = await dataPromise
        const fileString = JSON.stringify(data)
        await window.api.saveStringToFile(outputPath, fileString)
        return true
    }

    async function importFromFile() {
        const result = await window.api.getOpenFilePath('Import')
        if (result.canceled) return false

        try {
            const fileContents = await window.api.getFileContents(result.filePaths[0])
            if (fileContents === null) {
                log.warn('File contents empty', result.filePath)
                return false
            }
            const data = JSON.parse(fileContents)
            await importData(data as DataExport)
            return true
        } catch (e: any) {
            log.error(e)
            return false
        }
    }

    async function exportToServer() {
        if (!ruurdAuth.isLoggedIn) {
            dialog.addSnack(
                'You must be logged in to a Ruurd Account before being able to export to server.'
            )
            return false
        }

        const data = await getDataExport()
        const blob = new Blob([JSON.stringify(data)], {
            type: 'application/json'
        })
        const formData = new FormData()
        formData.append('files', blob, 'ruurd-music-data.json')
        formData.append('email', ruurdAuth.credentials.email ?? '')
        formData.append('password', ruurdAuth.credentials.password ?? '')

        const fetchOptions = {
            method: 'POST',
            body: formData
        }

        const response = await fetch('https://api.ruurd.dev/drive/upload', fetchOptions)
        if (response.ok) {
            return true
        }
        dialog.addSnack(response.statusText)
        return false
    }

    async function getDataExport(): Promise<DataExport> {
        const db = await baseDb
        const getObjectStore = async (storeName: string): Promise<{ [key: string]: any }> => {
            const keys = (await db.getAllKeys(storeName)) as string[]
            const values = await db.getAll(storeName)
            const result = {}
            for (let i = 0; i < keys.length; i++) {
                result[keys[i]] = values[i]
            }
            return result
        }

        const cleanLocalStorage = { ...localStorage }
        delete cleanLocalStorage.lastRoute

        return {
            localStorage: cleanLocalStorage,
            idb: {
                artistStats: await db.getAll('artistStats'),
                collectionStats: await db.getAll('collectionStats'),
                trackStats: await db.getAll('trackStats'),
                //@ts-ignore
                spotify: await getObjectStore('spotify'),
                //@ts-ignore
                statistics: await getObjectStore('statistics'),
                trackMetadata: await db.getAll('trackMetadata'),
                tracks: await db.getAll('tracks')
            }
        }
    }

    async function importData(data: DataExport) {
        for (const key in data.localStorage) {
            if (!data.localStorage.hasOwnProperty(key)) continue
            localStorage.setItem(key, data.localStorage[key])
        }

        const putStoreObject = (storeName: string, object: { [key: string]: any }) => {
            if (!object)
                return log.warn('[import error]', storeName, 'value is not defined', object)
            const tx = db.transaction(storeName, 'readwrite')
            const store = tx.objectStore(storeName)

            for (const key in object) {
                if (!object.hasOwnProperty(key)) continue
                store.put(object[key], key)
            }

            return tx.done
        }
        const idb = data.idb
        const db = await baseDb
        await putStoreObject('spotify', idb.spotify)
        await putStoreObject('statistics', idb.statistics)
        const putStoreArray = (storeName: string, array: any[]) => {
            if (!array) return log.warn('[import error]', storeName, 'value is not defined', array)
            const tx = db.transaction([storeName], 'readwrite')
            const store = tx.objectStore(storeName)

            store.clear()
            for (const obj of array) {
                store.add(obj)
            }

            return new Promise((resolve) => (tx.oncomplete = resolve))
        }
        await putStoreArray('artistStats', idb.artistStats)
        await putStoreArray('collectionStats', idb.collectionStats)
        await putStoreArray('trackStats', idb.trackStats)
        await putStoreArray('tracks', idb.tracks)
        await putStoreArray('trackMetadata', idb.trackMetadata)

        if (!spotifyAuth.isLoggedIn) {
            localStorage.lastRoute = '/'
            location.reload()
        }
    }

    async function importFromServer() {
        if (!ruurdAuth.isLoggedIn) {
            dialog.addSnack(
                'You must be logged in to a Ruurd Account before being able to import from server.'
            )
            return false
        }
        const data = await (
            await fetch('https://api.ruurd.dev/drive/get/' + encodeURI('ruurd-music-data.json'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ auth: ruurdAuth.credentials })
            })
        ).json()
        await importData(data as DataExport)
        return true
    }

    return {
        exportToFile,
        exportToServer,
        importFromFile,
        importFromServer,
        autoBackup
    }
})
