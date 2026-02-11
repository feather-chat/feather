import { app, BrowserWindow } from 'electron';
import path from 'path';

const webPreferences: Electron.WebPreferences = {
  preload: path.join(__dirname, '..', 'preload', 'index.js'),
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
};

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences,
  });

  if (!app.isPackaged) {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(app.getAppPath(), 'web-dist', 'index.html'));
  }

  return win;
}

function isSmokeTest(): boolean {
  return process.argv.includes('--smoke-test');
}

app.whenReady().then(() => {
  if (isSmokeTest()) {
    const win = new BrowserWindow({
      show: false,
      webPreferences,
    });

    win.loadURL(
      `data:text/html,<html><body><script>
        document.body.textContent = JSON.stringify(window.electron);
      </script></body></html>`,
    );

    win.webContents.on('did-finish-load', async () => {
      const result = await win.webContents.executeJavaScript('JSON.stringify(window.electron)');
      const parsed = JSON.parse(result);
      if (parsed && parsed.isElectron === true && typeof parsed.platform === 'string') {
        console.log('SMOKE_TEST_PASS: preload bridge verified');
        console.log('bridge:', result);
      } else {
        console.error('SMOKE_TEST_FAIL: preload bridge not found');
        process.exitCode = 1;
      }
      app.quit();
    });

    return;
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
