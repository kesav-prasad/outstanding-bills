import React, { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';

export default function ExpenseEntry({ onNavigate }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    name: '',
    details: '',
    amount: ''
  });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.amount || isNaN(formData.amount)) return alert('Please enter a valid amount.');

    await window.api.addExpense(
      formData.date, 
      formData.name, 
      formData.details, 
      parseFloat(formData.amount)
    );
    alert('Expense saved successfully!');
    onNavigate('home');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
        <button onClick={() => onNavigate('home')} style={{ background: 'white', border: '1px solid #ccc', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={18} />
        </button>
        <h2 style={{ margin: 0, color: '#1f2937' }}>Expense Entry (Internal)</h2>
      </div>

      <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date *</label>
            <input 
              type="date" 
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Name (Who incurred it)</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Staff Name, Courier Service"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Expense Details</label>
            <input 
              type="text" 
              value={formData.details}
              onChange={e => setFormData({...formData, details: e.target.value})}
              placeholder="e.g., Office Supplies, Transport"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Expense Amount (₹) *</label>
            <input 
              type="number" 
              step="0.01"
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: e.target.value})}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              required
            />
          </div>

          <button type="submit" style={{ background: '#f59e0b', color: 'white', padding: '12px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
            <Save size={20} /> Save Expense
          </button>
        </form>
      </div>
    </div>
  );
}
