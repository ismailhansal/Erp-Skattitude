import { Devis, Facture, Client } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-MA', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' MAD';
};

// Export to CSV
export const exportToCSV = (data: Record<string, unknown>[], filename: string, headers: { key: string; label: string }[]) => {
  const csvHeaders = headers.map(h => h.label).join(';');
  
  const csvRows = data.map(row => {
    return headers.map(h => {
      const value = row[h.key];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(';')) {
        return `"${value}"`;
      }
      return String(value);
    }).join(';');
  });

  const csvContent = [csvHeaders, ...csvRows].join('\n');
  
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

// Export Factures to CSV
export const exportFacturesToCSV = (factures: Facture[], getClientById: (id: string) => Client | undefined) => {
  const data = factures.map(f => {
    const client = getClientById(f.clientId);
    return {
      numero: f.numero,
      client: client?.societe || '',
      ice: client?.ice || '',
      dateFacturation: format(f.dateFacturation, 'dd/MM/yyyy', { locale: fr }),
      dateEcheance: format(f.dateEcheance, 'dd/MM/yyyy', { locale: fr }),
      sousTotal: formatCurrency(f.sousTotal),
      tva: formatCurrency(f.montantTva),
      totalTTC: formatCurrency(f.totalTTC),
      statut: f.estPayee ? 'Payée' : 'Impayée',
      conditionReglement: f.conditionReglement,
    };
  });

  const headers = [
    { key: 'numero', label: 'N° Facture' },
    { key: 'client', label: 'Client' },
    { key: 'ice', label: 'ICE' },
    { key: 'dateFacturation', label: 'Date facturation' },
    { key: 'dateEcheance', label: 'Date échéance' },
    { key: 'sousTotal', label: 'Sous-total HT' },
    { key: 'tva', label: 'TVA' },
    { key: 'totalTTC', label: 'Total TTC' },
    { key: 'statut', label: 'Statut' },
    { key: 'conditionReglement', label: 'Condition règlement' },
  ];

  exportToCSV(data, 'factures', headers);
};

// Export Devis to CSV
export const exportDevisToCSV = (devis: Devis[], getClientById: (id: string) => Client | undefined) => {
  const data = devis.map(d => {
    const client = getClientById(d.clientId);
    return {
      numero: d.numero,
      client: client?.societe || '',
      dateCreation: format(d.dateCreation, 'dd/MM/yyyy', { locale: fr }),
      dateEvenement: format(d.dateEvenement, 'dd/MM/yyyy', { locale: fr }),
      sousTotal: formatCurrency(d.sousTotal),
      tva: formatCurrency(d.montantTva),
      totalTTC: formatCurrency(d.totalTTC),
      statut: d.estFacture ? 'Facturé' : 'En attente',
      conditionReglement: d.conditionReglement,
      bonCommande: d.bonCommande || '',
    };
  });

  const headers = [
    { key: 'numero', label: 'N° Devis' },
    { key: 'client', label: 'Client' },
    { key: 'dateCreation', label: 'Date création' },
    { key: 'dateEvenement', label: 'Date événement' },
    { key: 'sousTotal', label: 'Sous-total HT' },
    { key: 'tva', label: 'TVA' },
    { key: 'totalTTC', label: 'Total TTC' },
    { key: 'statut', label: 'Statut' },
    { key: 'conditionReglement', label: 'Condition règlement' },
    { key: 'bonCommande', label: 'Bon commande' },
  ];

  exportToCSV(data, 'devis', headers);
};

// Export Clients to CSV
export const exportClientsToCSV = (clients: Client[]) => {
  const data = clients.map(c => ({
    societe: c.societe,
    adresse: c.adresse,
    codePostal: c.codePostal,
    ville: c.ville,
    pays: c.pays,
    ice: c.ice,
    telephone: c.telephone,
    email: c.email,
  }));

  const headers = [
    { key: 'societe', label: 'Société' },
    { key: 'adresse', label: 'Adresse' },
    { key: 'codePostal', label: 'Code postal' },
    { key: 'ville', label: 'Ville' },
    { key: 'pays', label: 'Pays' },
    { key: 'ice', label: 'ICE' },
    { key: 'telephone', label: 'Téléphone' },
    { key: 'email', label: 'Email' },
  ];

  exportToCSV(data, 'clients', headers);
};

// Generate PDF content (opens print dialog)
export const exportToPDF = (elementId: string, title: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    // Fallback: open print dialog for current view
    window.print();
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px;
            color: #1a1a1a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
          }
          th {
            background-color: #f5f5f5;
            font-weight: 600;
          }
          h1 {
            color: #a06565;
            margin-bottom: 20px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .date {
            color: #666;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <span class="date">Exporté le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}</span>
        </div>
        ${element.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
};

// Generate printable table HTML for PDF export
export const generatePrintableTable = <T extends Record<string, unknown>>(
  data: T[],
  columns: { key: string; header: string; format?: (value: unknown) => string }[]
): string => {
  const headerRow = columns.map(col => `<th>${col.header}</th>`).join('');
  
  const bodyRows = data.map(row => {
    const cells = columns.map(col => {
      const value = row[col.key];
      const formatted = col.format ? col.format(value) : String(value ?? '');
      return `<td>${formatted}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  return `
    <table>
      <thead><tr>${headerRow}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
  `;
};

// Quick PDF export for lists
export const quickPDFExport = (title: string, tableHTML: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px;
            color: #1a1a1a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
            font-size: 12px;
          }
          th {
            background-color: #a06565;
            color: white;
            font-weight: 600;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          h1 {
            color: #a06565;
            margin-bottom: 20px;
            font-size: 24px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #a06565;
            padding-bottom: 15px;
          }
          .date {
            color: #666;
            font-size: 14px;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <span class="date">Exporté le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}</span>
        </div>
        ${tableHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
};
