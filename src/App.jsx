import { useState } from 'react';
import Home from './components/Home';
import ManageCustomer from './components/ManageCustomer';
import PurchaseEntry from './components/PurchaseEntry';
import DepositEntry from './components/DepositEntry';
import ExpenseEntry from './components/ExpenseEntry';
import Export from './components/Export';
import History from './components/History';
import './index.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={setCurrentPage} />;
      case 'manage-customer':
        return <ManageCustomer onNavigate={setCurrentPage} />;
      case 'purchase-entry':
        return <PurchaseEntry onNavigate={setCurrentPage} />;
      case 'deposit-entry':
        return <DepositEntry onNavigate={setCurrentPage} />;
      case 'expense-entry':
        return <ExpenseEntry onNavigate={setCurrentPage} />;
      case 'history':
        return <History onNavigate={setCurrentPage} />;
      case 'export':
        return <Export onNavigate={setCurrentPage} />;
      default:
        return <Home onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        height: '60px',
        backgroundColor: '#0078D4',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        WebkitAppRegion: 'drag',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Outstanding Bills Tracker</h2>
      </header>
      
      <main style={{ flex: 1, overflow: 'auto', backgroundColor: '#f3f4f6', padding: '20px' }}>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
