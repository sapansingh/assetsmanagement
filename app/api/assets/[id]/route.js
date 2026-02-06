// app/api/assets/[id]/route.js
import { query } from '../../../lib/db';

// Helper function to extract ID from URL
function extractIdFromUrl(request) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  // URL format: /api/assets/2 -> segments: ["", "api", "assets", "2"]
  const id = pathSegments[3];
  console.log('Extracted ID from URL:', id);
  return id;
}

export async function GET(request, { params }) {
  try {
    // Try to get ID from params first, fallback to URL extraction
    let id = params?.id;
    
    if (!id) {
      id = extractIdFromUrl(request);
    }
    
    console.log('=== GET ASSET ===');
    console.log('Params object:', params);
    console.log('Using ID:', id);
    
    if (!id || isNaN(parseInt(id))) {
      return Response.json(
        { 
          success: false, 
          message: 'Valid asset ID is required',
          params: params,
          url: request.url 
        },
        { status: 400 }
      );
    }
    
    // Get asset with related data - FIXED THE SQL (removed hardcoded WHERE a.id = 2)
    const sql = `
      SELECT 
        a.*,
        at.type_name,
        ab.brand_name,
        u_prep.full_name as prepared_by_name,
        u_appr.full_name as approved_by_name
      FROM assets a
      LEFT JOIN asset_types at ON a.type_id = at.id
      LEFT JOIN asset_brands ab ON a.brand_id = ab.id
      LEFT JOIN users u_prep ON a.prepared_by = u_prep.id
      LEFT JOIN users u_appr ON a.approved_by = u_appr.id
      WHERE a.id = ?
    `;
    
    const assets = await query(sql, [id]);
    
    if (assets.length === 0) {
      return Response.json(
        { success: false, message: 'Asset not found' },
        { status: 404 }
      );
    }
    
    const asset = assets[0];
    
    // Get images
    const imagesSql = `SELECT id,asset_id,image_name,image_size,mime_type,is_primary FROM asset_images WHERE asset_id = ?`;
    asset.images = await query(imagesSql, [id]);
    
    // Get documents
    const docsSql = `SELECT id,asset_id,document_name,document_type,file_size FROM asset_documents WHERE asset_id = ?`;
    asset.documents = await query(docsSql, [id]);
    
    // Get audit history
    const historySql = `
      SELECT ah.*, u.full_name as changed_by_name 
      FROM asset_history ah
      LEFT JOIN users u ON ah.changed_by = u.id
      WHERE asset_id = ?
      ORDER BY created_at DESC
    `;
    asset.history = await query(historySql, [id]);
    
    return Response.json({
      success: true,
      data: asset
    });
    
  } catch (error) {
    console.error('Error fetching asset:', error);
    return Response.json(
      { success: false, message: 'Failed to fetch asset' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    // Try to get ID from params first, fallback to URL extraction
    let id = params?.id;
    
    if (!id) {
      id = extractIdFromUrl(request);
    }
    
    console.log('=== UPDATE ASSET ===');
    console.log('Updating asset ID:', id);
    
    if (!id || isNaN(parseInt(id))) {
      return Response.json(
        { success: false, message: 'Valid asset ID is required' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    // Get type_id from type_name
    const typeSql = `SELECT id FROM asset_types WHERE type_name = ?`;
    const [typeResult] = await query(typeSql, [data.type_name]);
    if (!typeResult) {
      return Response.json(
        { success: false, message: 'Invalid asset type' },
        { status: 400 }
      );
    }
    const type_id = typeResult.id;
    
    // Get brand_id from brand_name
    const brandSql = `SELECT id FROM asset_brands WHERE brand_name = ?`;
    const [brandResult] = await query(brandSql, [data.brand_name]);
    if (!brandResult) {
      return Response.json(
        { success: false, message: 'Invalid brand' },
        { status: 400 }
      );
    }
    const brand_id = brandResult.id;
    
    // Get old values for audit
    const oldAssetSql = `SELECT * FROM assets WHERE id = ?`;
    const [oldAsset] = await query(oldAssetSql, [id]);
    
    // Update asset
    const sql = `
      UPDATE assets SET
        type_id = ?, brand_id = ?, model_name = ?, status = ?, 
        vehicle_number = ?, serial_number = ?, imei_number = ?, 
        ip_address = ?, gid = ?, issued_to = ?, received_from = ?, 
        issue_date = ?, received_date = ?, device_status = ?, 
        device_remark = ?, recovery_name = ?, recovery_status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const values = [
      type_id, brand_id, data.model_name, data.status, data.vehicleno,
      data.serial_no, data.imei_no, data.ip_address, data.gid, data.issued_to,
      data.received_from, data.issue_date, data.received_date, data.device_status,
      data.device_remark, data.recovery_name, data.recovery_status,
      id
    ];
    
    await query(sql, values);
    
    // Create audit log
    const auditSql = `
      INSERT INTO asset_history (asset_id, action_type, changed_by, old_values, new_values)
      VALUES (?, 'UPDATE', ?, ?, ?)
    `;
    await query(auditSql, [
      id,
      oldAsset.prepared_by,
      JSON.stringify(oldAsset),
      JSON.stringify(data)
    ]);
    
    return Response.json({
      success: true,
      message: 'Asset updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating asset:', error);
    return Response.json(
      { success: false, message: 'Failed to update asset' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    // Try to get ID from params first, fallback to URL extraction
    let id = params?.id;
    
    if (!id) {
      id = extractIdFromUrl(request);
    }
    
    console.log('=== DELETE ASSET ===');
    console.log('Deleting asset ID:', id);
    
    if (!id || isNaN(parseInt(id))) {
      return Response.json(
        { success: false, message: 'Valid asset ID is required' },
        { status: 400 }
      );
    }
    
    // Get asset for audit
    const oldAssetSql = `SELECT * FROM assets WHERE id = ?`;
    const [oldAsset] = await query(oldAssetSql, [id]);
    
    if (!oldAsset) {
      return Response.json(
        { success: false, message: 'Asset not found' },
        { status: 404 }
      );
    }
    
    // 1. FIRST: Create audit log BEFORE deleting
    const auditSql = `
      INSERT INTO asset_history (asset_id, action_type, changed_by, old_values)
      VALUES (?, 'DELETE', ?, ?)
    `;
    
    // Get user ID (assuming from session or default)
    const userId = oldAsset.prepared_by || 1;
    
    await query(auditSql, [
      id,
      userId,
      JSON.stringify(oldAsset)
    ]);
    
    console.log('Audit log created for asset:', id);
    
    // 2. Delete related images first (if not using CASCADE)
    try {
      const deleteImagesSql = `DELETE FROM asset_images WHERE asset_id = ?`;
      await query(deleteImagesSql, [id]);
      console.log('Deleted related images');
    } catch (imgError) {
      console.log('No images to delete or error:', imgError.message);
    }
    
    // 3. Delete related documents first (if not using CASCADE)
    try {
      const deleteDocsSql = `DELETE FROM asset_documents WHERE asset_id = ?`;
      await query(deleteDocsSql, [id]);
      console.log('Deleted related documents');
    } catch (docError) {
      console.log('No documents to delete or error:', docError.message);
    }
    
    // 4. NOW delete the asset (history will cascade)
    const deleteAssetSql = `DELETE FROM assets WHERE id = ?`;
    const result = await query(deleteAssetSql, [id]);
    
    if (result.affectedRows === 0) {
      return Response.json(
        { success: false, message: 'Failed to delete asset' },
        { status: 500 }
      );
    }
    
    console.log('Asset deleted successfully');
    
    return Response.json({
      success: true,
      message: 'Asset deleted successfully',
      deletedId: id
    });
    
  } catch (error) {
    console.error('Error deleting asset:', error);
    return Response.json(
      { 
        success: false, 
        message: 'Failed to delete asset',
        error: error.message 
      },
      { status: 500 }
    );
  }
}