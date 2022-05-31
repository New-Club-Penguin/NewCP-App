const { app, BrowserWindow, autoUpdater } = require('electron');
const path = require('path');
require('update-electron-app')({repo: 'New-Club-Penguin/NewCP-App-Build'});
const discord_client = require('discord-rich-presence')('793878460157788220');

const ALLOWED_ORIGINS = [
  "https://newcp.net",
  "https://play.newcp.net"
];

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
  process.exit(0); // because squirrel
}

let pluginName;
switch (process.platform) {
  case 'win32':
    pluginName = 'lib/pepflashplayer.dll'
    break
  case 'darwin':
    pluginName = 'lib/PepperFlashPlayer.plugin'
    break
  case 'linux':
    pluginName = 'lib/libpepflashplayer.so'
	app.commandLine.appendSwitch('no-sandbox');
    break
}
pluginName = path.join(path.dirname(__dirname), pluginName);
console.log("pluginName", pluginName);
app.commandLine.appendSwitch('ppapi-flash-path', pluginName);
app.commandLine.appendSwitch('ppapi-flash-version', '31.0.0.122');
app.commandLine.appendSwitch("disable-http-cache");

let mainWindow;
const createWindow = () => {
  // Create the browser window.
  let splashWindow = new BrowserWindow({
    width: 600,
    height: 320,
    frame: false,
    transparent: true,
    show: false
  });

  splashWindow.setResizable(false);
  splashWindow.loadURL(
    'file://' + path.join(path.dirname(__dirname), "src/index.html")
  );
  splashWindow.on('closed', () => (splashWindow = null));
  splashWindow.webContents.on('did-finish-load', () => {
    splashWindow.show();
  });

  mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
    useContentSize: true,
    show: false,
    webPreferences: {
      plugins: true
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    if (splashWindow) {
      splashWindow.close();
    }
    mainWindow.minimize();
    mainWindow.maximize();
    mainWindow.show();

    discord_client.updatePresence({
      state: 'Waddling',
      details: 'New Club Penguin',
      startTimestamp: Date.now(),
      largeImageKey: 'ncpapp',
      instance: true
    });
  });

  mainWindow.webContents.on('will-navigate', (event, urlString) => {
    let url = new URL(urlString);
    if (!ALLOWED_ORIGINS.includes(url.origin)) {
      event.preventDefault();
    }
  });

  new Promise(resolve => setTimeout(function() {mainWindow.loadURL("https://newcp.net/"); resolve();}, 5000));
  

};

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit();
  process.exit(0); // because squirrel
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.on('ready', createWindow);

  app.setAsDefaultProtocolClient('newcp');

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
      discord_client.disconnect();
      process.exit(0); // because squirrel
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}
