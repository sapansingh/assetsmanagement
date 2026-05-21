// app/api/assets/export/route.js

import { query } from '../../../lib/db';

export const runtime = 'nodejs';

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

    // CSV Headers
    const headers = [
      'ID',
      'Type',
      'Brand',
      'Model',
      'Status',
      'Vehicle No',
      'Serial No',
      'IMEI No',
      'IP Address',
      'GID',
      'Issued To',
      'Received From',
      'Issue Date',
      'Received Date',
      'Device Status',
      'Device Remark',
      'Recovery Name',
      'Recovery Status',
      'Prepared By',
      'Approved By',
      'Created At'
    ];

    // Convert rows to CSV
    const rows = assets.map((asset) => [
      asset.id,
      asset.type_name,
      asset.brand_name,
      asset.model_name,
      asset.status,
      asset.vehicle_number,
      asset.serial_number,
      asset.imei_number,
      asset.ip_address,
      asset.gid,
      asset.issued_to,
      asset.received_from,
      asset.issue_date,
      asset.received_date,
      asset.device_status,
      asset.device_remark,
      asset.recovery_name,
      asset.recovery_status,
      asset.prepared_by,
      asset.approved_by,
      asset.created_at
    ]);

    // Build CSV string
    const csvContent = [
      headers.join(','),

      ...rows.map((row) =>
        row
          .map((field) =>
            `"${String(field ?? '').replace(/"/g, '""')}"`
          )
          .join(',')
      ),
    ].join('\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=assets_${
          new Date().toISOString().split('T')[0]
        }.csv`,
      },
    });

  } catch (error) {
    console.error('CSV Export Error:', error);

    return Response.json(
      {
        success: false,
        message: 'Failed to export CSV',
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}