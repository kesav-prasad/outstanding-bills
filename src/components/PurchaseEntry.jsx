import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';

export default function PurchaseEntry({ onNavigate }) {
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    customer_id: '',
    account_no: '',
    details: '',
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

    await window.api.addPurchase(formData.customer_id, formData.date, formData.details, parseFloat(formData.amount), formData.receipt);
    await window.api.showMessageBox({ type: 'info', title: 'Success', message: 'Purchase saved successfully!' });
    onNavigate('home');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
        <button onClick={() => onNavigate('home')} style={{ background: 'white', border: '1px solid #ccc', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={18} />
        </button>
        <h2 style={{ margin: 0, color: '#1f2937' }}>Purchase Entry</h2>
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
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>If customer is not in the list, please add them in Manage Customer first.</div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Account Number</label>
            <input 
              type="text" 
              value={formData.account_no}
              readOnly
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#f3f4f6' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Purchase Details</label>
            <input 
              type="text" 
              value={formData.details}
              onChange={e => setFormData({...formData, details: e.target.value})}
              placeholder="E.g., 50x Brushes"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Purchase Amount (₹) *</label>
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

          <button type="submit" style={{ background: '#3b82f6', color: 'white', padding: '12px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
            <Save size={20} /> Save Purchase
          </button>
        </form>
      </div>
    </div>
  );
}
