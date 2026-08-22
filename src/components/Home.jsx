import React, { useState, useEffect } from 'react';
import { ShoppingCart, Download, DollarSign, Users, FileText, History as HistoryIcon, X } from 'lucide-react';

export default function Home({ onNavigate }) {
  const [customers, setCustomers] = useState([]);
  const [filters, setFilters] = useState({
    customerId: '',
    month: 'All',
    year: new Date().getFullYear().toString()
  });

  const [totals, setTotals] = useState({
    purchase: 0,
    deposit: 0,
    expense: 0,
    outstanding: 0
  });

  const [isOutstandingModalOpen, setIsOutstandingModalOpen] = useState(false);

  // Lists for dropdowns
  const months = [
    { value: 'All', label: 'All Months' },
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const currentYear = new Date().getFullYear();
  const years = ['All', ...Array.from({ length: 5 }, (_, i) => (currentYear - i).toString())];

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const fetchDashboardData = async () => {
    // 1. Fetch Customers to calculate Outstanding
    const allCustomers = await window.api.getCustomers();
    setCustomers(allCustomers);

    // Calculate Total Outstanding (sum of all customers, or specifically filtered customer)
    let totalOutstanding = 0;
    if (filters.customerId) {
      const selected = allCustomers.find(c => c.id.toString() === filters.customerId);
      if (selected) totalOutstanding = selected.outstanding_balance || 0;
    } else {
      totalOutstanding = allCustomers.reduce((sum, c) => sum + (c.outstanding_balance || 0), 0);
    }

    // 2. Compute date range
    let startDate = null;
    let endDate = null;

    if (filters.year !== 'All') {
      if (filters.month === 'All') {
        startDate = `${filters.year}-01-01`;
        endDate = `${filters.year}-12-31`;
      } else {
        startDate = `${filters.year}-${filters.month}-01`;
        // get last day of the month
        const lastDay = new Date(parseInt(filters.year), parseInt(filters.month, 10), 0).getDate();
        endDate = `${filters.year}-${filters.month}-${lastDay}`;
      }
    }

    // 3. Fetch History for the date range to calculate Purchase, Deposit, Expense
    const historyData = await window.api.getHistory(
      filters.customerId || null,
      null, // All types
      startDate,
      endDate
    );

    let totalPurchase = 0;
    let totalDeposit = 0;
    let totalExpense = 0;

    historyData.forEach(item => {
      if (item.type === 'Purchase') totalPurchase += (item.purchase_amount || 0);
      else if (item.type === 'Deposit') totalDeposit += (item.deposit_amount || 0);
      else if (item.type === 'Expense') totalExpense += (item.expense_amount || 0);
    });

    setTotals({
      purchase: totalPurchase,
      deposit: totalDeposit,
      expense: totalExpense,
      outstanding: totalOutstanding
    });
  };

  const Button = ({ label, icon: Icon, onClick, color }) => (
    <button 
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        border: `2px solid ${color}`,
        borderRadius: '12px',
        padding: '30px 20px',
        cursor: 'pointer',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        gap: '15px'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.1)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
      }}
    >
      <Icon size={48} color={color} />
      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#374151' }}>{label}</span>
    </button>
  );

  const SummaryCard = ({ title, amount, color, onClick }) => (
    <div 
      onClick={onClick}
      style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        borderLeft: `5px solid ${color}`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        cursor: onClick ? 'pointer' : 'default',
        transition: onClick ? 'transform 0.2s' : 'none'
      }}
      onMouseOver={(e) => onClick && (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseOut={(e) => onClick && (e.currentTarget.style.transform = 'translateY(0)')}
    >
      <div style={{ color: '#6b7280', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>{title}</div>
      <div style={{ color: color, fontSize: '24px', fontWeight: 'bold' }}>
        ₹ {amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      {onClick && <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '5px' }}>Click to view details ➔</div>}
    </div>
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '20px', paddingBottom: '40px' }}>
      
      {/* FILTERS */}
      <div style={{ background: 'white', padding: '15px 20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
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
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Year</label>
            <select 
              value={filters.year}
              onChange={e => setFilters({...filters, year: e.target.value})}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              {years.map(y => <option key={y} value={y}>{y === 'All' ? 'All Years' : y}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Month</label>
            <select 
              value={filters.month}
              onChange={e => setFilters({...filters, month: e.target.value})}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              disabled={filters.year === 'All'}
            >
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <SummaryCard title="TOTAL PURCHASE" amount={totals.purchase} color="#3b82f6" />
        <SummaryCard title="TOTAL DEPOSIT" amount={totals.deposit} color="#10b981" />
        <SummaryCard title="TOTAL EXPENSE" amount={totals.expense} color="#f59e0b" />
        <SummaryCard 
          title="TOTAL OUTSTANDING" 
          amount={totals.outstanding} 
          color="#ef4444" 
          onClick={() => setIsOutstandingModalOpen(true)}
        />
      </div>
      
      {/* NAVIGATION BUTTONS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <Button label="Purchase Entry" icon={ShoppingCart} color="#3b82f6" onClick={() => onNavigate('purchase-entry')} />
        <Button label="Deposit Entry" icon={Download} color="#10b981" onClick={() => onNavigate('deposit-entry')} />
        <Button label="Expense Entry" icon={DollarSign} color="#f59e0b" onClick={() => onNavigate('expense-entry')} />
        <Button label="Manage Customer" icon={Users} color="#8b5cf6" onClick={() => onNavigate('manage-customer')} />
        <Button label="History" icon={HistoryIcon} color="#64748b" onClick={() => onNavigate('history')} />
        <Button label="Export" icon={FileText} color="#ef4444" onClick={() => onNavigate('export')} />
      </div>

      {/* OUTSTANDING MODAL */}
      {isOutstandingModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{
            background: 'white', width: '90%', maxWidth: '600px', borderRadius: '12px',
            maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#1f2937' }}>Pending Payments (Outstanding)</h3>
              <button onClick={() => setIsOutstandingModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="#6b7280" />
              </button>
            </div>
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                    <th style={{ paddingBottom: '10px' }}>Customer Name</th>
                    <th style={{ paddingBottom: '10px', textAlign: 'right' }}>Pending Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.filter(c => c.outstanding_balance !== 0).sort((a,b) => b.outstanding_balance - a.outstanding_balance).map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 0', fontWeight: 'bold' }}>{c.name}</td>
                      <td style={{ padding: '12px 0', textAlign: 'right', color: c.outstanding_balance > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                        {c.outstanding_balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  {customers.filter(c => c.outstanding_balance !== 0).length === 0 && (
                    <tr>
                      <td colSpan="2" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                        No pending payments.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
