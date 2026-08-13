import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Trash2 } from 'lucide-react';

export default function History({ onNavigate }) {
  const [history, setHistory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filters, setFilters] = useState({
    customerId: '',
    type: 'All',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    window.api.getCustomers().then(setCustomers);
    fetchHistory();
  }, [filters]);

  const fetchHistory = async () => {
    const data = await window.api.getHistory(
      filters.customerId || null,
      filters.type === 'All' ? null : filters.type,
      filters.startDate || null,
      filters.endDate || null
    );
    setHistory(data);
  };

  const handleDelete = async (type, id, desc) => {
    if (window.confirm(`Are you sure you want to delete this ${type}? (${desc})`)) {
      await window.api.deleteTransaction(type, id);
      fetchHistory(); // refresh
    }
  };

  const getRowColor = (type) => {
    if (type === 'Purchase') return '#eff6ff'; // light blue
    if (type === 'Deposit') return '#f0fdf4';  // light green
    if (type === 'Expense') return '#fffbeb';  // light yellow
    return 'white';
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
        <button onClick={() => onNavigate('home')} style={{ background: 'white', border: '1px solid #ccc', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={18} />
        </button>
        <h2 style={{ margin: 0, color: '#1f2937' }}>Transaction History</h2>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Customer</label>
            <select 
              value={filters.customerId}
              onChange={e => setFilters({...filters, customerId: e.target.value})}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              <option value="">All Customers</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Type</label>
            <select 
              value={filters.type}
              onChange={e => setFilters({...filters, type: e.target.value})}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              <option value="All">All Types</option>
              <option value="Purchase">Purchases</option>
              <option value="Deposit">Deposits</option>
              <option value="Expense">Expenses</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Start Date</label>
            <input 
              type="date" 
              value={filters.startDate}
              onChange={e => setFilters({...filters, startDate: e.target.value})}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>End Date</label>
            <input 
              type="date" 
              value={filters.endDate}
              onChange={e => setFilters({...filters, endDate: e.target.value})}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
          </div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Customer</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Details</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h, i) => (
              <tr key={`${h.type}-${h.id}-${i}`} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: getRowColor(h.type) }}>
                <td style={{ padding: '12px' }}>{h.date.split('-').reverse().join('.')}</td>
                <td style={{ padding: '12px', fontWeight: 'bold', color: h.type === 'Purchase' ? '#2563eb' : (h.type === 'Deposit' ? '#16a34a' : '#d97706') }}>
                  {h.type}
                </td>
                <td style={{ padding: '12px' }}>{h.customer_name}</td>
                <td style={{ padding: '12px', color: '#4b5563' }}>{h.description || '-'}</td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>₹{h.amount.toLocaleString('en-IN')}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button onClick={() => handleDelete(h.type, h.id, h.description || h.amount)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#6b7280' }}>
                  No transactions found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
