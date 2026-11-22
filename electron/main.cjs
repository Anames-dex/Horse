const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#09090b',
    title: 'Equine Pedigree Engine',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Remove standard default menu bar for clean app look
  win.setMenuBarVisibility(false);

  // In production, load the built index.html from dist
  const distPath = path.join(__dirname, '../dist/index.html');
  win.loadFile(distPath).catch(() => {
    // If dist is not yet built, attempt dev server
    win.loadURL('http://localhost:3000');
  });
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
