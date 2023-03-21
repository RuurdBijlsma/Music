import {app, BrowserWindow, shell, ipcMain,session} from 'electron'
import {release} from 'node:os'
import {join} from 'node:path'

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │   └── index.js    > Electron-Main
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '..')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
    ? join(process.env.DIST_ELECTRON, '../public')
    : process.env.DIST

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
    app.quit()
    process.exit(0)
}

let win: BrowserWindow | null = null
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')

async function createWindow() {
    win = new BrowserWindow({
        title: 'Vue Music',
        icon: join(process.env.PUBLIC ?? './public', 'icon/new-dark-192.png'),
        width: 1500,
        height: 1000,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        titleBarStyle: "hidden",
    })

    if (process.env.VITE_DEV_SERVER_URL) { // electron-vite-vue#298
        win.loadURL(url ?? 'http://127.0.0.1:3344/')
        // Open devTool if the app is not packaged
        win.webContents.openDevTools()
    } else {
        win.loadFile(indexHtml)
    }

    // Test actively push message to the Electron-Renderer
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', new Date().toLocaleString())
    })

    // Make all links open with the browser, not with the application
    win.webContents.setWindowOpenHandler(({url}) => {
        if (url.startsWith('https:')) shell.openExternal(url)
        return {action: 'deny'}
    })
    // win.webContents.on('will-navigate', (event, url) => { }) #344
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    win = null
    if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
    if (win) {
        // Focus on the main window if the user tried to open another
        if (win.isMinimized()) win.restore()
        win.focus()
    }
})

app.on('activate', () => {
    const allWindows = BrowserWindow.getAllWindows()
    if (allWindows.length) {
        allWindows[0].focus()
    } else {
        createWindow()
    }
})

ipcMain.on('focus-window', () => {
    if (win)
        win.focus();
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
    const childWindow = new BrowserWindow({
        title: 'Vue Music',
        icon: join(process.env.PUBLIC ?? './public', 'icon/new-dark-192.png'),
        width: 1500,
        height: 1000,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        titleBarStyle: "hidden",
    })

    if (process.env.VITE_DEV_SERVER_URL) {
        childWindow.loadURL(`${url}#${arg}`)
    } else {
        childWindow.loadFile(indexHtml, {hash: arg})
    }
})
