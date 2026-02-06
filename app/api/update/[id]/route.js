// app/api/update/[id]/route.js
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Helper function to get database connection
async function getDbConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'asset_management',
    port: process.env.DB_PORT || 3306,
  });
}

// Helper function to get or create reference
async function getOrCreateReference(connection, table, column, value) {
  if (!value || value.trim() === '') return null;
  
  try {
    // First, try to find existing
    const [rows] = await connection.execute(
      `SELECT id FROM ${table} WHERE ${column} = ?`,
      [value.trim()]
    );
    
    if (rows.length > 0) {
      return rows[0].id;
    }
    
    // If not found, create new
    const [result] = await connection.execute(
      `INSERT INTO ${table} (${column}, created_at) VALUES (?, NOW())`,
      [value.trim()]
    );
    
    return result.insertId;
  } catch (error) {
    console.error(`Error in getOrCreateReference for ${table}:`, error);
    throw error;
  }
}

// Helper function to get or create user
async function getOrCreateUser(connection, name) {
  if (!name || name.trim() === '') return null;
  
  try {
    // First, try to find existing
    const [rows] = await connection.execute(
      `SELECT id FROM users WHERE full_name = ? OR username = ? OR email = ?`,
      [name.trim(), name.trim(), name.trim()]
    );
    
    if (rows.length > 0) {
      return rows[0].id;
    }
    
    // If not found, create new user with minimal info
    const [result] = await connection.execute(
      `INSERT INTO users (full_name, username, email, role, created_at) 
       VALUES (?, ?, ?, 'user', NOW())`,
      [name.trim(), name.trim().toLowerCase().replace(/\s+/g, '.'), `${name.trim().toLowerCase().replace(/\s+/g, '.')}@example.com`]
    );
    
    return result.insertId;
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw error;
  }
}

// Helper function to handle null/undefined values
function getValueOrNull(value, defaultValue = null) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  return value;
}

