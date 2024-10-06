import electron from 'electron'
import fs from 'fs'
import path from 'path'
import os from 'os'

type PathType =
    | 'temp'
    | 'home'
    | 'appData'
    | 'userData'
    | 'sessionData'
    | 'exe'
    | 'module'
    | 'desktop'
    | 'documents'
    | 'downloads'
    | 'music'
    | 'pictures'
    | 'videos'
    | 'recent'
    | 'logs'
    | 'crashDumps'

class Directories {
    public temp: string
    public files: string
    public music: string
    private readonly storeFile: string

    constructor() {
        if (os.platform() === 'linux') {
            this.temp = this.initializeDir('appData', 'ruurd-music-temp')
        } else {
            this.temp = this.initializeDir('temp', 'ruurd-music')
        }
        this.files = this.initializeDir('appData', 'ruurd-music-files')

        this.storeFile = path.join(this.files, 'store.json')
        this.music = this.getDir('music', '')
        if (fs.existsSync(this.storeFile)) {
            const store = JSON.parse(fs.readFileSync(this.storeFile).toString())
            if (fs.existsSync(store.music)) this.music = store.music
        }
    }

    changeMusicFolder(folder: string) {
        this.music = folder
        fs.writeFileSync(this.storeFile, JSON.stringify({ music: folder }))
    }

    initializeDir(base: PathType, dir: string) {
        const fullDir = this.getDir(base, dir)
        this.createDir(fullDir)
        return fullDir
    }

    getDir(base: PathType = 'music', dir = 'files') {
        let app = electron.app
        if (electron.hasOwnProperty('remote')) app = electron.app
        return path.join(app.getPath(base), dir)
    }

    createDir(dir: string) {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir)
    }
}

export default new Directories()
