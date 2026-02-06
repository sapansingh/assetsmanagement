import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

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
    // Parse URL manually to extract assetId and docId
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    console.log('📄 Document request for:', pathname);
    
    // Extract IDs from /api/11/documents/5
    const pathParts = pathname.split('/').filter(Boolean);
    console.log('📄 Path parts:', pathParts);
    
    // Expected: ['api', '11', 'documents', '5']
    if (pathParts.length < 4) {
      console.error('❌ Invalid URL format. Expected: /api/{assetId}/documents/{docId}');
      return new Response('Invalid URL format. Use: /api/11/documents/5', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    const assetIdStr = pathParts[1]; // Should be '11'
    const docIdStr = pathParts[3]; // Should be '5'
    
    console.log('✅ Extracted IDs:', {
      assetId: assetIdStr,
      docId: docIdStr
    });
    
    // Parse IDs as integers
    const assetId = parseInt(assetIdStr);
    const docId = parseInt(docIdStr);
    
    if (isNaN(assetId) || isNaN(docId)) {
      console.error(`❌ Invalid ID format: assetId="${assetIdStr}", docId="${docIdStr}"`);
      return new Response('Invalid ID format', { status: 400 });
    }
    
    console.log(`✅ Parsed: assetId=${assetId}, docId=${docId}`);
    
    connection = await getDbConnection();
    
    const [rows] = await connection.execute(
      `SELECT document_data, document_name, document_type FROM asset_documents 
       WHERE id = ? AND asset_id = ?`,
      [docId, assetId]
    );
    
    if (rows.length === 0) {
      console.log(`❌ Document not found: asset_id=${assetId}, doc_id=${docId}`);
      return new Response('Document not found', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    const document = rows[0];
    console.log(`✅ Document found: ${document.document_name} (${document.document_type})`);
    
    // Enhanced content type mapping
    const contentTypeMap = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'csv': 'text/csv',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed'
    };
    
    // Get file extension from document_type or document_name
    let fileExt = document.document_type?.toLowerCase();
    if (!fileExt && document.document_name) {
      const nameParts = document.document_name.split('.');
      if (nameParts.length > 1) {
        fileExt = nameParts.pop().toLowerCase();
      }
    }
    
    const contentType = fileExt ? 
      (contentTypeMap[fileExt] || 'application/octet-stream') : 
      'application/octet-stream';
    
    // Decide whether to display inline or force download
    const isInline = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt'].includes(fileExt);
    const contentDisposition = isInline ? 
      `inline; filename="${document.document_name}"` : 
      `attachment; filename="${document.document_name}"`;
    
    return new Response(document.document_data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Content-Length': document.document_data?.length?.toString() || '0',
        'Cache-Control': 'public, max-age=86400',
        'X-Asset-ID': assetId.toString(),
        'X-Document-ID': docId.toString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching document:', error);
    return new Response('Error fetching document', { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
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