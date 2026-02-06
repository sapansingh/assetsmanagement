// app/api/users/route.js
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function getDbConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'asset_management',
    port: process.env.DB_PORT || 3306,
  });
}

export async function GET(request) {
  let connection;
  
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';


    console.log('Search Params:', { page, limit, search, role });
    
    const offset = (page - 1) * limit;
    
    connection = await getDbConnection();
    
    // Build WHERE clause
    let whereClause = '';
    const params = [];
    
    if (search || role) {
      const conditions = [];
      
      if (search) {
        conditions.push('(username LIKE ? OR full_name LIKE ? OR email LIKE ?)');
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      if (role) {
        conditions.push('role = ?');
        params.push(role);
      }
      
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const [countResult] = await connection.execute(countQuery, params);
    const total = countResult[0].total;
    
    // Get paginated users (excluding password)
    const userQuery = `
      SELECT 
        id, 
        username, 
        full_name, 
        email, 
        role, 
        created_at, 
        updated_at,
        CASE 
          WHEN DATEDIFF(NOW(), created_at) <= 7 THEN 'New'
          ELSE 'Active'
        END as status
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    // const queryParams = [...params, limit, offset];
    const [users] = await connection.execute(userQuery);
    
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

export async function POST(request) {
  let connection;
  
  try {
    const userData = await request.json();
    const { username, full_name, email, role = 'staff', password } = userData;
    
    // Validate required fields
    if (!username || !full_name || !email || !password) {
      return NextResponse.json({
        success: false,
        message: 'All fields are required'
      }, { status: 400 });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email format'
      }, { status: 400 });
    }
    
    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        message: 'Password must be at least 6 characters long'
      }, { status: 400 });
    }
    
    connection = await getDbConnection();
    
    // Check if username or email already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existingUsers.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Username or email already exists'
      }, { status: 400 });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    const [result] = await connection.execute(
      `INSERT INTO users (username, full_name, email, role, passworrd) 
       VALUES (?, ?, ?, ?, ?)`,
      [username, full_name, email, role, hashedPassword]
    );
    
    // Get created user (excluding password)
    const [createdUser] = await connection.execute(
      'SELECT id, username, full_name, email, role, created_at FROM users WHERE id = ?',
      [result.insertId]
    );
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: createdUser[0]
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}