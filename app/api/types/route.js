// app/api/assets/types/route.js
import { query } from '../../lib/db';

export async function GET() {
  try {
    const sql = `SELECT * FROM asset_types ORDER BY type_name`;
    const types = await query(sql);
    
    return Response.json({
      success: true,
      data: types
    });
    
  } catch (error) {
    console.error('Error fetching types:', error);
    return Response.json(
      { success: false, message: 'Failed to fetch types' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    const sql = `INSERT INTO asset_types (type_name, description) VALUES (?, ?)`;
    await query(sql, [data.type_name, data.description]);
    
    return Response.json({
      success: true,
      message: 'Type created successfully'
    });
    
  } catch (error) {
    console.error('Error creating type:', error);
    return Response.json(
      { success: false, message: 'Failed to create type' },
      { status: 500 }
    );
  }
}