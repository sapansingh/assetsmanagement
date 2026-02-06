// app/api/dashboard/stats/route.js
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
    
    // Get total assets count
    const [totalResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM assets'
    );
    const totalAssets = totalResult[0]?.total || 0;
    
    // Get assets by status
    const [issuedResult] = await connection.execute(
      "SELECT COUNT(*) as count FROM assets WHERE status = 'Issued'"
    );
    const issuedAssets = issuedResult[0]?.count || 0;
    
    const [receivedResult] = await connection.execute(
      "SELECT COUNT(*) as count FROM assets WHERE status = 'Received'"
    );
    const receivedAssets = receivedResult[0]?.count || 0;
    
    const [inStockResult] = await connection.execute(
      "SELECT COUNT(*) as count FROM assets WHERE status = 'In Stock'"
    );
    const inStockAssets = inStockResult[0]?.count || 0;
    
    // Get device status counts
    const [activeResult] = await connection.execute(
      "SELECT COUNT(*) as count FROM assets WHERE device_status = 'Active'"
    );
    const active = activeResult[0]?.count || 0;
    
    const [goodResult] = await connection.execute(
      "SELECT COUNT(*) as count FROM assets WHERE device_status = 'Good'"
    );
    const good = goodResult[0]?.count || 0;
    
    const [faultyResult] = await connection.execute(
      "SELECT COUNT(*) as count FROM assets WHERE device_status = 'Faulty'"
    );
    const faulty = faultyResult[0]?.count || 0;
    
    const [damagedResult] = await connection.execute(
      "SELECT COUNT(*) as count FROM assets WHERE device_status = 'Damaged'"
    );
    const damaged = damagedResult[0]?.count || 0;
    
    const deviceStats = { active, good, faulty, damaged };
    
    return NextResponse.json({
      success: true,
      data: {
        totalAssets,
        issuedAssets,
        receivedAssets,
        inStockAssets,
        deviceStats
      }
    });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message
    }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}