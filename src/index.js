const { app, BrowserWindow } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
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
    break
}
pluginName = path.join(path.dirname(__dirname), pluginName);
console.log("pluginName", pluginName);
app.commandLine.appendSwitch('ppapi-flash-path', pluginName);
app.commandLine.appendSwitch('ppapi-flash-version', '31.0.0.122');

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1230,
    height: 860,
    useContentSize: true,
    webPreferences: {
      plugins: true
    }
  });

  mainWindow.loadURL("https://newcp.net");

};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
