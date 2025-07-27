import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { transactionService } from './supabase';
import { Transaction } from '../types';

interface ExportData {
  month: string;
  year: number;
  transactions: Transaction[];
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
    transactionCount: number;
  };
}

export const exportService = {
  getMonthlyData: async (userId: string, year: number, month: number): Promise<ExportData> => {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

    const { data: transactions, error } = await transactionService.getTransactions(userId, {
      startDate,
      endDate,
    });

    const monthlyTransactions = (transactions || []) as Transaction[];
    
    const totalIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return {
      month: monthNames[month - 1],
      year,
      transactions: monthlyTransactions,
      summary: {
        totalIncome,
        totalExpenses,
        netAmount: totalIncome - totalExpenses,
        transactionCount: monthlyTransactions.length,
      },
    };
  },

  exportToJSON: async (data: ExportData): Promise<void> => {
    const jsonContent = JSON.stringify(data, null, 2);
    const fileName = `expense_data_${data.year}_${data.month.toLowerCase()}.json`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, jsonContent);
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: `Export ${data.month} ${data.year} Data`,
        UTI: 'public.json',
      });
    }
  },

  exportToPDF: async (data: ExportData): Promise<void> => {
    // Group transactions by category and type
    const categoryGroups = data.transactions.reduce((acc, transaction) => {
      const categoryName = transaction.category?.name || 'Unknown';
      const key = `${categoryName}_${transaction.type}`;
      
      if (!acc[key]) {
        acc[key] = {
          category: categoryName,
          type: transaction.type,
          total: 0,
        };
      }
      acc[key].total += transaction.amount;
      return acc;
    }, {} as Record<string, { category: string; type: 'income' | 'expense'; total: number }>);

    const summaryRows = Object.values(categoryGroups)
      .sort((a, b) => b.total - a.total) // Sort by amount descending
      .map(item => `
        <tr>
          <td style="padding: 12px 8px; border-bottom: 1px solid #ddd; font-weight: 500;">${item.category}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #ddd; text-align: right; font-weight: 600; color: ${item.type === 'income' ? '#10B981' : '#EF4444'};">
            ${item.type === 'income' ? '+' : '-'}${Math.round(item.total).toLocaleString()} THB
          </td>
        </tr>
      `)
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Monthly Report - ${data.month} ${data.year}</title>
          <style>
            body {
              font-family: 'Helvetica', 'Arial', sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #007AFF;
              padding-bottom: 20px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #007AFF;
              margin-bottom: 5px;
            }
            .subtitle {
              font-size: 16px;
              color: #666;
            }
            .summary {
              display: flex;
              justify-content: space-around;
              margin: 30px 0;
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
            }
            .summary-item {
              text-align: center;
            }
            .summary-label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .summary-value {
              font-size: 18px;
              font-weight: bold;
            }
            .income { color: #10B981; }
            .expense { color: #EF4444; }
            .net { color: #007AFF; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background: #007AFF;
              color: white;
              padding: 12px 8px;
              text-align: left;
              font-weight: bold;
            }
            td {
              padding: 8px;
              border-bottom: 1px solid #ddd;
            }
            tr:nth-child(even) {
              background: #f8f9fa;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Monthly Summary Report</div>
            <div class="subtitle">${data.month} ${data.year}</div>
          </div>

          <div class="summary">
            <div class="summary-item">
              <div class="summary-label">Total Income</div>
              <div class="summary-value income">+${Math.round(data.summary.totalIncome).toLocaleString()}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Expenses</div>
              <div class="summary-value expense">-${Math.round(data.summary.totalExpenses).toLocaleString()}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Net Amount</div>
              <div class="summary-value net">${data.summary.netAmount >= 0 ? '+' : ''}${Math.round(data.summary.netAmount).toLocaleString()}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Transactions</div>
              <div class="summary-value">${data.summary.transactionCount}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th style="text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${summaryRows}
            </tbody>
          </table>

          <div class="footer">
            Generated on ${new Date().toLocaleString('en-US')} | Expense Tracker App
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Export ${data.month} ${data.year} Report`,
        UTI: 'com.adobe.pdf',
      });
    }
  },
};