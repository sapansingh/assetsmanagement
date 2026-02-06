import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';
import ExcelJS from 'exceljs';

export async function GET(request) {
  let workbook;
  try {
    // Fetch all stock entries
    const sql = `
      SELECT 
        se.*,
        (se.quantity - COALESCE((
          SELECT SUM(si.quantity) 
          FROM stock_issues si 
          WHERE si.stock_entry_id = se.id AND si.status = 'issued'
        ), 0)) as current_stock,
        (se.quantity * se.purchase_price) as total_value
      FROM stock_entries se
      ORDER BY entry_date DESC, product_name
    `;
    
    const stockEntries = await query(sql);
    
    // Create workbook
    workbook = new ExcelJS.Workbook();
    workbook.creator = 'Stock Management System';
    workbook.created = new Date();
    
    // Add main worksheet
    const worksheet = workbook.addWorksheet('Stock Entries');
    
    // Define columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Entry Date', key: 'entry_date', width: 15 },
      { header: 'Product Name', key: 'product_name', width: 30 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Supplier', key: 'supplier', width: 25 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'Purchase Price', key: 'purchase_price', width: 15 },
      { header: 'Selling Price', key: 'selling_price', width: 15 },
      { header: 'Total Value', key: 'total_value', width: 15 },
      { header: 'Current Stock', key: 'current_stock', width: 15 },
      { header: 'Batch Number', key: 'batch_number', width: 20 },
      { header: 'Expiry Date', key: 'expiry_date', width: 15 },
      { header: 'Warehouse', key: 'warehouse', width: 20 },
      { header: 'Rack Number', key: 'rack_number', width: 15 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Bill Attached', key: 'bill_filename', width: 20 },
      { header: 'Prepared By', key: 'prepared_by', width: 20 },
      { header: 'Approved By', key: 'approved_by', width: 20 },
      { header: 'Created At', key: 'created_at', width: 20 }
    ];
    
    // Add data rows
    stockEntries.forEach(entry => {
      const row = worksheet.addRow({
        id: entry.id,
        entry_date: new Date(entry.entry_date).toLocaleDateString(),
        product_name: entry.product_name,
        category: entry.category,
        supplier: entry.supplier,
        quantity: parseFloat(entry.quantity),
        unit: entry.unit,
        purchase_price: parseFloat(entry.purchase_price),
        selling_price: parseFloat(entry.selling_price),
        total_value: parseFloat(entry.total_value || 0),
        current_stock: parseFloat(entry.current_stock || 0),
        batch_number: entry.batch_number || 'N/A',
        expiry_date: entry.expiry_date ? new Date(entry.expiry_date).toLocaleDateString() : 'N/A',
        warehouse: entry.warehouse,
        rack_number: entry.rack_number || 'N/A',
        description: entry.description || 'N/A',
        bill_filename: entry.bill_filename ? 'Yes' : 'No',
        prepared_by: entry.prepared_by,
        approved_by: entry.approved_by,
        created_at: new Date(entry.created_at).toLocaleString()
      });
      
      // Format numbers
      row.getCell('quantity').numFmt = '0.00';
      row.getCell('purchase_price').numFmt = '₹#,##0.00';
      row.getCell('selling_price').numFmt = '₹#,##0.00';
      row.getCell('total_value').numFmt = '₹#,##0.00';
      row.getCell('current_stock').numFmt = '0.00';
    });
    
    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2E7D32' } // Green color
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    
    // Style columns
    ['purchase_price', 'selling_price', 'total_value'].forEach(col => {
      worksheet.getColumn(col).alignment = { horizontal: 'right' };
    });
    
    ['quantity', 'current_stock'].forEach(col => {
      worksheet.getColumn(col).alignment = { horizontal: 'center' };
    });
    
    // Add summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    
    // Summary data
    const totalEntries = stockEntries.length;
    const totalQuantity = stockEntries.reduce((sum, entry) => sum + parseFloat(entry.quantity), 0);
    const totalValue = stockEntries.reduce((sum, entry) => sum + (parseFloat(entry.quantity) * parseFloat(entry.purchase_price)), 0);
    const totalCurrentStock = stockEntries.reduce((sum, entry) => sum + parseFloat(entry.current_stock || 0), 0);
    const categories = [...new Set(stockEntries.map(entry => entry.category))];
    
    // Add summary headers
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 25 },
      { header: 'Value', key: 'value', width: 25 }
    ];
    
    // Add summary data
    summarySheet.addRow({ metric: 'Total Stock Entries', value: totalEntries });
    summarySheet.addRow({ metric: 'Total Quantity', value: totalQuantity.toFixed(2) });
    summarySheet.addRow({ metric: 'Total Purchase Value', value: `₹${totalValue.toFixed(2)}` });
    summarySheet.addRow({ metric: 'Total Current Stock', value: totalCurrentStock.toFixed(2) });
    summarySheet.addRow({ metric: 'Number of Categories', value: categories.length });
    summarySheet.addRow({ metric: 'Report Generated', value: new Date().toLocaleString() });
    
    // Style summary sheet
    const summaryHeader = summarySheet.getRow(1);
    summaryHeader.font = { bold: true, color: { argb: 'FFFFFF' } };
    summaryHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1565C0' } // Blue color
    };
    
    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Create response with Excel file
    const response = new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="stock_entries_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    });
    
    return response;
    
  } catch (error) {
    console.error('Error exporting stock data:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}