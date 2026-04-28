'use strict';

require('./checkNodeVersion');

const { app, BrowserWindow } = require('electron');
const discord_integration    = require('./integrations/discord');
const path                   = require('path');

const initErrorHandlers = require('./errorHandler');
initErrorHandlers(app);

if (require('electron-squirrel-startup')) app.quit();

if (process.platform !== 'darwin') {
  require('update-electron-app')({ repo: 'New-Club-Penguin/NewCP-App-Build' });
}

const ALLOWED_ORIGINS = [
  'https://newcp.net',
  'https://play.newcp.net',
  'https://appeal.newcp.net',
];

const PLUGIN_PATHS = {
  win32:  path.join(path.dirname(__dirname), 'lib/pepflashplayer.dll'),
  darwin: path.join(path.dirname(__dirname), 'lib/PepperFlashPlayer.plugin'),
  linux:  path.join(path.dirname(__dirname), 'lib/libpepflashplayer.so'),
};

const pluginName = PLUGIN_PATHS[process.platform];

if (!pluginName) {
  process.stderr.write(`[NewCP] Platform not supported: ${process.platform}\n`);
  process.exit(1);
}

console.log('[NewCP] Flash plugin path:', pluginName);

if (process.platform === 'linux') app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('ppapi-flash-path', pluginName);
app.commandLine.appendSwitch('ppapi-flash-version', '31.0.0.122');
app.commandLine.appendSwitch('ignore-certificate-errors');

let mainWindow;

const createWindow = () => {
  let splashWindow = new BrowserWindow({
    width: 600,
    height: 320,
    frame: false,
    transparent: true,
    show: false,
  });

  splashWindow.setResizable(false);
  splashWindow.loadURL('file://' + path.join(path.dirname(__dirname), 'src/index.html'));
  splashWindow.on('closed', () => { splashWindow = null; });
  splashWindow.webContents.on('did-finish-load', () => splashWindow.show());

  mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
    useContentSize: true,
    show: false,
    webPreferences: {
      plugins: true,
    },
  });

  mainWindow.webContents.on('did-finish-load', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
    }
    mainWindow.show();
    discord_integration.initDiscordRichPresence();
  });

  mainWindow.webContents.on('will-navigate', (event, urlString) => {
    try {
      const origin = new URL(urlString).origin;
      if (!ALLOWED_ORIGINS.includes(origin)) {
        console.warn('[NewCP] URL blocked:', urlString);
        event.preventDefault();
      }
    } catch (err) {
      console.warn('[NewCP] URL invalid:', urlString);
      event.preventDefault();
    }
  });

  app.on('before-quit', async () => {
    await discord_integration.cleanupDiscord();
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  mainWindow.webContents.session.clearHostResolverCache();
  
  withTimeout(mainWindow.loadURL('https://newcp.net/'), 60000)
  .catch(async (err) => {
    console.error(`[NewCP] Timeout/Error Loaded: 60000ms —`, err.message);
    await discord_integration.cleanupDiscord();
    if (mainWindow   && !mainWindow.isDestroyed())   mainWindow.close();
    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
  });

const launchMain = () => {
  if (!app.requestSingleInstanceLock()) return app.quit();

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.setAsDefaultProtocolClient('newcp');

  app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
      process.exit(0);
    }
  });
};

async function withTimeout(promise, ms) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`OPERATION CANCELLED: timeout de ${ms}ms`)),
      ms
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

launchMain();
