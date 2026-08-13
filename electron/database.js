const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db;

function initDatabase(dbPath) {
  db = new Database(dbPath);

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS Customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE COLLATE NOCASE,
      account_no TEXT,
      contact_info TEXT
    );

    CREATE TABLE IF NOT EXISTS Purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      date TEXT,
      details TEXT,
      amount REAL,
      FOREIGN KEY(customer_id) REFERENCES Customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Deposits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      date TEXT,
      account_no TEXT,
      mode TEXT,
      txn_no TEXT,
      amount REAL,
      FOREIGN KEY(customer_id) REFERENCES Customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      name TEXT,
      details TEXT,
      amount REAL
    );
  `);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
}

function closeDatabase() {
  if (db) db.close();
}

// --- CUSTOMERS ---
function addCustomer(name, account_no, contact_info) {
  const stmt = db.prepare('INSERT INTO Customers (name, account_no, contact_info) VALUES (?, ?, ?)');
  const info = stmt.run(name, account_no, contact_info);
  return info.lastInsertRowid;
}

function updateCustomer(id, name, account_no, contact_info) {
  const stmt = db.prepare('UPDATE Customers SET name = ?, account_no = ?, contact_info = ? WHERE id = ?');
  stmt.run(name, account_no, contact_info, id);
  return true;
}

function deleteCustomer(id) {
  const stmt = db.prepare('DELETE FROM Customers WHERE id = ?');
  stmt.run(id);
  return true;
}

function getCustomers() {
  // Get customers with their outstanding balances
  const stmt = db.prepare(`
    SELECT c.*, 
           IFNULL((SELECT SUM(amount) FROM Purchases WHERE customer_id = c.id), 0) - 
           IFNULL((SELECT SUM(amount) FROM Deposits WHERE customer_id = c.id), 0) AS outstanding_balance
    FROM Customers c
    ORDER BY c.name ASC
  `);
  return stmt.all();
}

// --- PURCHASES ---
function addPurchase(customer_id, date, details, amount) {
  const stmt = db.prepare('INSERT INTO Purchases (customer_id, date, details, amount) VALUES (?, ?, ?, ?)');
  const info = stmt.run(customer_id, date, details, amount);
  return info.lastInsertRowid;
}

// --- DEPOSITS ---
function addDeposit(customer_id, date, account_no, mode, txn_no, amount) {
  const stmt = db.prepare('INSERT INTO Deposits (customer_id, date, account_no, mode, txn_no, amount) VALUES (?, ?, ?, ?, ?, ?)');
  const info = stmt.run(customer_id, date, account_no, mode, txn_no, amount);
  return info.lastInsertRowid;
}

// --- EXPENSES ---
function addExpense(date, name, details, amount) {
  const stmt = db.prepare('INSERT INTO Expenses (date, name, details, amount) VALUES (?, ?, ?, ?)');
  const info = stmt.run(date, name, details, amount);
  return info.lastInsertRowid;
}

function getExpenses(startDate, endDate) {
  let query = 'SELECT * FROM Expenses';
  const params = [];
  
  if (startDate && endDate) {
    query += ' WHERE date >= ? AND date <= ?';
    params.push(startDate, endDate);
  }
  
  query += ' ORDER BY date DESC';
  const stmt = db.prepare(query);
  return stmt.all(...params);
}

// --- LEDGER / EXPORT ---
function getLedger(customerId, startDate, endDate) {
  // Gets combined chronological purchases and deposits for outstanding balance calculation
  let query = `
    SELECT 'Purchase' as type, p.id, p.date, c.name as customer_name, p.details as description, p.amount as purchase_amount, 0 as deposit_amount
    FROM Purchases p
    JOIN Customers c ON p.customer_id = c.id
    WHERE 1=1
  `;
  const params1 = [];
  if (customerId) {
    query += ` AND p.customer_id = ?`;
    params1.push(customerId);
  }
  if (startDate) {
    query += ` AND p.date >= ?`;
    params1.push(startDate);
  }
  if (endDate) {
    query += ` AND p.date <= ?`;
    params1.push(endDate);
  }

  query += `
    UNION ALL
    SELECT 'Deposit' as type, d.id, d.date, c.name as customer_name, d.mode || ' - ' || d.txn_no as description, 0 as purchase_amount, d.amount as deposit_amount
    FROM Deposits d
    JOIN Customers c ON d.customer_id = c.id
    WHERE 1=1
  `;
  const params2 = [];
  if (customerId) {
    query += ` AND d.customer_id = ?`;
    params2.push(customerId);
  }
  if (startDate) {
    query += ` AND d.date >= ?`;
    params2.push(startDate);
  }
  if (endDate) {
    query += ` AND d.date <= ?`;
    params2.push(endDate);
  }

  query += ` ORDER BY 3 ASC, 1 DESC, 2 ASC`; // Sort by date(3) ASC, type(1) DESC, id(2) ASC

  const stmt = db.prepare(query);
  const rows = stmt.all(...params1, ...params2);

  // Now calculate running balance
  // Note: if date filters are applied, the running balance should technically start from the balance *before* the start date.
  // To keep it simple and accurate, we calculate the balance before the start date for each customer,
  // then apply the running total.

  // Fetch opening balances per customer if there's a start date
  let openingBalances = {};
  if (startDate) {
    const obQuery = `
      SELECT c.id, c.name,
             IFNULL((SELECT SUM(amount) FROM Purchases WHERE customer_id = c.id AND date < ?), 0) - 
             IFNULL((SELECT SUM(amount) FROM Deposits WHERE customer_id = c.id AND date < ?), 0) AS opening_balance
      FROM Customers c
      WHERE 1=1
      ${customerId ? 'AND c.id = ?' : ''}
    `;
    const obParams = customerId ? [startDate, startDate, customerId] : [startDate, startDate];
    const obStmt = db.prepare(obQuery);
    const obRows = obStmt.all(...obParams);
    for (const r of obRows) {
      openingBalances[r.name] = r.opening_balance;
    }
  }

  let runningBalances = {};
  const ledgerWithBalances = [];

  for (const row of rows) {
    const cName = row.customer_name;
    if (runningBalances[cName] === undefined) {
      runningBalances[cName] = openingBalances[cName] || 0;
    }
    
    if (row.type === 'Purchase') {
      runningBalances[cName] += row.purchase_amount;
    } else {
      runningBalances[cName] -= row.deposit_amount;
    }

    ledgerWithBalances.push({
      ...row,
      outstanding: runningBalances[cName]
    });
  }

  return ledgerWithBalances;
}

// --- HISTORY ---
function getHistory(customerId, typeFilter, startDate, endDate) {
  let queries = [];
  let params = [];

  const addPurchases = () => {
    let q = `SELECT 'Purchase' as type, p.id, p.date, c.name as customer_name, p.customer_id, p.details as description, p.amount 
             FROM Purchases p JOIN Customers c ON p.customer_id = c.id WHERE 1=1`;
    if (customerId) { q += ' AND p.customer_id = ?'; params.push(customerId); }
    if (startDate) { q += ' AND p.date >= ?'; params.push(startDate); }
    if (endDate) { q += ' AND p.date <= ?'; params.push(endDate); }
    queries.push(q);
  };

  const addDeposits = () => {
    let q = `SELECT 'Deposit' as type, d.id, d.date, c.name as customer_name, d.customer_id, d.mode || ' - ' || d.txn_no as description, d.amount 
             FROM Deposits d JOIN Customers c ON d.customer_id = c.id WHERE 1=1`;
    if (customerId) { q += ' AND d.customer_id = ?'; params.push(customerId); }
    if (startDate) { q += ' AND d.date >= ?'; params.push(startDate); }
    if (endDate) { q += ' AND d.date <= ?'; params.push(endDate); }
    queries.push(q);
  };

  const addExpenses = () => {
    let q = `SELECT 'Expense' as type, e.id, e.date, 'N/A' as customer_name, NULL as customer_id, e.name || ' - ' || e.details as description, e.amount 
             FROM Expenses e WHERE 1=1`;
    if (customerId) { q += ' AND 1=0'; /* Expenses don't have customers */ }
    if (startDate) { q += ' AND e.date >= ?'; params.push(startDate); }
    if (endDate) { q += ' AND e.date <= ?'; params.push(endDate); }
    queries.push(q);
  };

  if (typeFilter === 'Purchase') { addPurchases(); }
  else if (typeFilter === 'Deposit') { addDeposits(); }
  else if (typeFilter === 'Expense') { addExpenses(); }
  else {
    addPurchases();
    addDeposits();
    addExpenses();
  }

  if (queries.length === 0) return [];

  const finalQuery = queries.join(' UNION ALL ') + ' ORDER BY 3 DESC, 2 DESC'; // date(3), id(2)
  const stmt = db.prepare(finalQuery);
  return stmt.all(...params);
}

function deleteTransaction(type, id) {
  let table = '';
  if (type === 'Purchase') table = 'Purchases';
  else if (type === 'Deposit') table = 'Deposits';
  else if (type === 'Expense') table = 'Expenses';
  
  if (table) {
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
    return true;
  }
  return false;
}

module.exports = {
  initDatabase,
  closeDatabase,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomers,
  addPurchase,
  addDeposit,
  addExpense,
  getExpenses,
  getLedger,
  getHistory,
  deleteTransaction
};
