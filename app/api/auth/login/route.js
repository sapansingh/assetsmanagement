// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';

const JWT_SECRET = process.env.JWT_SECRET || 'assetflow-secret-key-2024';

// Database connection
async function getConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'your_database',
  });
}

export async function POST(request) {
  let connection;
  
  try {
    const { username, password, rememberMe } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Username and password are required' 
        },
        { status: 400 }
      );
    }

    // Connect to database
    connection = await getConnection();
    
    // Query user from your table (note: column name is 'passworrd' with typo)
    const [users] = await connection.execute(
      `SELECT id, username, full_name, email, role, passworrd 
       FROM users 
       WHERE username = ? OR email = ?`,
      [username, username]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid username or password' 
        },
        { status: 401 }
      );
    }

    const user = users[0];

    // Check if password hash exists
    if (!user.passworrd) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Account not properly configured. Please contact administrator.' 
        },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passworrd);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid username or password' 
        },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.full_name
      },
      JWT_SECRET,
      { expiresIn: rememberMe ? '7d' : '24h' }
    );

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        role: user.role
      },
      token
    }, { status: 200 });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}