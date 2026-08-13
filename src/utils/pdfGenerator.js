import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateInvoicePDF = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Temporarily add a class to body to simulate print media CSS
      document.body.classList.add('pdf-exporting');
      
      const noPrintElements = document.querySelectorAll('.no-print');
      noPrintElements.forEach(el => {
        el.dataset.originalDisplay = el.style.display;
        el.style.display = 'none';
      });
      
      const allTables = document.querySelectorAll('.invoice-container');
      const tables = Array.from(allTables).filter(t => t.offsetParent !== null);
      if (tables.length === 0) {
        document.body.classList.remove('pdf-exporting');
        noPrintElements.forEach(el => {
          el.style.display = el.dataset.originalDisplay || '';
        });
        return reject(new Error("No tables found"));
      }

      // Wait a tiny bit for CSS changes to apply
      await new Promise(res => setTimeout(res, 300));

      let yOffset = 5; // Starting top margin
      const targetWidth = 190; // 190mm width (leaving 10mm margin on each side of 210mm A4)
      const xOffset = (pdfWidth - targetWidth) / 2;

      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        
        const canvas = await html2canvas(table, {
          scale: 4, // Ultra High Quality
          useCORS: true,
          logging: false,
          windowWidth: table.scrollWidth,
          windowHeight: table.scrollHeight
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        const ratio = canvas.width / canvas.height;
        const calcHeight = targetWidth / ratio;
        
        // If the table doesn't fit on the current page, add a new page!
        if (yOffset + calcHeight > pdfHeight - 5) {
          if (i > 0) pdf.addPage(); // Don't add a new page if it's the very first table and it's just massive
          yOffset = 5;
        }
        
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, targetWidth, calcHeight);
        yOffset += calcHeight + 2; // 2mm gap between tables
      }
      
      document.body.classList.remove('pdf-exporting');
      noPrintElements.forEach(el => {
        el.style.display = el.dataset.originalDisplay || '';
      });
      
      const arrayBuffer = pdf.output('arraybuffer');
      resolve(arrayBuffer);
      
    } catch (error) {
      document.body.classList.remove('pdf-exporting');
      reject(error);
    }
  });
};
