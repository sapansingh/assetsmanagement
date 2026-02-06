// app/api/users/[id]/route.js
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

export async function GET(request, { params }) {
  let connection;
  
  try {
    const { id } = await params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        success: false,
        message: 'Invalid user ID'
      }, { status: 400 });
    }
    
    connection = await getDbConnection();
    
    const [users] = await connection.execute(
      'SELECT id, username, full_name, email, role, created_at, updated_at FROM users WHERE id = ?',
      [parseInt(id)]
    );
    
    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: users[0]
    });
    
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

export async function PUT(request, { params }) {
  let connection;
  
  try {
    const { id } = await params;
    const userData = await request.json();
    const { username, full_name, email, role, password } = userData;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        success: false,
        message: 'Invalid user ID'
      }, { status: 400 });
    }
    
    // Validate required fields
    if (!username || !full_name || !email) {
      return NextResponse.json({
        success: false,
        message: 'Username, full name, and email are required'
      }, { status: 400 });
    }
    
    connection = await getDbConnection();
    
    // Check if user exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE id = ?',
      [parseInt(id)]
    );
    
    if (existingUsers.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    // Check if new username or email already exists (excluding current user)
    const [duplicateCheck] = await connection.execute(
      'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
      [username, email, parseInt(id)]
    );
    
    if (duplicateCheck.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Username or email already exists'
      }, { status: 400 });
    }
    
    // Prepare update data
    let updateQuery = 'UPDATE users SET username = ?, full_name = ?, email = ?, role = ?';
    const updateParams = [username, full_name, email, role];
    
    // Add password update if provided
    if (password) {
      if (password.length < 6) {
        return NextResponse.json({
          success: false,
          message: 'Password must be at least 6 characters long'
        }, { status: 400 });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ', passworrd = ?';
      updateParams.push(hashedPassword);
    }
    
    updateQuery += ', updated_at = NOW() WHERE id = ?';
    updateParams.push(parseInt(id));
    
    await connection.execute(updateQuery, updateParams);
    
    // Get updated user
    const [updatedUsers] = await connection.execute(
      'SELECT id, username, full_name, email, role, created_at, updated_at FROM users WHERE id = ?',
      [parseInt(id)]
    );
    
    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUsers[0]
    });
    
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

export async function DELETE(request, { params }) {
  let connection;
  
  try {
    const { id } = await params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        success: false,
        message: 'Invalid user ID'
      }, { status: 400 });
    }
    
    connection = await getDbConnection();
    
    // Check if user exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE id = ?',
      [parseInt(id)]
    );
    
    if (existingUsers.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    // Delete user
    await connection.execute(
      'DELETE FROM users WHERE id = ?',
      [parseInt(id)]
    );
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}