const { app, BrowserWindow, protocol, net } = require('electron');
const path = require('path');
const url = require('url');

// Use Electron's built-in app.isPackaged instead of electron-is-dev
// app.isPackaged is true when running from a packaged app, false during development
const isDev = !app.isPackaged;

// Register custom protocol scheme before app is ready.
// This allows serving local files with proper URL resolution so that
// absolute asset paths (e.g. /entry-xxx.js) resolve correctly instead of
// hitting the filesystem root when using file:// protocol.
protocol.registerSchemesAsPrivileged([
    {
        scheme: 'app',
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true,
            corsEnabled: true,
            stream: true,
        },
    },
]);

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: 'Resgrid Dispatch',
        icon: path.join(__dirname, '../assets/icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: isDev,
            contextIsolation: !isDev,
            webSecurity: !isDev,
        },
    });

    // Prevent the HTML <title> tag from overriding the window title
    mainWindow.on('page-title-updated', (event) => {
        event.preventDefault();
    });

    // In development, load the local Expo web server
    // In production, load via custom app:// protocol that serves from dist/
    if (isDev) {
        console.log('Loading dev URL: http://localhost:8081');
        mainWindow.loadURL('http://localhost:8081');
        mainWindow.webContents.openDevTools();
    } else {
        console.log('Loading app://./index.html');
        mainWindow.loadURL('app://./index.html');
    }
}

app.whenReady().then(() => {
    // Register the custom app:// protocol handler for production builds.
    // This serves all files from the dist/ directory so that absolute asset
    // paths in the bundled HTML/JS/CSS resolve correctly.
    if (!isDev) {
        const distPath = path.join(__dirname, '../dist');
        protocol.handle('app', (request) => {
            const requestUrl = new URL(request.url);
            let filePath = decodeURIComponent(requestUrl.pathname);

            // Normalize the path: remove leading slashes/dots
            filePath = filePath.replace(/^\/+/, '');
            if (!filePath || filePath === '.' || filePath === './') {
                filePath = 'index.html';
            }

            const fullPath = path.join(distPath, filePath);
            return net.fetch(url.pathToFileURL(fullPath).toString());
        });
    }

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
