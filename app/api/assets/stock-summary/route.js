// app/api/assets/stock-summary/route.js
import { query } from '../../../lib/db';

export async function GET() {
  try {
    const sql = `
      SELECT 
        at.type_name,
        ab.brand_name,
        a.model_name,
        SUM(CASE WHEN a.status = 'Issued' THEN 1 ELSE 0 END) as issued_count,
        SUM(CASE WHEN a.status = 'Received' THEN 1 ELSE 0 END) as received_count,
        SUM(CASE WHEN a.status = 'In Stock' THEN 1 ELSE 0 END) as in_stock_count,
        COUNT(*) as total_count
      FROM assets a
      LEFT JOIN asset_types at ON a.type_id = at.id
      LEFT JOIN asset_brands ab ON a.brand_id = ab.id
      GROUP BY at.type_name, ab.brand_name, a.model_name
      ORDER BY at.type_name, ab.brand_name, a.model_name
    `;
    
    const results = await query(sql);
    
    return Response.json({
      success: true,
      data: results
    });
    
  } catch (error) {
    console.error('Error fetching stock summary:', error);
    return Response.json(
      { success: false, message: 'Failed to fetch stock summary' },
      { status: 500 }
    );
  }
}