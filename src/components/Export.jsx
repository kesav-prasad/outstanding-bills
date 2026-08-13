import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function Export({ onNavigate }) {
  const [exportType, setExportType] = useState('All');
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [lastData, setLastData] = useState(null);

  useEffect(() => {
    window.api.getCustomers().then(setCustomers);
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    // from YYYY-MM-DD to DD.MM.YY
    return `${parts[2]}.${parts[1]}.${parts[0].slice(-2)}`;
  };

  const validate = () => {
    if (exportType === 'Customer Wise' && !customerId) {
      setErrorMsg('Please select a customer.');
      return false;
    }
    if (exportType === 'Date Wise' && (!startDate || !endDate)) {
      setErrorMsg('Please select both start and end dates.');
      return false;
    }
    if (exportType === 'Date Wise' && new Date(startDate) > new Date(endDate)) {
      setErrorMsg('Start date cannot be after end date.');
      return false;
    }
    return true;
  };

  const handleExport = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLastData(null);
    
    if (!validate()) return;
    setIsExporting(true);
    
    try {
      const cid = (exportType === 'Customer Wise' && customerId) ? customerId : null;
      const sd = (exportType === 'Date Wise' && startDate) ? startDate : null;
      const ed = (exportType === 'Date Wise' && endDate) ? endDate : null;
      
      const ledgerData = await window.api.getLedger(cid, sd, ed);
      
      if (!ledgerData || ledgerData.length === 0) {
        setErrorMsg('No records found for the selected filters.');
        setIsExporting(false);
        return;
      }
      
      setLastData(ledgerData); // Save for fallback
      await attemptPDFGeneration(ledgerData);

    } catch (err) {
      console.error(err);
      setErrorMsg(`Database Error: ${err.message}`);
    }
    setIsExporting(false);
  };

  const prepareTableData = (data, type) => {
    let subtitle = 'Filter: All Records';
    if (type === 'Customer Wise' && customerId) {
       const c = customers.find(x => x.id.toString() === customerId);
       subtitle = `Customer: ${c ? c.name : 'Unknown'}`;
    } else if (type === 'Date Wise') {
       subtitle = `Date Range: ${formatDate(startDate)} to ${formatDate(endDate)}`;
    }

    const tableColumn = ["Date", "Type", "Customer Name", "Details", "Purchase (Rs)", "Deposit (Rs)", "Outstanding (Rs)"];
    const tableRows = data.map(row => [
      formatDate(row.date),
      row.type,
      row.customer_name,
      row.description || '-',
      row.purchase_amount ? row.purchase_amount.toFixed(2) : '',
      row.deposit_amount ? row.deposit_amount.toFixed(2) : '',
      row.outstanding.toFixed(2)
    ]);

    return { subtitle, tableColumn, tableRows };
  };

  const attemptPDFGeneration = async (data) => {
    try {
      const { subtitle, tableColumn, tableRows } = prepareTableData(data, exportType);
      const doc = new jsPDF('landscape');
      
      doc.setFontSize(18);
      doc.text('Outstanding Ledger Statement', 14, 20);
      doc.setFontSize(12);
      doc.text(subtitle, 14, 28);

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [0, 120, 212] },
        columnStyles: {
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right', fontStyle: 'bold' }
        }
      });

      const pdfBuffer = doc.output('arraybuffer');
      const fileName = `Statement_${exportType.replace(' ', '')}_${new Date().getTime()}.pdf`;
      
      const result = await window.api.saveAndOpenFile(pdfBuffer, fileName);
      if (result && result.success) {
        setSuccessMsg(`PDF successfully saved to: ${result.path}`);
      } else if (result && !result.success && result.error !== 'Cancelled by user') {
        throw new Error(result.error);
      }
    } catch (pdfErr) {
      console.error("PDF Generation Failed:", pdfErr);
      setErrorMsg(`PDF Generation Failed: ${pdfErr.message}. You can try exporting to Excel instead.`);
    }
  };

  const handleExcelFallback = async () => {
    if (!lastData) return;
    setIsExporting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { subtitle, tableColumn, tableRows } = prepareTableData(lastData, exportType);
      
      // Add title and subtitle rows
      const wsData = [
        ['Outstanding Ledger Statement'],
        [subtitle],
        [],
        tableColumn,
        ...tableRows
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ledger");
      
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const fileName = `Statement_${exportType.replace(' ', '')}_${new Date().getTime()}.xlsx`;
      
      const result = await window.api.saveAndOpenFile(excelBuffer, fileName);
      if (result && result.success) {
        setSuccessMsg(`Excel successfully saved to: ${result.path}`);
      } else if (result && !result.success && result.error !== 'Cancelled by user') {
        setErrorMsg(`Excel Generation Failed: ${result.error}`);
      }
    } catch (excelErr) {
      console.error(excelErr);
      setErrorMsg(`Excel Fallback Failed: ${excelErr.message}`);
    }
    setIsExporting(false);
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
        <button onClick={() => onNavigate('home')} style={{ background: 'white', border: '1px solid #ccc', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={18} />
        </button>
        <h2 style={{ margin: 0, color: '#1f2937' }}>Export Ledger</h2>
      </div>

      <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        
        {errorMsg && (
          <div style={{ padding: '15px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Error</div>
              <div>{errorMsg}</div>
              {lastData && errorMsg.includes('PDF Generation Failed') && (
                <button 
                  onClick={handleExcelFallback}
                  style={{ marginTop: '10px', background: '#16a34a', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Export to Excel/CSV Instead
                </button>
              )}
            </div>
          </div>
        )}

        {successMsg && (
          <div style={{ padding: '15px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle size={20} />
            <div style={{ wordBreak: 'break-all' }}>{successMsg}</div>
          </div>
        )}

        <form onSubmit={handleExport} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Export Type</label>
            <div style={{ display: 'flex', gap: '15px' }}>
              {['All', 'Customer Wise', 'Date Wise'].map(type => (
                <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="exportType" 
                    value={type} 
                    checked={exportType === type} 
                    onChange={e => {
                      setExportType(e.target.value);
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }} 
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          {exportType === 'Customer Wise' && (
            <div style={{ padding: '15px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Select Customer *</label>
              <select 
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="">-- Select Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {exportType === 'Date Wise' && (
            <div style={{ padding: '15px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Start Date *</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>End Date *</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </div>
            </div>
          )}

          <button disabled={isExporting} type="submit" style={{ background: '#ef4444', color: 'white', padding: '12px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '10px', opacity: isExporting ? 0.7 : 1 }}>
            {isExporting ? 'Generating...' : <><Download size={20} /> Generate PDF</>}
          </button>
        </form>
      </div>
    </div>
  );
}
