// app/api/assets/export/route.js
import { query } from '../../lib/db';
import ExcelJS from 'exceljs';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const exportType = searchParams.get('type') || 'all';
    
    let whereClause = '';
    const params = [];
    
    if (exportType !== 'all') {
      whereClause = 'WHERE a.status = ?';
      params.push(exportType);
    }
    
    const sql = `
      SELECT 
        a.id,
        at.type_name,
        ab.brand_name,
        a.model_name,
        a.status,
        a.vehicle_number,
        a.serial_number,
        a.imei_number,
        a.ip_address,
        a.gid,
        a.issued_to,
        a.received_from,
        DATE_FORMAT(a.issue_date, '%Y-%m-%d') as issue_date,
        DATE_FORMAT(a.received_date, '%Y-%m-%d') as received_date,
        a.device_status,
        a.device_remark,
        a.recovery_name,
        a.recovery_status,
        u_prep.full_name as prepared_by,
        u_appr.full_name as approved_by,
        DATE_FORMAT(a.created_at, '%Y-%m-%d %H:%i:%s') as created_at
      FROM assets a
      LEFT JOIN asset_types at ON a.type_id = at.id
      LEFT JOIN asset_brands ab ON a.brand_id = ab.id
      LEFT JOIN users u_prep ON a.prepared_by = u_prep.id
      LEFT JOIN users u_appr ON a.approved_by = u_appr.id
      ${whereClause}
      ORDER BY a.created_at DESC
    `;
    
    const assets = await query(sql, params);
    
    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Assets');
    
    // Add headers
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Type', key: 'type_name', width: 15 },
      { header: 'Brand', key: 'brand_name', width: 15 },
      { header: 'Model', key: 'model_name', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Vehicle No', key: 'vehicle_number', width: 15 },
      { header: 'Serial No', key: 'serial_number', width: 20 },
      { header: 'IMEI No', key: 'imei_number', width: 20 },
      { header: 'IP Address', key: 'ip_address', width: 15 },
      { header: 'GID', key: 'gid', width: 15 },
      { header: 'Issued To', key: 'issued_to', width: 25 },
      { header: 'Received From', key: 'received_from', width: 25 },
      { header: 'Issue Date', key: 'issue_date', width: 12 },
      { header: 'Received Date', key: 'received_date', width: 12 },
      { header: 'Device Status', key: 'device_status', width: 15 },
      { header: 'Device Remark', key: 'device_remark', width: 30 },
      { header: 'Recovery Name', key: 'recovery_name', width: 25 },
      { header: 'Recovery Status', key: 'recovery_status', width: 15 },
      { header: 'Prepared By', key: 'prepared_by', width: 20 },
      { header: 'Approved By', key: 'approved_by', width: 20 },
      { header: 'Created At', key: 'created_at', width: 20 }
    ];
    
    // Add data rows
    assets.forEach(asset => {
      worksheet.addRow(asset);
    });
    
    // Style header row
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4F46E5' } // Indigo
      };
    });
    
    // Auto filter
    worksheet.autoFilter = 'A1:U1';
    
    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Return as downloadable file
    const headers = new Headers();
    headers.append('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.append('Content-Disposition', `attachment; filename="assets_${new Date().toISOString().split('T')[0]}.xlsx"`);
    
    return new Response(buffer, {
      headers,
    });
    
  } catch (error) {
    console.error('Error exporting assets:', error);
    return Response.json(
      { success: false, message: 'Failed to export assets' },
      { status: 500 }
    );
  }
}