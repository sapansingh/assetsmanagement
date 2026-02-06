// app/api/assets/search/route.js
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    
    const sql = `
      SELECT 
        a.id,
        at.type_name,
        ab.brand_name,
        a.model_name,
        a.status,
        a.vehicle_number,
        a.serial_number,
        a.imei_number,
        a.issued_to,
        a.received_from
      FROM assets a
      LEFT JOIN asset_types at ON a.type_id = at.id
      LEFT JOIN asset_brands ab ON a.brand_id = ab.id
      WHERE 
        at.type_name LIKE ? OR
        ab.brand_name LIKE ? OR
        a.model_name LIKE ? OR
        a.vehicle_number LIKE ? OR
        a.serial_number LIKE ? OR
        a.imei_number LIKE ? OR
        a.issued_to LIKE ? OR
        a.received_from LIKE ?
      LIMIT 20
    `;
    
    const searchTerm = `%${q}%`;
    const params = Array(8).fill(searchTerm);
    
    const results = await query(sql, params);
    
    return Response.json({
      success: true,
      data: results
    });
    
  } catch (error) {
    console.error('Error searching assets:', error);
    return Response.json(
      { success: false, message: 'Failed to search assets' },
      { status: 500 }
    );
  }
}