export async function PUT(request, { params }) {
  let connection;
  
  try {
    // Await the params to get the ID
    const { id } = await params;
    
    console.log('🔄 PUT /api/update/' + id + ' called');
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        success: false,
        message: 'Invalid asset ID'
      }, { status: 400 });
    }
    
    const assetId = parseInt(id);
    
    // Check content type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json({
        success: false,
        message: 'Content-Type must be multipart/form-data for file uploads'
      }, { status: 400 });
    }
    
    // Get form data
    const formData = await request.formData();
    
    // Debug: Log all form data entries
    console.log('📋 Form data entries for update:');
    
    // Extract data properly
    const assetData = {};
    const imageFiles = [];
    let documentFile = null;
    
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  📄 ${key}: File - "${value.name}" (${value.type}, ${value.size} bytes)`);
        
        if (key === 'document') {
          documentFile = value;
        } else if (key === 'images' || key.startsWith('images')) {
          imageFiles.push(value);
        }
      } else {
        console.log(`  📝 ${key}: "${value}"`);
        assetData[key] = value;
      }
    }
    
    console.log('✅ Extracted asset data:', JSON.stringify(assetData, null, 2));
    console.log(`🖼️ New images to upload: ${imageFiles.length} file(s)`);
    console.log(`📄 Document: ${documentFile ? documentFile.name : 'None'}`);
    
    // Validate required fields
    const requiredFields = ['type_name', 'brand_name', 'model_name'];
    const missingFields = [];
    
    for (const field of requiredFields) {
      if (!assetData[field] || assetData[field].trim() === '') {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      }, { status: 400 });
    }
    
    // Connect to database
    connection = await getDbConnection();
    
    // Check if asset exists
    const [assetRows] = await connection.execute(
      `SELECT id FROM assets WHERE id = ?`,
      [assetId]
    );
    
    if (assetRows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Asset not found'
      }, { status: 404 });
    }
    
    // Start transaction
    await connection.beginTransaction();
    
    // Get or update type
    const typeId = await getOrCreateReference(connection, 'asset_types', 'type_name', assetData.type_name);
    if (!typeId) {
      throw new Error('Failed to get or create asset type');
    }
    
    // Get or update brand
    const brandId = await getOrCreateReference(connection, 'asset_brands', 'brand_name', assetData.brand_name);
    if (!brandId) {
      throw new Error('Failed to get or create asset brand');
    }
    
    // Get or create users for prepared_by and approved_by
    const preparedById = await getOrCreateUser(connection, getValueOrNull(assetData.prepared_by, 'sapansingh'));
    const approvedById = await getOrCreateUser(connection, getValueOrNull(assetData.approved_by, 'sapansingh'));
    
    // Handle issue_date and received_date based on status
    let issueDate = null;
    let receivedDate = null;
     
    if (assetData.status === 'Issued') {
      issueDate = getValueOrNull(assetData.issue_date, null);
      receivedDate = null;
    } else if (assetData.status === 'Received') {
      receivedDate = getValueOrNull(assetData.received_date, null);
      issueDate = null;
    } else {
      // For 'In Stock', clear both dates
      issueDate = null;
      receivedDate = null;
    }
    
    // Prepare update values
    const updateValues = [
      typeId,
      brandId,
      getValueOrNull(assetData.model_name, ''),
      getValueOrNull(assetData.status, 'In Stock'),
      getValueOrNull(assetData.vehicleno || assetData.vehicle_number, ''),
      getValueOrNull(assetData.imei_no || assetData.serial_number, ''),
      getValueOrNull(assetData.imei_no || assetData.imei_number, ''),
      getValueOrNull(assetData.ip_address, ''),
      getValueOrNull(assetData.gid, ''),
      getValueOrNull(assetData.issued_to, ''),
      getValueOrNull(assetData.received_from, ''),
      issueDate,
      receivedDate,
      getValueOrNull(assetData.device_status, 'Good'),
      getValueOrNull(assetData.device_remark, ''),
      getValueOrNull(assetData.recovery_name, ''),
      getValueOrNull(assetData.recovery_status, 'Pending'),
      preparedById,
      approvedById,
      getValueOrNull(assetData.mail_date, null),
      getValueOrNull(assetData.replace_device_sn_imei, ''),
      assetId  // WHERE clause parameter
    ];
    
    console.log('🔧 Update values prepared:', JSON.stringify(updateValues, null, 2));
    // Update asset in database
    const [updateResult] = await connection.execute(
      `UPDATE assets SET
        type_id = ?, brand_id = ?, model_name = ?, status = ?,
        vehicle_number = ?, serial_number = ?, imei_number = ?, ip_address = ?, gid = ?,
        issued_to = ?, received_from = ?, issue_date = ?, received_date = ?,
        device_status = ?, device_remark = ?,
        recovery_name = ?, recovery_status = ?,
        prepared_by = ?, approved_by = ?,
        updated_at = NOW(),mail_date=?,replace_device_sn_imei=?
      WHERE id = ?`,
      updateValues
    );
    
    console.log('✅ Asset updated, rows affected:', updateResult.affectedRows);
    
    // Handle image uploads as BLOB (ADD NEW IMAGES - doesn't delete existing ones)
    if (imageFiles.length > 0) {
      console.log(`💾 Saving ${imageFiles.length} new image(s) to database as BLOB...`);
      
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        
        // Check if file is actually an image
        if (!file.type.startsWith('image/')) {
          console.warn(`⚠️ Skipping non-image file: ${file.name}`);
          continue;
        }
        
        // Convert file to buffer for BLOB storage
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Check if this should be primary (only if it's the first new image)
        // Get current primary image count
        const [primaryCheck] = await connection.execute(
          `SELECT COUNT(*) as count FROM asset_images WHERE asset_id = ? AND is_primary = 1`,
          [assetId]
        );
        
        const isPrimary = i === 0 && primaryCheck[0].count === 0;
        
        await connection.execute(
          `INSERT INTO asset_images (
            asset_id, image_data, image_name, image_size, mime_type, is_primary, uploaded_at
          ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [
            assetId,
            buffer, // image_data as BLOB
            file.name,
            file.size,
            file.type,
            isPrimary
          ]
        );
        
        console.log(`  ✅ Image saved as BLOB: ${file.name} (${file.type}, ${file.size} bytes) ${isPrimary ? '[PRIMARY]' : ''}`);
      }
    }
    
    // Handle document upload as BLOB (REPLACE existing document)
    if (documentFile) {
      console.log('📄 Handling document upload...');
      
      // First, delete existing document if any
      await connection.execute(
        `DELETE FROM asset_documents WHERE asset_id = ?`,
        [assetId]
      );
      
      const file = documentFile;
      const fileExt = file.name.split('.').pop().toLowerCase();
      const docType = ['pdf', 'doc', 'docx'].includes(fileExt) ? fileExt : 'other';
      
      // Convert document to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      await connection.execute(
        `INSERT INTO asset_documents (
          asset_id, document_data, document_name, document_type, file_size, uploaded_at
        ) VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          assetId,
          buffer, // document_data as BLOB
          file.name,
          docType,
          file.size
        ]
      );
      
      console.log(`✅ Document saved as BLOB: ${file.name} (${docType}, ${file.size} bytes)`);
    }
    
    // Create audit log entry
    if (preparedById) {
      await connection.execute(
        `INSERT INTO asset_history (asset_id, action_type, changed_by, notes, created_at)
         VALUES (?, 'UPDATE', ?, 'Asset updated via API', NOW())`,
        [assetId, preparedById]
      );
      console.log('📝 Audit log created for update');
    }
    
    // Commit transaction
    await connection.commit();
    console.log('💾 Transaction committed');
    
    // Fetch the updated asset with all details (without BLOB data for performance)
    const [updatedAssetRows] = await connection.execute(
      `SELECT 
        a.*,
        at.type_name,
        ab.brand_name,
        u1.full_name as prepared_by_name,
        u2.full_name as approved_by_name
       FROM assets a
       LEFT JOIN asset_types at ON a.type_id = at.id
       LEFT JOIN asset_brands ab ON a.brand_id = ab.id
       LEFT JOIN users u1 ON a.prepared_by = u1.id
       LEFT JOIN users u2 ON a.approved_by = u2.id
       WHERE a.id = ?`,
      [assetId]
    );
    
    const updatedAsset = updatedAssetRows[0];
    
    // Get images metadata (without BLOB data)
    const [imageRows] = await connection.execute(
      `SELECT id, asset_id, image_name, image_size, mime_type, is_primary, uploaded_at 
       FROM asset_images 
       WHERE asset_id = ? 
       ORDER BY is_primary DESC, uploaded_at DESC`,
      [assetId]
    );
    
    // Get documents metadata (without BLOB data)
    const [documentRows] = await connection.execute(
      `SELECT id, asset_id, document_name, document_type, file_size, uploaded_at
       FROM asset_documents 
       WHERE asset_id = ?`,
      [assetId]
    );
    
    // Format response
    const responseData = {
      ...updatedAsset,
      images: imageRows,
      documents: documentRows
    };
    
    console.log('🎉 Asset successfully updated! ID:', assetId);
    console.log(`📊 Images total: ${imageRows.length}, Documents total: ${documentRows.length}`);
    
    return NextResponse.json({
      success: true,
      message: 'Asset updated successfully',
      data: responseData,
      assetId: assetId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in /api/update/[id]:', error);
    console.error('Stack trace:', error.stack);
    
    // Rollback transaction if connection exists
    if (connection) {
      try {
        await connection.rollback();
        console.log('🔄 Transaction rolled back');
      } catch (rollbackError) {
        console.error('❌ Rollback error:', rollbackError);
      }
    }
    
    return NextResponse.json({
      success: false,
      message: 'Error updating asset',
      error: error.message || 'Unknown error'
    }, { status: 500 });
    
  } finally {
    // Close connection
    if (connection) {
      try {
        await connection.end();
        console.log('🔌 Database connection closed');
      } catch (endError) {
        console.error('❌ Error closing connection:', endError);
      }
    }
  }
}

// Also support POST method for compatibility
export async function POST(request, { params }) {
  return PUT(request, { params });
}