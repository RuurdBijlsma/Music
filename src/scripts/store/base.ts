import {defineStore} from 'pinia'
import {openDB} from "idb";

export const baseDb = await openDB("base", 1, {
    upgrade(db, oldVersion, newVersion, transaction, event) {
        db.createObjectStore('spotify');
        console.log('db upgrade', {oldVersion, newVersion, transaction, event});
    },
    blocked(currentVersion, blockedVersion, event) {
        console.log('db blocked', {currentVersion, blockedVersion, event});
    },
    blocking(currentVersion, blockedVersion, event) {
        console.log('db blocking', {currentVersion, blockedVersion, event});
    },
    terminated() {
        console.log('db terminated');
    },
});

export const useBaseStore = defineStore('base', () => {

    return {}
})