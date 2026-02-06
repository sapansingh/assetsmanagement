// app/api/assets/brands/route.js
import { query } from '../../lib/db';

export async function GET() {
  try {
    const sql = `SELECT * FROM asset_brands ORDER BY brand_name`;
    const brands = await query(sql);
    
    return Response.json({
      success: true,
      data: brands
    });
    
  } catch (error) {
    console.error('Error fetching brands:', error);
    return Response.json(
      { success: false, message: 'Failed to fetch brands' },
      { status: 500 }
    );
  }
}