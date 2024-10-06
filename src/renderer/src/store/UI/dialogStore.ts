import { defineStore } from 'pinia'
import { LikedTrack, Notification, TrackData, YouTubeSearchResult } from '../../scripts/types'
import router from '../../scripts/router'
import { Ref, ref } from 'vue'

export const useDialogStore = defineStore('dialog', () => {
    const playlist = ref({
        show: false,
        title: '',
        description: '',
        isPublic: true,
        isCollaborative: false,
        startTrack: null as SpotifyApi.TrackObjectFull | null
    })

    const edit = ref({
        show: false,
        loading: false,
        trackData: null as null | TrackData,
        likedTrack: null as null | LikedTrack,
        title: '',
        artists: [''],
        durationRange: [0, 1]
    })

    const source = ref({
        show: false,
        items: [] as YouTubeSearchResult[],
        loading: false,
        spotifyTrack: null as SpotifyApi.TrackObjectFull | null,
        trackData: null as TrackData | null
    })

    const snackbars = ref([] as { open: boolean; text: string; timeout: number }[])

    function addSnack(text: string, timeout = 4000) {
        const snack = {
            text,
            timeout,
            open: true
        }
        snackbars.value.push(snack)
        setTimeout(() => {
            snack.open = false
            snackbars.value.splice(snackbars.value.indexOf(snack), 1)
        }, timeout + 500)
    }

    const contextMenu = ref({
        x: 0,
        y: 0,
        show: false,
        item: null as any
    })

    const setContextMenuItem = (e: MouseEvent, item: any) => {
        contextMenu.value.item = item
        contextMenu.value.show = true
        contextMenu.value.x = e.pageX
        contextMenu.value.y = e.pageY
    }

    const notifications: Ref<Notification[]> = ref([])

    function checkWrapNotification() {
        const now = new Date()
        const lsKey = 'wrapped' + now.getFullYear()
        if (now.getMonth() !== 11) localStorage.removeItem(lsKey)
        if (now.getMonth() === 11 && localStorage.getItem(lsKey) === null) {
            addNotification({
                title: 'Your Music Wrapped is ready!',
                description:
                    'View statistics about your listening behaviour, see your top artists, tracks, and more.',
                icon: 'mdi-music-box-multiple',
                dismissText: 'Later',
                viewText: 'View now',
                action: () => router.push('/wrapped')
            })
        }
    }

    checkWrapNotification()

    function addNotification(options: Notification) {
        options.show = true
        notifications.value.push(options)
    }

    return {
        contextMenu,
        setContextMenuItem,
        addSnack,
        playlist,
        source,
        edit,
        notifications,
        snackbars
    }
})
