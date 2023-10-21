import electron from 'electron';
import fs from 'fs';
import path from 'path';

type PathType =
    "temp"
    | "home"
    | "appData"
    | "userData"
    | "sessionData"
    | "exe"
    | "module"
    | "desktop"
    | "documents"
    | "downloads"
    | "music"
    | "pictures"
    | "videos"
    | "recent"
    | "logs"
    | "crashDumps"

class Directories {
    public temp: string;
    public files: string;
    public music: string;

    constructor() {
        this.temp = this.initializeDir('temp', 'ruurd-music');
        this.files = this.initializeDir('appData', 'ruurd-music-files');
        this.music = this.getDir('music', '');
    }

    initializeDir(base: PathType, dir: string) {
        let fullDir = this.getDir(base, dir);
        this.createDir(fullDir);
        return fullDir;
    }

    getDir(base: PathType = 'music', dir = 'files') {
        let app = electron.app;
        if (electron.hasOwnProperty('remote'))
            app = electron.app;
        return path.join(app.getPath(base), dir);
    }

    createDir(dir: string) {
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir);
    }
}

export default new Directories();