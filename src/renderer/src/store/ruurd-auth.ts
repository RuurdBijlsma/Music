import { defineStore } from 'pinia'
import { computed } from 'vue'
import { persistentRef } from '../scripts/utils'

export const useRuurdAuthStore = defineStore('ruurd-auth', () => {
    const credentials = persistentRef(
        'ruurdCredentials',
        {
            email: null as null | string,
            password: null as null | string,
            name: null as null | string
        },
        true
    )

    function logout() {
        credentials.value.email = null
        credentials.value.name = null
        credentials.value.password = null
    }

    const isLoggedIn = computed(
        () =>
            credentials.value.email !== null &&
            credentials.value.password !== null &&
            credentials.value.name !== null
    )

    return {
        credentials,
        isLoggedIn,
        logout
    }
})
