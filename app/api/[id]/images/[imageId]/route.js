import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Database connection
async function getDbConnection() {
  return await mysql.createConnection({
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
    // METHOD 1: Parse URL manually (most reliable)
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    console.log('🔍 Full URL:', request.url);
    console.log('🔍 Pathname:', pathname);
    
    // Extract IDs from /api/11/images/5
    const pathParts = pathname.split('/').filter(Boolean);
    console.log('🔍 Path parts:', pathParts);
    
    // Expected: ['api', '11', 'images', '5']
    if (pathParts.length < 4) {
      console.error('❌ Invalid URL format. Expected: /api/{assetId}/images/{imageId}');
      console.error('❌ Received:', pathname);
      
      return new Response('Invalid URL format. Use: /api/11/images/5', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    const assetIdStr = pathParts[1]; // Should be '11'
    const imageIdStr = pathParts[3]; // Should be '5'
    
    console.log('✅ Extracted IDs:', {
      assetIdFromURL: assetIdStr,
      imageIdFromURL: imageIdStr
    });
    
    // Parse IDs as integers
    const assetId = parseInt(assetIdStr);
    const imageId = parseInt(imageIdStr);
    
    if (isNaN(assetId) || isNaN(imageId)) {
      console.error(`❌ Invalid ID format: assetId="${assetIdStr}", imageId="${imageIdStr}"`);
      
      const errorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
        <rect width="200" height="200" fill="#fee2e2"/>
        <text x="100" y="100" font-family="Arial" font-size="14" fill="#dc2626" text-anchor="middle">
          Invalid IDs
        </text>
        <text x="100" y="120" font-family="Arial" font-size="10" fill="#dc2626" text-anchor="middle">
          Asset: ${assetIdStr}, Image: ${imageIdStr}
        </text>
      </svg>`;
      
      return new Response(errorSvg, {
        status: 400,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache'
        }
      });
    }
    
    console.log(`✅ Parsed: assetId=${assetId}, imageId=${imageId}`);
    
    // METHOD 2: Also try Next.js params (if available)
    try {
      // This is for Next.js 13+ App Router dynamic params
      // It might work depending on your folder structure
      const { params } = await request.nextUrl;
      if (params) {
        console.log('Next.js params:', params);
      }
    } catch (e) {
      // Ignore if not available
    }
    
    connection = await getDbConnection();
    
    // Query to get image data
    const [rows] = await connection.execute(
      `SELECT image_data, mime_type, image_name FROM asset_images 
       WHERE id = ? AND asset_id = ?`,
      [imageId, assetId]
    );
    
    if (rows.length === 0) {
      console.log(`📭 Image not found in DB: asset_id=${assetId}, image_id=${imageId}`);
      
      // Return a placeholder image
      const placeholder = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
        <rect width="200" height="200" fill="#f1f5f9"/>
        <circle cx="100" cy="80" r="40" fill="#cbd5e1"/>
        <text x="100" y="150" font-family="Arial" font-size="12" fill="#64748b" text-anchor="middle">
          Asset: ${assetId}
        </text>
        <text x="100" y="170" font-family="Arial" font-size="12" fill="#64748b" text-anchor="middle">
          Image: ${imageId}
        </text>
      </svg>`;
      
      return new Response(placeholder, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }
    
    const image = rows[0];
    console.log(`✅ Image found: ${image.image_name} (${image.mime_type})`);
    
    // Check if image_data exists
    if (!image.image_data) {
      console.log('⚠️ Image data is null or empty');
      
      const placeholder = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
        <rect width="200" height="200" fill="#f1f5f9"/>
        <text x="100" y="110" font-family="Arial" font-size="14" fill="#64748b" text-anchor="middle">
          ${image.image_name || 'Empty'}
        </text>
      </svg>`;
      
      return new Response(placeholder, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }
    
    // Return image as response
    return new Response(image.image_data, {
      status: 200,
      headers: {
        'Content-Type': image.mime_type || 'image/jpeg',
        'Content-Disposition': `inline; filename="${image.image_name || 'image'}"`,
        'Cache-Control': 'public, max-age=86400'
      }
    });
    
  } catch (error) {
    console.error('❌ Server Error:', error);
    
    const errorImage = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
      <rect width="200" height="200" fill="#fee2e2"/>
      <text x="100" y="110" font-family="Arial" font-size="14" fill="#dc2626" text-anchor="middle">
        Server Error
      </text>
    </svg>`;
    
    return new Response(errorImage, {
      status: 500,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache'
      }
    });
    
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (endError) {
        console.error('Error closing connection:', endError);
      }
    }
  }
}