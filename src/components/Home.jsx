import React from 'react';
import { ShoppingCart, Download, DollarSign, Users, FileText, History as HistoryIcon } from 'lucide-react';

export default function Home({ onNavigate }) {
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

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '40px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '40px', color: '#1f2937' }}>Dashboard</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <Button label="Purchase Entry" icon={ShoppingCart} color="#3b82f6" onClick={() => onNavigate('purchase-entry')} />
        <Button label="Deposit Entry" icon={Download} color="#10b981" onClick={() => onNavigate('deposit-entry')} />
        <Button label="Expense Entry" icon={DollarSign} color="#f59e0b" onClick={() => onNavigate('expense-entry')} />
        <Button label="Manage Customer" icon={Users} color="#8b5cf6" onClick={() => onNavigate('manage-customer')} />
        <Button label="History" icon={HistoryIcon} color="#64748b" onClick={() => onNavigate('history')} />
        <Button label="Export" icon={FileText} color="#ef4444" onClick={() => onNavigate('export')} />
      </div>
    </div>
  );
}
