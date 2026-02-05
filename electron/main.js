const { app, BrowserWindow } = require('electron');
const path = require('path');

// Use Electron's built-in app.isPackaged instead of electron-is-dev
// app.isPackaged is true when running from a packaged app, false during development
const isDev = !app.isPackaged;

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: isDev,
            contextIsolation: !isDev,
            webSecurity: !isDev
        },
    });

    // In development, load the local Expo web server
    // In production, load the built index.html
    if (isDev) {
        console.log('Loading dev URL: http://localhost:8081');
        mainWindow.loadURL('http://localhost:8081');
    } else {
        const indexPath = path.join(__dirname, '../dist/index.html');
        console.log('Loading file:', indexPath);
        mainWindow.loadFile(indexPath);
    }

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
