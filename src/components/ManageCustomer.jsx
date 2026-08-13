import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Edit2, Trash2 } from 'lucide-react';

export default function ManageCustomer({ onNavigate }) {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ name: '', account_no: '', contact_info: '' });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const data = await window.api.getCustomers();
    setCustomers(data);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Name is required');

    if (editId) {
      await window.api.updateCustomer(editId, formData.name, formData.account_no, formData.contact_info);
    } else {
      try {
        await window.api.addCustomer(formData.name, formData.account_no, formData.contact_info);
      } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          alert('Customer name must be unique.');
          return;
        }
      }
    }
    setFormData({ name: '', account_no: '', contact_info: '' });
    setIsEditing(false);
    setEditId(null);
    loadCustomers();
  };

  const handleEdit = (c) => {
    setFormData({ name: c.name, account_no: c.account_no || '', contact_info: c.contact_info || '' });
    setEditId(c.id);
    setIsEditing(true);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This will also delete all their purchases and deposits.`)) {
      await window.api.deleteCustomer(id);
      loadCustomers();
    }
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.account_no && c.account_no.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
        <button onClick={() => onNavigate('home')} style={{ background: 'white', border: '1px solid #ccc', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={18} />
        </button>
        <h2 style={{ margin: 0, color: '#1f2937' }}>Manage Customers</h2>
      </div>

      {isEditing ? (
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0 }}>{editId ? 'Edit Customer' : 'Add New Customer'}</h3>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Customer Name *</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                autoFocus
              />
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
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Contact Info</label>
              <input 
                type="text" 
                value={formData.contact_info}
                onChange={e => setFormData({...formData, contact_info: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" style={{ background: '#0078D4', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Save</button>
              <button type="button" onClick={() => { setIsEditing(false); setEditId(null); setFormData({name:'', account_no:'', contact_info:''}); }} style={{ background: '#f3f4f6', color: '#374151', padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: '#9ca3af' }} />
              <input 
                type="text" 
                placeholder="Search by Name or Account No..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
            </div>
            <button 
              onClick={() => setIsEditing(true)}
              style={{ background: '#10b981', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Plus size={18} /> Add Customer
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Customer Name</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Account No</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Contact Info</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Outstanding</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>{c.name}</td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>{c.account_no || '-'}</td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>{c.contact_info || '-'}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: c.outstanding_balance > 0 ? '#dc2626' : (c.outstanding_balance < 0 ? '#16a34a' : '#374151') }}>
                    ₹{c.outstanding_balance.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button onClick={() => handleEdit(c)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', marginRight: '10px' }}><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(c.id, c.name)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No customers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
