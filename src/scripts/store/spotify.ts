import {defineStore} from 'pinia'
import {ref, watch} from "vue";
import {baseDb} from './base'

export const useSpotifyStore = defineStore('spotify', () => {
    const secret = ref('Eduardo')
    const clientId = ref('Eduardo')

    watch(secret, async () => {
        console.log('the secret changed!')
        let existingValue = await baseDb.get('keyval', 'secret');
        if (existingValue) {
            await baseDb.put('keyval', secret.value, 'secret')
            console.log('the keyval changed!')
        } else {
            await baseDb.add('keyval', secret.value, 'secret')
            console.log('the keyval added!')
        }
    })

    return {secret, clientId}
})