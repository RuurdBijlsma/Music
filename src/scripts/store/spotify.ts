import {defineStore} from 'pinia'
import {ref, watch} from "vue";
import {baseDb} from './base'

export const useSpotifyStore = defineStore('spotify', () => {
    const secret = ref('Eduardo')
    const clientId = ref('Eduardo')

    async function loadValues() {
        let dbSecret = await baseDb.get('keyval', 'secret');
        let dbClientId = await baseDb.get('keyval', 'clientId');
        if (dbSecret)
            secret.value = dbSecret;
        if (dbClientId)
            clientId.value = dbClientId;
    }

    watch(secret, async () => {
        let dbSecret = await baseDb.get('keyval', 'secret');
        if (dbSecret) {
            if (dbSecret !== secret.value)
                await baseDb.put('keyval', secret.value, 'secret')
        } else
            await baseDb.add('keyval', secret.value, 'secret')
    })
    watch(clientId, async () => {
        let dbClientId = await baseDb.get('keyval', 'clientId');
        if (dbClientId) {
            if (dbClientId !== clientId.value)
                await baseDb.put('keyval', clientId.value, 'clientId')
        } else
            await baseDb.add('keyval', clientId.value, 'clientId')
    })

    loadValues().then(() => console.log("Loaded idb values into store"));

    return {secret, clientId}
})