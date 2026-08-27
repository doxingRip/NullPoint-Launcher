const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dataDir = path.join(app.getPath('userData'), 'nullpoint');
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, 'launcher.db'));
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  ram_mb INTEGER NOT NULL DEFAULT 4096,
  client_path TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uid TEXT UNIQUE NOT NULL,
  login TEXT NOT NULL,
  avatar TEXT,
  expires_at TEXT
);
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  user_id INTEGER,
  access_token TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
INSERT OR IGNORE INTO settings(id, ram_mb, client_path) VALUES(1, 4096, '');
`);

let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: '#0b0d12',
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

ipcMain.handle('settings:get', () => db.prepare('SELECT ram_mb, client_path FROM settings WHERE id=1').get());
ipcMain.handle('settings:set', (_, value) => {
  const ram = Math.max(1024, Math.floor(Number(value.ram_mb) || 4096));
  const clientPath = typeof value.client_path === 'string' ? value.client_path : '';
  db.prepare('UPDATE settings SET ram_mb=?, client_path=? WHERE id=1').run(ram, clientPath);
  return db.prepare('SELECT ram_mb, client_path FROM settings WHERE id=1').get();
});
ipcMain.handle('client:choosePath', async () => {
  const result = await dialog.showOpenDialog(win, { properties: ['openDirectory', 'createDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});
ipcMain.handle('window:minimize', () => win.minimize());
ipcMain.handle('window:close', () => win.close());
ipcMain.handle('auth:logout', () => {
  db.prepare('DELETE FROM sessions WHERE id=1').run();
  return true;
});
ipcMain.handle('profile:get', () => {
  const session = db.prepare('SELECT user_id FROM sessions WHERE id=1').get();
  if (!session) return null;
  return db.prepare('SELECT uid, login, avatar, expires_at FROM users WHERE id=?').get(session.user_id) || null;
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
