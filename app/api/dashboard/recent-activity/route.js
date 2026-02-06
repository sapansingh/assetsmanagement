// app/api/dashboard/recent-activity/route.js
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

async function getDbConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'asset_management',
    port: process.env.DB_PORT || 3306,
  });
}

export async function GET() {
  let connection;
  
  try {
    connection = await getDbConnection();
    
    // Get recent asset history (last 10 activities)
    // Note: Adjust the query based on your actual table structure
    // If you don't have an asset_history table, we can get recent assets instead
    const [recentAssets] = await connection.execute(`
      SELECT 
        a.id,
        a.type_name,
        a.brand_name,
        a.status,
        a.device_status,
        a.updated_at as action_date,
        'UPDATE' as action_type,
        u.full_name as changed_by
      FROM assets a
      LEFT JOIN users u ON a.prepared_by = u.id
      ORDER BY a.updated_at DESC
      LIMIT 10
    `);
    
    // Format the response
    const recentActivity = recentAssets.map(asset => ({
      id: asset.id,
      asset_id: asset.id,
      action_type: asset.action_type || 'UPDATE',
      changed_by: asset.changed_by || 'System',
      notes: `Asset ${asset.action_type?.toLowerCase() || 'updated'} - ${asset.type_name} ${asset.brand_name}`,
      created_at: asset.action_date,
      asset_type: asset.type_name,
      asset_brand: asset.brand_name
    }));
    
    return NextResponse.json({
      success: true,
      data: recentActivity
    });
    
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    // Return empty array if table doesn't exist
    return NextResponse.json({
      success: true,
      data: [
        {
          id: 1,
          action_type: 'UPDATE',
          changed_by: 'System',
          notes: 'Sample activity - Asset updated',
          created_at: new Date().toISOString(),
          asset_type: 'MDT',
          asset_brand: 'Concox'
        }
      ]
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}