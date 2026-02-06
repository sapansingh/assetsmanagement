// app/api/assets/route.js - CORRECTED VERSION
import { query } from '../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const deviceStatus = searchParams.get('device_status') || '';
    
    const offset = (page - 1) * limit;
    
    console.log('=== API CALL ===');
    console.log('Request params:', { page, limit, search, status, deviceStatus, offset });
    
    // Build WHERE clause and parameters separately
    let whereClause = 'WHERE 1=1';
    const whereParams = [];
    
    if (status && status !== 'all') {
      whereClause += ' AND a.status = ?';
      whereParams.push(status);
    }
    
    if (deviceStatus) {
      whereClause += ' AND a.device_status = ?';
      whereParams.push(deviceStatus);
    }
    
    if (search) {
      whereClause += ` AND (
        a.model_name LIKE ? OR 
        a.vehicle_number LIKE ? OR 
        a.serial_number LIKE ? OR 
        a.imei_number LIKE ? OR 
        a.issued_to LIKE ? OR 
        a.received_from LIKE ? OR
        at.type_name LIKE ? OR
        ab.brand_name LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      // Add 8 search parameters
      for (let i = 0; i < 8; i++) {
        whereParams.push(searchTerm);
      }
    }
    
    console.log('WHERE clause:', whereClause);
    console.log('WHERE params:', whereParams);
    
    // Get total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM assets a
      LEFT JOIN asset_types at ON a.type_id = at.id
      LEFT JOIN asset_brands ab ON a.brand_id = ab.id
      ${whereClause}
    `;
    
    console.log('Count SQL:', countSql);
    const countResult = await query(countSql, whereParams);
    console.log('Count result:', countResult);
    
    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);
    
    console.log('Total records:', total);
    
    // Get paginated data
    const dataSql = `
      SELECT 
        a.*,
        at.type_name,
        ab.brand_name,
        u_prep.full_name as prepared_by_name,
        u_appr.full_name as approved_by_name
      FROM assets a
      LEFT JOIN asset_types at ON a.type_id = at.id
      LEFT JOIN asset_brands ab ON a.brand_id = ab.id
      LEFT JOIN users u_prep ON a.prepared_by = u_prep.id
      LEFT JOIN users u_appr ON a.approved_by = u_appr.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    

    
    // Combine WHERE params with LIMIT/OFFSET params
    // const dataParams = [...whereParams, limit, offset];
        const dataParams = [ limit, offset];

    console.log('Data params:', dataParams);
    
    const assets = await query(dataSql, dataParams);
    console.log('Query returned:', assets.length, 'assets');
    console.log('Assets data:', JSON.stringify(assets, null, 2));
    
    return Response.json({
      success: true,
      data: assets,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      }
    });
    
  } catch (error) {
    console.error('Error fetching assets:', error);
    console.error('Error stack:', error.stack);
    return Response.json(
      { 
        success: false, 
        message: 'Failed to fetch assets',
        error: error.message 
      },
      { status: 500 }
    );
  }
}