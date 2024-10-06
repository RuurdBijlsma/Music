import { IDBPDatabase, IDBPObjectStore, openDB, StoreNames } from 'idb'
import { ref } from 'vue'

export function createStore(
    db: IDBPDatabase,
    transaction: any,
    storeName: string,
    storeOptions: { keyPath?: string } = {},
    indices: { name: string; keyPath: string; unique: boolean }[] = []
) {
    let store: IDBPObjectStore<unknown, ArrayLike<StoreNames<unknown>>, string, 'versionchange'>
    if (!db.objectStoreNames.contains(storeName)) {
        store = db.createObjectStore(storeName, storeOptions)
    } else {
        store = transaction.objectStore(storeName)
    }
    for (const index of indices) {
        if (!store.indexNames.contains(index.name)) {
            store.createIndex(index.name, index.keyPath, {
                unique: index.unique
            })
        }
    }
    return store
}

export const baseDb = openDB('base', 11, {
    upgrade(db, _, __, transaction) {
        createStore(db, transaction, 'spotify')
        createStore(db, transaction, 'cache')

        createStore(db, transaction, 'artistStats', { keyPath: 'id' }, [
            { name: 'listenMinutes', keyPath: 'listenMinutes', unique: false },
            { name: 'skips', keyPath: 'skips', unique: false }
        ])
        createStore(db, transaction, 'trackStats', { keyPath: 'id' }, [
            { name: 'listenMinutes', keyPath: 'listenMinutes', unique: false },
            { name: 'listenCount', keyPath: 'listenCount', unique: false },
            { name: 'skips', keyPath: 'skips', unique: false }
        ])
        createStore(db, transaction, 'collectionStats', { keyPath: 'id' }, [
            { name: 'listenMinutes', keyPath: 'listenMinutes', unique: false },
            { name: 'skips', keyPath: 'skips', unique: false }
        ])

        createStore(db, transaction, 'statistics')
        createStore(db, transaction, 'trackMetadata', { keyPath: 'id' })

        createStore(db, transaction, 'tracks', { keyPath: 'id' }, [
            {
                name: 'searchString',
                keyPath: 'searchString',
                unique: false
            },
            {
                name: 'title',
                keyPath: 'title',
                unique: false
            },
            {
                name: 'artist',
                keyPath: 'artistString',
                unique: false
            },
            {
                name: 'duration',
                keyPath: 'track.duration_ms',
                unique: false
            },
            {
                name: 'oldToNew',
                keyPath: 'added_at',
                unique: false
            },
            {
                name: 'newToOld',
                keyPath: 'added_at_reverse',
                unique: false
            }
        ])
    }
})

export const dbLoaded = ref(false)
baseDb.then(() => {
    dbLoaded.value = true
})
