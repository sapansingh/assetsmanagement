import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const db = await connectDB();

    const [rows] = await db.execute(
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

    return new Response(bill_pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${bill_filename}"`,
        'Content-Length': bill_pdf.length
      }
    });

  } catch (error) {
    console.error('Error fetching bill:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
