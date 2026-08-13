const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Customers
  getCustomers: () => ipcRenderer.invoke('get-customers'),
  addCustomer: (name, account_no, contact_info) => ipcRenderer.invoke('add-customer', name, account_no, contact_info),
  updateCustomer: (id, name, account_no, contact_info) => ipcRenderer.invoke('update-customer', id, name, account_no, contact_info),
  deleteCustomer: (id) => ipcRenderer.invoke('delete-customer', id),

  // Transactions
  addPurchase: (customer_id, date, details, amount) => ipcRenderer.invoke('add-purchase', customer_id, date, details, amount),
  addDeposit: (customer_id, date, account_no, mode, txn_no, amount) => ipcRenderer.invoke('add-deposit', customer_id, date, account_no, mode, txn_no, amount),
  
  // Expenses
  addExpense: (date, name, details, amount) => ipcRenderer.invoke('add-expense', date, name, details, amount),
  getExpenses: (startDate, endDate) => ipcRenderer.invoke('get-expenses', startDate, endDate),

  // Ledger & History
  getLedger: (customerId, startDate, endDate) => ipcRenderer.invoke('get-ledger', customerId, startDate, endDate),
  getHistory: (customerId, typeFilter, startDate, endDate) => ipcRenderer.invoke('get-history', customerId, typeFilter, startDate, endDate),
  deleteTransaction: (type, id) => ipcRenderer.invoke('delete-transaction', type, id),
  
  // OS/File actions (for PDF)
  saveAndOpenFile: (buffer, defaultPath) => ipcRenderer.invoke('save-and-open-file', { buffer, defaultPath })
});
