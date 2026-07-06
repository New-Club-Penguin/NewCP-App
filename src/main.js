const { app, BrowserWindow, session } = require("electron");
const discord_integration = require('./integrations/discord');
const path = require("path");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) app.quit();

// Check for updates except for macOS
if (process.platform != "darwin") {
  const { updateElectronApp } = require("update-electron-app");
  updateElectronApp({
    repo: "New-Club-Penguin/NewCP-App-Build"
  });
}

const ALLOWED_ORIGINS = [
  "https://newcp.net",
  "https://play.newcp.net",
  "https://appeal.newcp.net",
];

let mainWindow;
const createWindow = () => {
  // Create the browser window.
  let splashWindow = new BrowserWindow({
    width: 600,
    height: 320,
    frame: false,
    transparent: true,
    show: false,
  });

  splashWindow.setResizable(false);
  splashWindow.loadURL(
    "file://" + path.join(path.dirname(__dirname), "src/index.html"),
  );
  splashWindow.on("closed", () => (splashWindow = null));
  splashWindow.webContents.on("did-finish-load", () => {
    splashWindow.show();
  });

  mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
    useContentSize: true,
    show: false,
  });

  mainWindow.webContents.on("did-finish-load", () => {
    if (splashWindow) {
      splashWindow.close();
      mainWindow.show();
    }
    discord_integration.initDiscordRichPresence();
  });

  mainWindow.webContents.on("will-navigate", (event, urlString) => {
    if (!ALLOWED_ORIGINS.includes(new URL(urlString).origin)) {
      event.preventDefault();
    }
  });

  app.on('before-quit', async () => {
    await discord_integration.cleanupDiscord();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
    }
  });
  
  mainWindow.on("closed", () => (mainWindow = null));

  session.defaultSession.clearHostResolverCache();
  withTimeout(mainWindow.loadURL("https://newcp.net/"), 60000).catch(async () => {
      await discord_integration.cleanupDiscord();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.close();
      }

      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
      }
  });
};

const launchMain = () => {
  // Disallow multiple clients running
  if (!app.requestSingleInstanceLock()) return app.quit();
  app.on("second-instance", (_event, _commandLine, _workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  app.setAsDefaultProtocolClient("newcp");

  app.whenReady().then(() => {
    createWindow();
    
    app.on("activate", () => {
      // On OS X it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  })

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
      process.exit(0);
    }
  });
}

async function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(`Operation timed out after ${ms} ms`));
    }, ms);
  });

  // Race the original promise against the timeout
  return Promise.race([promise, timeout]);
}

launchMain();
