'use strict';

const { app, dialog } = require('electron');
const path = require('path');
const fs   = require('fs');

function getLogPath() {
  try {
    return path.join(app.getPath('userData'), 'newcp-error.log');
  } catch {
    return path.join(__dirname, '..', 'newcp-error.log');
  }
}

function getSystemInfo() {
  return {
    platform : process.platform,
    arch     : process.arch,
    node     : process.versions.node,
    electron : process.versions.electron ?? 'N/A',
    chrome   : process.versions.chrome   ?? 'N/A',
    memory   : `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB used / ${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB total`,
    uptime   : `${Math.round(process.uptime())}s`,
  };
}

function writeLog(type, err) {
  const timestamp  = new Date().toISOString();
  const message    = err?.stack ?? String(err);
  const sys        = getSystemInfo();
  const line = [
    `[${timestamp}] ${type}`,
    `  Platform : ${sys.platform} ${sys.arch}`,
    `  Node     : ${sys.node}`,
    `  Electron : ${sys.electron}`,
    `  Chrome   : ${sys.chrome}`,
    `  Memory   : ${sys.memory}`,
    `  Uptime   : ${sys.uptime}`,
    `  Error    :\n${message}`,
    '─'.repeat(60),
    '',
  ].join('\n');

  try {
    fs.appendFileSync(getLogPath(), line, 'utf8');
  } catch { }

  console.error(`[NewCP | ${type}]`, {
    timestamp,
    platform : sys.platform,
    arch     : sys.arch,
    node     : sys.node,
    electron : sys.electron,
    error    : err,
  });
}

function showFatalDialog(title, detail) {
  const sys = getSystemInfo();
  const fullDetail = [
    detail,
    '',
    '── System Info ──────────────────────',
    `Platform : ${sys.platform} (${sys.arch})`,
    `Node     : ${sys.node}`,
    `Electron : ${sys.electron}`,
    `Memory   : ${sys.memory}`,
    '',
    `Log saved at:\n${getLogPath()}`,
  ].join('\n');

  try {
    dialog.showErrorBox(`NewCP — ${title}`, fullDetail);
  } catch { }
}

module.exports = function initErrorHandlers(appInstance) {

  process.on('uncaughtException', (err) => {
    writeLog('uncaughtException', err);
    showFatalDialog(
      'Unexpected Error',
      `A critical error occurred and the application must close.\n\nReason: ${err.message}`
    );
    appInstance.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    writeLog('unhandledRejection', err);
    console.warn(`[NewCP | unhandledRejection] A promise was rejected without a .catch() handler.\n  Reason: ${err.message}`);
  });

  appInstance.on('render-process-gone', (_event, webContents, details) => {
    writeLog('render-process-gone', new Error(
      `Renderer crashed — reason: ${details.reason} | exitCode: ${details.exitCode} | url: ${webContents.getURL()}`
    ));
    console.error(`[NewCP | render-process-gone] Renderer process terminated.`, {
      reason  : details.reason,
      exitCode: details.exitCode,
      url     : webContents.getURL(),
    });

    if (['crashed', 'killed'].includes(details.reason)) {
      showFatalDialog(
        'Game Window Closed Unexpectedly',
        `The renderer process terminated.\n\nReason   : ${details.reason}\nExit Code: ${details.exitCode}\nURL      : ${webContents.getURL()}\n\nYou can try restarting the application.`
      );
      appInstance.quit();
    }
  });

  appInstance.on('child-process-gone', (_event, details) => {
    writeLog('child-process-gone', new Error(
      `Child process gone — type: ${details.type} | reason: ${details.reason} | exitCode: ${details.exitCode} | name: ${details.name ?? 'N/A'}`
    ));
    console.error(`[NewCP | child-process-gone] A child process terminated.`, {
      type    : details.type,
      reason  : details.reason,
      exitCode: details.exitCode,
      name    : details.name ?? 'N/A',
    });

    if (details.type === 'GPU' && details.reason === 'crashed') {
      showFatalDialog(
        'GPU Process Crashed',
        `The GPU process terminated unexpectedly.\n\nProcess  : ${details.name ?? 'GPU'}\nReason   : ${details.reason}\nExit Code: ${details.exitCode}\n\nTry updating your video drivers.`
      );
    }
  });

};
