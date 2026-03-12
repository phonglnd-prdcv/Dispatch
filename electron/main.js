const { app, BrowserWindow, protocol, net, Notification, ipcMain, session } = require('electron');
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
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
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
    // ── Content Security Policy ───────────────────────────────────────
    // Set a proper CSP to silence the Electron security warning about
    // "unsafe-eval" / missing CSP.  In development we allow the local
    // dev-server origin; in production only the custom app:// scheme.
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        let csp;
        if (isDev) {
            // Dev mode: Metro/webpack needs 'unsafe-eval' for source maps
            // and hot-reload, blob: for dynamic chunks, ws: for HMR.
            csp =
                "default-src 'self' http://localhost:8081;" +
                " script-src 'self' http://localhost:8081 'unsafe-inline' 'unsafe-eval' blob:;" +
                " style-src 'self' http://localhost:8081 'unsafe-inline';" +
                " img-src 'self' http://localhost:8081 data: https: blob:;" +
                " font-src 'self' http://localhost:8081 data:;" +
                " connect-src 'self' http://localhost:8081 https: wss: ws:;" +
                " media-src 'self' http://localhost:8081 data: blob:;" +
                " worker-src 'self' blob:;";
        } else {
            csp =
                "default-src 'self' app:;" +
                " script-src 'self' app: 'unsafe-inline';" +
                " style-src 'self' app: 'unsafe-inline';" +
                " img-src 'self' app: data: https:;" +
                " font-src 'self' app: data:;" +
                " connect-src 'self' app: https: wss:;" +
                " media-src 'self' app: data:;" +
                " worker-src 'self' blob:;";
        }

        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [csp],
            },
        });
    });
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

    // ── Notification IPC handlers ──────────────────────────────────────
    // Allow the renderer to request native Electron Notification objects
    // which map to macOS Notification Center, Windows Toast & Linux
    // libnotify/notify-send automatically.

    ipcMain.handle('notifications:isSupported', () => {
        return Notification.isSupported();
    });

    ipcMain.handle('notifications:show', (_event, payload) => {
        if (!Notification.isSupported()) {
            console.warn('Native notifications are not supported on this platform');
            return false;
        }

        try {
            const notification = new Notification({
                title: payload.title || 'Resgrid Dispatch',
                body: payload.body || '',
                icon: path.join(__dirname, '../assets/icon.png'),
                silent: false,
            });

            notification.on('click', () => {
                // Focus / restore the main window when the notification is clicked
                const windows = BrowserWindow.getAllWindows();
                if (windows.length > 0) {
                    const win = windows[0];
                    if (win.isMinimized()) win.restore();
                    win.focus();
                }
            });

            notification.show();
            return true;
        } catch (err) {
            console.error('Failed to show native notification:', err);
            return false;
        }
    });

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
