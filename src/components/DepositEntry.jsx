import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';

export default function DepositEntry({ onNavigate }) {
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    customer_id: '',
    account_no: '',
    mode: 'Cash',
    other_mode: '',
    txn_no: '',
    amount: '',
    receipt: null
  });

  useEffect(() => {
    window.api.getCustomers().then(setCustomers);
  }, []);

  const handleCustomerChange = (e) => {
    const cid = e.target.value;
    const customer = customers.find(c => c.id.toString() === cid);
    setFormData({
      ...formData,
      customer_id: cid,
      account_no: customer ? (customer.account_no || '') : ''
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        window.api.showMessageBox({ type: 'warning', title: 'File too large', message: 'Please upload a receipt smaller than 2MB.' });
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, receipt: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.customer_id) {
      await window.api.showMessageBox({ type: 'warning', title: 'Validation Error', message: 'Please select a customer.' });
      return;
    }
    if (!formData.amount || isNaN(formData.amount)) {
      await window.api.showMessageBox({ type: 'warning', title: 'Validation Error', message: 'Please enter a valid amount.' });
      return;
    }

    const finalMode = formData.mode === 'Other' ? formData.other_mode : formData.mode;
    
    await window.api.addDeposit(
      formData.customer_id, 
      formData.date, 
      formData.account_no, 
      finalMode, 
      formData.txn_no, 
      parseFloat(formData.amount),
      formData.receipt
    );
    await window.api.showMessageBox({ type: 'info', title: 'Success', message: 'Deposit saved successfully!' });
    onNavigate('home');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
        <button onClick={() => onNavigate('home')} style={{ background: 'white', border: '1px solid #ccc', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={18} />
        </button>
        <h2 style={{ margin: 0, color: '#1f2937' }}>Deposit Entry</h2>
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
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Customer Name *</label>
            <select 
              value={formData.customer_id}
              onChange={handleCustomerChange}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              required
            >
              <option value="">-- Select Customer --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Account Number</label>
            <input 
              type="text" 
              value={formData.account_no}
              onChange={e => setFormData({...formData, account_no: e.target.value})}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Mode of Deposit *</label>
            <select 
              value={formData.mode}
              onChange={e => setFormData({...formData, mode: e.target.value})}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              required
            >
              <option value="Cash">Cash</option>
              <option value="GPay">GPay</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {formData.mode === 'Other' && (
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Specify Other Mode *</label>
              <input 
                type="text" 
                value={formData.other_mode}
                onChange={e => setFormData({...formData, other_mode: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                required
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Txn. No / Ref No</label>
            <input 
              type="text" 
              value={formData.txn_no}
              onChange={e => setFormData({...formData, txn_no: e.target.value})}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Deposit Amount (₹) *</label>
            <input 
              type="number" 
              step="0.01"
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: e.target.value})}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Upload Receipt (Optional)</label>
            <input 
              type="file" 
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white' }}
            />
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>Max file size: 2MB. Supports images and PDFs.</div>
          </div>

          <button type="submit" style={{ background: '#10b981', color: 'white', padding: '12px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
            <Save size={20} /> Save Deposit
          </button>
        </form>
      </div>
    </div>
  );
}
