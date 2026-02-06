import { NextResponse } from 'next/server';
import { pool, connectToDatabase } from '../../../../lib/db';

export async function GET(request, { params }) {
  let connection;
  try {
    const { id } = params;
    
    connection = await connectToDatabase();
    
    const [rows] = await connection.execute(
      'SELECT bill_filename, bill_pdf FROM stock_entries WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0 || !rows[0].bill_pdf) {
      return NextResponse.json(
        { success: false, message: 'Bill not found' },
        { status: 404 }
      );
    }
    
    const { bill_filename, bill_pdf } = rows[0];
    
    // Return PDF file
    return new Response(bill_pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${bill_filename}"`,
        'Content-Length': Buffer.byteLength(bill_pdf)
      }
    });
    
  } catch (error) {
    console.error('Error fetching bill:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}