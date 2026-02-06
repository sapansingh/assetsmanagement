import { NextResponse } from 'next/server';
import { query } from '../../lib/db';

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    const entryDate = formData.get('entry_date');
    const productName = formData.get('product_name');
    const category = formData.get('category');
    const supplier = formData.get('supplier');
    const quantity = parseFloat(formData.get('quantity'));
    const unit = formData.get('unit');
    const purchasePrice = parseFloat(formData.get('purchase_price'));
    const sellingPrice = parseFloat(formData.get('selling_price'));
    const expiryDate = formData.get('expiry_date');
    const batchNumber = formData.get('batch_number');
    const warehouse = formData.get('warehouse');
    const rackNumber = formData.get('rack_number');
    const description = formData.get('description');
    const preparedBy = formData.get('prepared_by');
    const approvedBy = formData.get('approved_by');
    
    // Handle PDF file
    const billPdf = formData.get('bill_pdf');
    let billFileName = null;
    let billFileBuffer = null;
    let billFileSize = null;
    
    if (billPdf && billPdf instanceof File) {
      billFileName = billPdf.name;
      const arrayBuffer = await billPdf.arrayBuffer();
      billFileBuffer = Buffer.from(arrayBuffer);
      billFileSize = billPdf.size;
    }
    
    const sql = `
      INSERT INTO stock_entries (
        entry_date, product_name, category, supplier, quantity, unit,
        purchase_price, selling_price, expiry_date, batch_number,
        warehouse, rack_number, description, prepared_by, approved_by,
        bill_filename, bill_pdf, bill_filesize
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      entryDate, productName, category, supplier, quantity, unit,
      purchasePrice, sellingPrice, expiryDate || null, batchNumber || null,
      warehouse, rackNumber || null, description || null, preparedBy, approvedBy,
      billFileName, billFileBuffer, billFileSize
    ];
    
    const result = await query(sql, params);
    
    return NextResponse.json({
      success: true,
      message: 'Stock entry added successfully',
      data: { id: result.insertId }
    });
    
  } catch (error) {
    console.error('Error adding stock entry:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || 'all';
    const warehouse = searchParams.get('warehouse') || 'all';
    
    const offset = (page - 1) * limit;
    
    // Build query with filters
    let whereConditions = ['1=1'];
    let queryParams = [];
    
    if (search) {
      whereConditions.push(`(
        product_name LIKE ? OR 
        category LIKE ? OR 
        supplier LIKE ? OR 
        batch_number LIKE ? OR
        description LIKE ?
      )`);
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (category !== 'all') {
      whereConditions.push('category = ?');
      queryParams.push(category);
    }
    
    if (warehouse !== 'all') {
      whereConditions.push('warehouse = ?');
      queryParams.push(warehouse);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Get stock entries with calculated current stock
    const sql = `
      SELECT 
        se.*,
        (se.quantity - COALESCE((
          SELECT SUM(si.quantity) 
          FROM stock_issues si 
          WHERE si.stock_entry_id = se.id AND si.status = 'issued'
        ), 0)) as current_stock
      FROM stock_entries se
      WHERE ${whereClause}
      ORDER BY entry_date DESC 
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    const allParams = [...queryParams, limit, offset];
    const rows = await query(sql, allParams);
    
    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM stock_entries WHERE ${whereClause}`;
    const countResult = await query(countSql, queryParams);
    const total = countResult[0].total;
    
    return NextResponse.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching stock entries:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}