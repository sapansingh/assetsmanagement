import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';

export async function DELETE(request, { params }) {
  try {
    // Await params in Next.js 16.16
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID is required' },
        { status: 400 }
      );
    }
    
    // First, check if the entry exists
    const checkSql = 'SELECT * FROM stock_entries WHERE id = ?';
    const [existingEntry] = await query(checkSql, [id]);
    
    if (!existingEntry) {
      return NextResponse.json(
        { success: false, message: 'Stock entry not found' },
        { status: 404 }
      );
    }
    
    // Delete the stock entry
    const deleteSql = 'DELETE FROM stock_entries WHERE id = ?';
    await query(deleteSql, [id]);
    
    return NextResponse.json({
      success: true,
      message: 'Stock entry deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting stock entry:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    // Await params in Next.js 16.16
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the entry exists
    const checkSql = 'SELECT * FROM stock_entries WHERE id = ?';
    const [existingEntry] = await query(checkSql, [id]);
    
    if (!existingEntry) {
      return NextResponse.json(
        { success: false, message: 'Stock entry not found' },
        { status: 404 }
      );
    }
    
    const formData = await request.formData();
    
    // Get all form fields with proper null handling
    const entryDate = formData.get('entry_date');
    const productName = formData.get('product_name');
    const category = formData.get('category');
    const supplier = formData.get('supplier');
    const quantity = formData.get('quantity') ? parseFloat(formData.get('quantity')) : null;
    const unit = formData.get('unit');
    const purchasePrice = formData.get('purchase_price') ? parseFloat(formData.get('purchase_price')) : null;
    const sellingPrice = formData.get('selling_price') ? parseFloat(formData.get('selling_price')) : null;
    const expiryDate = formData.get('expiry_date');
    const batchNumber = formData.get('batch_number');
    const warehouse = formData.get('warehouse');
    const rackNumber = formData.get('rack_number');
    const description = formData.get('description');
    const preparedBy = formData.get('prepared_by');
    const approvedBy = formData.get('approved_by');
    
    // Handle PDF file - keep existing if not uploaded
    const billPdf = formData.get('bill_pdf');
    let billFileName = existingEntry.bill_filename;
    let billFileBuffer = existingEntry.bill_pdf;
    let billFileSize = existingEntry.bill_filesize;
    
    if (billPdf && billPdf instanceof File) {
      billFileName = billPdf.name;
      const arrayBuffer = await billPdf.arrayBuffer();
      billFileBuffer = Buffer.from(arrayBuffer);
      billFileSize = billPdf.size;
    }
    
    // If clear_bill flag is present, remove the bill
    const clearBill = formData.get('clear_bill');
    if (clearBill === 'true') {
      billFileName = null;
      billFileBuffer = null;
      billFileSize = null;
    }
    
    // Validate required fields
    if (!entryDate || !productName || !category || !supplier || !quantity || !warehouse) {
      return NextResponse.json(
        { success: false, message: 'Required fields are missing' },
        { status: 400 }
      );
    }
    
    const sql = `
      UPDATE stock_entries 
      SET 
        entry_date = ?, 
        product_name = ?, 
        category = ?, 
        supplier = ?, 
        quantity = ?, 
        unit = ?,
        purchase_price = ?, 
        selling_price = ?, 
        expiry_date = ?, 
        batch_number = ?,
        warehouse = ?, 
        rack_number = ?, 
        description = ?, 
        prepared_by = ?, 
        approved_by = ?,
        bill_filename = ?, 
        bill_pdf = ?, 
        bill_filesize = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    // Prepare parameters with proper null handling
    const paramsArray = [
      entryDate,
      productName,
      category,
      supplier,
      quantity,
      unit,
      purchasePrice,
      sellingPrice,
      expiryDate || null,
      batchNumber || null,
      warehouse,
      rackNumber || null,
      description || null,
      preparedBy || 'sapan singh',
      approvedBy || 'sapan singh',
      billFileName,
      billFileBuffer,
      billFileSize,
      id
    ];
    
    // Debug logging
    console.log('Update params:', paramsArray.map((p, i) => `${i}: ${p !== null ? p : 'NULL'}`));
    
    await query(sql, paramsArray);
    
    return NextResponse.json({
      success: true,
      message: 'Stock entry updated successfully',
      data: { id }
    });
    
  } catch (error) {
    console.error('Error updating stock entry:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// GET single stock entry
export async function GET(request, { params }) {
  try {
    // Await params in Next.js 16.16
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID is required' },
        { status: 400 }
      );
    }
    
    const sql = `
      SELECT 
        se.*,
        (se.quantity - COALESCE((
          SELECT SUM(si.quantity) 
          FROM stock_issues si 
          WHERE si.stock_entry_id = se.id AND si.status = 'issued'
        ), 0)) as current_stock
      FROM stock_entries se
      WHERE se.id = ?
    `;
    
    const [entry] = await query(sql, [id]);
    
    if (!entry) {
      return NextResponse.json(
        { success: false, message: 'Stock entry not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: entry
    });
    
  } catch (error) {
    console.error('Error fetching stock entry:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}