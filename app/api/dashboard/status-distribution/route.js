// app/api/dashboard/status-distribution/route.js
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
    
    // Group assets by status
    const [statusDistribution] = await connection.execute(`
      SELECT 
        COALESCE(status, 'Unknown') as status,
        COUNT(*) as count
      FROM assets
      GROUP BY status
      ORDER BY count DESC
    `);
    
    // If no data, return default distribution
    if (!statusDistribution || statusDistribution.length === 0) {
      return NextResponse.json({
        success: true,
        data: [
          { status: 'In Stock', count: 0 },
          { status: 'Issued', count: 0 },
          { status: 'Received', count: 0 }
        ]
      });
    }
    
    return NextResponse.json({
      success: true,
      data: statusDistribution
    });
    
  } catch (error) {
    console.error('Error fetching status distribution:', error);
    return NextResponse.json({
      success: true,
      data: [
        { status: 'In Stock', count: 0 },
        { status: 'Issued', count: 0 },
        { status: 'Received', count: 0 }
      ]
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}