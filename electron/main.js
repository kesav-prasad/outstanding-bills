const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const dbAPI = require('./database');

// Configure autoUpdater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on('update-available', () => {
  console.log('Update available.');
});
autoUpdater.on('update-downloaded', () => {
  console.log('Update downloaded. It will be installed on app quit.');
});

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'Outstanding Bills Tracker',
    autoHideMenuBar: true,
  });

  mainWindow.maximize();

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  const dbPath = path.join(app.getPath('userData'), 'outstanding_bills.sqlite');
  console.log("Database path:", dbPath);
  
  try {
    dbAPI.initDatabase(dbPath);
  } catch (error) {
    console.error("DB_INIT_ERROR:", error);
    dialog.showErrorBox('Database Initialization Error', error.toString());
  }

  // IPC handlers
  ipcMain.handle('get-customers', () => dbAPI.getCustomers());
  ipcMain.handle('add-customer', (e, name, acc, info) => dbAPI.addCustomer(name, acc, info));
  ipcMain.handle('update-customer', (e, id, name, acc, info) => dbAPI.updateCustomer(id, name, acc, info));
  ipcMain.handle('delete-customer', (e, id) => dbAPI.deleteCustomer(id));

  ipcMain.handle('add-purchase', (e, cid, date, details, amt, receipt) => dbAPI.addPurchase(cid, date, details, amt, receipt));
  ipcMain.handle('add-deposit', (e, cid, date, acc, mode, txn, amt, receipt) => dbAPI.addDeposit(cid, date, acc, mode, txn, amt, receipt));
  
  ipcMain.handle('add-expense', (e, date, name, details, amt) => dbAPI.addExpense(date, name, details, amt));
  ipcMain.handle('get-expenses', (e, start, end) => dbAPI.getExpenses(start, end));

  ipcMain.handle('get-ledger', (e, cid, start, end) => dbAPI.getLedger(cid, start, end));
  ipcMain.handle('get-history', (e, cid, type, start, end) => dbAPI.getHistory(cid, type, start, end));
  ipcMain.handle('delete-transaction', (e, type, id) => dbAPI.deleteTransaction(type, id));

  ipcMain.handle('save-and-open-file', async (event, { buffer, defaultPath }) => {
    let filters = [];
    if (defaultPath && defaultPath.endsWith('.pdf')) {
      filters = [{ name: 'PDF Document', extensions: ['pdf'] }];
    } else if (defaultPath && (defaultPath.endsWith('.xlsx') || defaultPath.endsWith('.csv'))) {
      filters = [{ name: 'Excel/CSV Document', extensions: ['xlsx', 'csv'] }];
    } else {
      filters = [{ name: 'All Files', extensions: ['*'] }];
    }

    try {
      const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, { 
        defaultPath,
        filters
      });
      
      if (canceled || !filePath) return { success: false, error: 'Cancelled by user' };
      
      fs.writeFileSync(filePath, Buffer.from(buffer));
      
      // Verify file was written
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File was not created on disk.' };
      }
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        return { success: false, error: 'File was created but is completely empty (0 bytes).' };
      }

      shell.openPath(filePath);
      return { success: true, path: filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('show-message-box', async (event, options) => {
    return await dialog.showMessageBox(mainWindow, options);
  });


  createWindow();

  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify().catch(err => {
      console.error('Auto-updater error:', err);
    });
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  try {
    dbAPI.closeDatabase();
  } catch (e) {
    console.error("Failed to close database:", e);
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
