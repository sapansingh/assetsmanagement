// lib/db.js
import mysql from 'mysql2/promise';

let connection = null;

export async function connectDB() {
  if (connection) return connection;
  
  connection = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'asset_management',
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  
  return connection;
}

// Helper function for single queries
export async function query(sql, params) {
  const db = await connectDB();
  const [results] = await db.execute(sql, params);
  return results;
}