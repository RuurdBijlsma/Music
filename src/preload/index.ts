import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
    ytInfoById: (id: string) => ipcRenderer.invoke('ytInfoById', id),
    searchYtdlp: (query: string, limit: number) => ipcRenderer.invoke('searchYtdlp', query, limit),
    getDominantColor: (imgUrl: string) => ipcRenderer.invoke('getDominantColor', imgUrl),
    setPlatformPlaying: (value: boolean, darkTheme: boolean) =>
        ipcRenderer.invoke('setPlatformPlaying', value, darkTheme),
    stopPlatformPlaying: () => ipcRenderer.invoke('stopPlatformPlaying'),
    getOutputDirectory: () => ipcRenderer.invoke('getOutputDirectory'),
    getSaveFilePath: (filename?: string, buttonLabel = 'Save', filterJson = true) =>
        ipcRenderer.invoke('getSaveFilePath', filename, buttonLabel, filterJson),
    getOpenFilePath: (buttonLabel = 'Save', filterJson = true) =>
        ipcRenderer.invoke('getOpenFilePath', buttonLabel, filterJson),
    downloadAsJpg: (imgUrl: string) => ipcRenderer.invoke('downloadAsJpg', imgUrl),
    getVolumeStats: (trackFile: string) => ipcRenderer.invoke('getVolumeStats', trackFile),
    getDirectories: () => ipcRenderer.invoke('getDirectories'),
    setTheme: (theme: 'dark' | 'light') => ipcRenderer.invoke('setTheme', theme),
    downloadYt: (id: string, outPath: string, tags: any, imageFile: string) =>
        ipcRenderer.invoke('downloadYt', id, outPath, tags, imageFile),
    updateYtdlp: () => ipcRenderer.invoke('updateYtdlp'),

    fileSize: (file: string) => ipcRenderer.invoke('fileSize', file),
    checkFileExists: (file: string) => ipcRenderer.invoke('checkFileExists', file),
    deleteFile: (file: string) => ipcRenderer.invoke('deleteFile', file),
    copyIfExists: (fromPath: string, toDirectory: string) =>
        ipcRenderer.invoke('copyIfExists', fromPath, toDirectory),
    copyFile: (from: string, to: string) => ipcRenderer.invoke('copyFile', from, to),
    checkTracksDownloaded: (files: string[]) => ipcRenderer.invoke('checkTracksDownloaded', files),
    saveStringToFile: (file: string, contents: string) =>
        ipcRenderer.invoke('saveStringToFile', file, contents),
    getFileContents: (file: string) => ipcRenderer.invoke('getFileContents', file),
    setMusicFolder: (folder: string) => ipcRenderer.invoke('setMusicFolder', folder),

    firstLogin: (spotifyAuth: {
        hasCredentials: boolean
        clientId: string
        requestedScopes: string
        secret: string
    }) => ipcRenderer.invoke('firstLogin', spotifyAuth),
    resetSpotifyLogin: () => ipcRenderer.invoke('resetSpotifyLogin'),
    getAppVersion: () => ipcRenderer.invoke('getAppVersion'),
    downloadFile: (url: string, file: string) => ipcRenderer.invoke('downloadFile', url, file),

    minimizeWindow: () => ipcRenderer.send('win:invoke', 'min'),
    toggleMaximize: () => ipcRenderer.send('win:invoke', 'max'),
    closeWindow: () => ipcRenderer.send('win:invoke', 'close')
}

const listeners = new Map<string, Array<Function>>()

const events = {
    on(channel: string, func: Function) {
        if (!listeners.has(channel)) listeners.set(channel, [])
        const functions = listeners.get(channel)
        if (functions === undefined || functions.includes(func)) return
        functions.push(func)
    },
    off(channel: string, func: Function) {
        if (!listeners.has(channel)) return
        const functions = listeners.get(channel)
        if (functions === undefined) return
        const index = functions.indexOf(func)
        if (index === -1) return
        functions.splice(index, 1)
    },
    emit(channel, ...args) {
        if (!listeners.has(channel)) return
        const functions = listeners.get(channel)
        if (functions === undefined) return
        functions.forEach((f) => f(...args))
    }
}
ipcRenderer.on('toggleFavorite', () => events.emit('toggleFavorite'))
ipcRenderer.on('ffmpegPath', () => events.emit('ffmpegPath'))
ipcRenderer.on('play', () => events.emit('play'))
ipcRenderer.on('pause', () => events.emit('pause'))
ipcRenderer.on('skip', (_, n: number) => events.emit('skip', n))
ipcRenderer.on('log', (_, ...args: any[]) => events.emit('log', ...args))
ipcRenderer.on('progress', (_, data: { id: string; progress: { percent: number } }) =>
    events.emit(data.id + 'progress', data.progress.percent)
)

if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('api', api)
        contextBridge.exposeInMainWorld('events', events)
    } catch (error) {
        console.error(error)
    }
}
