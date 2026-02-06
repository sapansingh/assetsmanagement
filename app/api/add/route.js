// app/api/assets/add/route.js
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

// Helper function to get or create type/brand
async function getOrCreateReference(connection, tableName, fieldName, value) {
  if (!value) return null;
  
  const [rows] = await connection.execute(
    `SELECT id FROM ${tableName} WHERE ${fieldName} = ?`,
    [value]
  );
  
  if (rows.length > 0) {
    return rows[0].id;
  }
  
  const [result] = await connection.execute(
    `INSERT INTO ${tableName} (${fieldName}, created_at) VALUES (?, NOW())`,
    [value]
  );
  
  return result.insertId;
}

// Helper function to get or create user
async function getOrCreateUser(connection, userName) {
  if (!userName) return null;
  
  const [rows] = await connection.execute(
    `SELECT id FROM users WHERE username = ?`,
    [userName.toLowerCase().replace(/\s+/g, '_')]
  );
  
  if (rows.length > 0) {
    return rows[0].id;
  }
  
  const [result] = await connection.execute(
    `INSERT INTO users (username, full_name, email, role, created_at) 
     VALUES (?, ?, ?, 'staff', NOW())`,
    [
      userName.toLowerCase().replace(/\s+/g, '_'),
      userName,
      `${userName.toLowerCase().replace(/\s+/g, '_')}@example.com`
    ]
  );
  
  return result.insertId;
}

// Helper function to safely get value or null
function getValueOrNull(value, defaultValue = null) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  return value;
}

  export async function POST(request) {
    let connection;
    
    try {
      console.log('📨 POST /api/assets/add called');
      
      // Check content type
      const contentType = request.headers.get('content-type');
      if (!contentType || !contentType.includes('multipart/form-data')) {
        return NextResponse.json({
          success: false,
          message: 'Content-Type must be multipart/form-data'
        }, { status: 400 });
      }
      
      // Get form data
      const formData = await request.formData();
      
      // Debug: Log all form data entries
      console.log('📋 Form data entries:');
      
      // Extract data properly
      const assetData = {};
      const imageFiles = [];
      let documentFile = null;
      
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  📄 ${key}: File - "${value.name}" (${value.type}, ${value.size} bytes)`);
          
          if (key === 'document') {
            documentFile = value;
          } else if (key === 'images') {
            imageFiles.push(value);
          } else if (key.startsWith('images')) {
            imageFiles.push(value);
          }
        } else {
          console.log(`  📝 ${key}: "${value}"`);
          assetData[key] = value;
        }
      }
      
      console.log('✅ Extracted asset data:', JSON.stringify(assetData, null, 2));
      console.log(`🖼️ Images: ${imageFiles.length} file(s)`);
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
      
      // Start transaction
      await connection.beginTransaction();
      
      // Get or create type
      const typeId = await getOrCreateReference(connection, 'asset_types', 'type_name', assetData.type_name);
      if (!typeId) {
        throw new Error('Failed to get or create asset type');
      }
      
      // Get or create brand
      const brandId = await getOrCreateReference(connection, 'asset_brands', 'brand_name', assetData.brand_name);
      if (!brandId) {
        throw new Error('Failed to get or create asset brand');
      }
      
      // Get or create users for prepared_by and approved_by
      const preparedById = await getOrCreateUser(connection, getValueOrNull(assetData.prepared_by, 'Admin User'));
      const approvedById = await getOrCreateUser(connection, getValueOrNull(assetData.approved_by, 'Manager'));
      
      // Prepare all values to ensure none are undefined
      const insertValues = [
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
        getValueOrNull(assetData.issue_date, null),
        getValueOrNull(assetData.received_date, null),
        getValueOrNull(assetData.device_status, 'Good'),
        getValueOrNull(assetData.device_remark, ''),
        getValueOrNull(assetData.recovery_name, ''),
        getValueOrNull(assetData.recovery_status, 'Pending'),
        preparedById,
        approvedById,
         getValueOrNull(assetData.mail_date),
          getValueOrNull(assetData.replace_device_sn_imei),
      ];
      
      // Insert asset into database
 const [result] = await connection.execute(
  `INSERT INTO assets (
    type_id, brand_id, model_name, status,
    vehicle_number, serial_number, imei_number, ip_address, gid,
    issued_to, received_from, issue_date, received_date,
    device_status, device_remark,
    recovery_name, recovery_status,
    prepared_by, approved_by, mail_date, replace_device_sn_imei
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  insertValues
);

      
      const assetId = result.insertId;
      console.log('✅ Asset created with ID:', assetId);
      
      // Handle image uploads as BLOB
      console.log(`💾 Saving ${imageFiles.length} image(s) to database as BLOB...`);
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        
        // Convert file to buffer for BLOB storage
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
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
            i === 0 // First image is primary
          ]
        );
        
        console.log(`  ✅ Image saved as BLOB: ${file.name} (${file.type}, ${file.size} bytes)`);
      }
      
      // Handle document upload as BLOB
      if (documentFile) {
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
          VALUES (?, 'CREATE', ?, 'Asset created via API', NOW())`,
          [assetId, preparedById]
        );
        console.log('📝 Audit log created');
      }
      
      // Commit transaction
      await connection.commit();
      console.log('💾 Transaction committed');
      
      // Fetch the created asset with all details (without BLOB data for performance)
      const [assetRows] = await connection.execute(
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
      
      const createdAsset = assetRows[0];
      
      // Get images metadata (without BLOB data)
      const [imageRows] = await connection.execute(
        `SELECT id, asset_id, image_name, image_size, mime_type, is_primary, uploaded_at 
        FROM asset_images 
        WHERE asset_id = ? 
        ORDER BY is_primary DESC`,
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
        ...createdAsset,
        images: imageRows,
        documents: documentRows
      };
      
      console.log('🎉 Asset successfully created! ID:', assetId);
      
      return NextResponse.json({
        success: true,
        message: 'Asset created successfully',
        data: responseData,
        assetId: assetId,
        timestamp: new Date().toISOString()
      }, { status: 201 });
      
    } catch (error) {
      console.error('❌ Error in /api/assets/add:', error);
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
        message: 'Error creating asset',
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

// Test GET endpoint
export async function GET() {
  try {
    console.log('🔍 GET /api/assets/add called');
    const connection = await getDbConnection();
    
    // Test database connection
    const [rows] = await connection.execute('SELECT 1 as test');
    await connection.end();
    
    return NextResponse.json({
      success: true,
      message: 'GET method works on /api/assets/add',
      database: 'Connected successfully',
      instructions: 'Use POST with multipart/form-data to create an asset'
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      instructions: 'Check your database configuration in .env file'
    }, { status: 500 });
  }
}