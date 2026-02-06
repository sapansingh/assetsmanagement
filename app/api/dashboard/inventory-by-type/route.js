// app/api/dashboard/inventory-by-type/route.js
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

async function getDbConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'asset_management',
    port: process.env.DB_PORT || 3306,
  });
}

export async function GET() {
  let connection;
  
  try {
    connection = await getDbConnection();
    
    console.log('=== STEP 1: Fetching assets data ===');
    // ========== ASSETS DATA ==========
    const [assets] = await connection.execute(
      'SELECT asset_types.type_name, assets.status, assets.device_status FROM assets JOIN asset_types ON asset_types.id=assets.type_id'
    );
    
    console.log('Total assets found:', assets.length);
    console.log('First few assets:', assets.slice(0, 3));
    
    const typeMap = {};
    assets.forEach(asset => {
      const typeName = asset.type_name || 'Unknown';
      
      if (!typeMap[typeName]) {
        typeMap[typeName] = {
          type_name: typeName,
          total: 0,
          issued: 0,
          received: 0,
          inStock: 0,
          deviceStatus: {
            active: 0,
            good: 0,
            faulty: 0,
            damaged: 0
          }
        };
      }
      
      typeMap[typeName].total++;
      
      if (asset.status === 'Issued') typeMap[typeName].issued++;
      if (asset.status === 'Received') typeMap[typeName].received++;
      if (asset.status === 'In Stock') typeMap[typeName].inStock++;
      
      if (asset.device_status === 'Active') typeMap[typeName].deviceStatus.active++;
      if (asset.device_status === 'Good') typeMap[typeName].deviceStatus.good++;
      if (asset.device_status === 'Faulty') typeMap[typeName].deviceStatus.faulty++;
      if (asset.device_status === 'Damaged') typeMap[typeName].deviceStatus.damaged++;
    });
    
    const inventoryByType = Object.values(typeMap).sort((a, b) => b.total - a.total);
    console.log('Assets by type count:', inventoryByType.length);
    console.log('Sample asset type:', inventoryByType[0]);
    
    console.log('\n=== STEP 2: Fetching stock data ===');
    // ========== STOCK DATA ==========
    const [stockCategories] = await connection.execute(`
      SELECT 
        category as type_name,
        COUNT(*) as total,
        SUM(quantity) as total_quantity,
        SUM(quantity * purchase_price) as total_value
      FROM stock_entries
      GROUP BY category
      ORDER BY total DESC
    `);
    
    console.log('Stock categories found:', stockCategories.length);
    console.log('Stock categories raw data:', JSON.stringify(stockCategories, null, 2));
    
    // Check if there's actual data
    if (stockCategories.length > 0) {
      console.log('\nDebugging first stock category:');
      console.log('Type:', typeof stockCategories[0].type_name);
      console.log('Total:', stockCategories[0].total, 'Type:', typeof stockCategories[0].total);
      console.log('Total quantity:', stockCategories[0].total_quantity, 'Type:', typeof stockCategories[0].total_quantity);
      console.log('Total value:', stockCategories[0].total_value, 'Type:', typeof stockCategories[0].total_value);
      
      // Check if values are null
      console.log('Is total null?', stockCategories[0].total === null);
      console.log('Is total_quantity null?', stockCategories[0].total_quantity === null);
      console.log('Is total_value null?', stockCategories[0].total_value === null);
    }
    
    // Convert stock data to match assets format
    const stockByType = stockCategories.map(stock => {
      console.log(`\nProcessing stock category: ${stock.type_name}`);
      console.log('Raw values:', {
        total: stock.total,
        total_quantity: stock.total_quantity,
        total_value: stock.total_value
      });
      
      // Convert values properly
      const total = parseInt(stock.total) || 0;
      const total_quantity = parseFloat(stock.total_quantity) || 0;
      const total_value = parseFloat(stock.total_value) || 0;
      
      console.log('Converted values:', { total, total_quantity, total_value });
      
      return {
        type_name: stock.type_name || 'Unknown',
        total: total,
        // Adding these fields to match assets structure
        issued: 0,
        received: 0,
        inStock: total, // This is where the issue might be
        deviceStatus: {
          active: 0,
          good: 0,
          faulty: 0,
          damaged: 0
        },
        // Additional stock-specific fields
        isStockItem: true,
        total_quantity: total_quantity,
        total_value: total_value.toFixed(2)
      };
    });
    
    console.log('\n=== STEP 3: Final stock data ===');
    console.log('Stock by type count:', stockByType.length);
    console.log('First stock item:', JSON.stringify(stockByType[0], null, 2));
    
    // ========== COMBINE DATA ==========
    const combinedData = {
      inventoryByType: inventoryByType,
      stockByType: stockByType,
      summary: {
        totalAssets: assets.length,
        totalStockEntries: stockCategories.reduce((sum, item) => sum + (parseInt(item.total) || 0), 0),
        assetTypes: inventoryByType.length,
        stockCategories: stockByType.length,
        totalStockQuantity: stockCategories.reduce((sum, item) => sum + (parseFloat(item.total_quantity) || 0), 0),
        totalStockValue: stockCategories.reduce((sum, item) => sum + (parseFloat(item.total_value) || 0), 0).toFixed(2)
      }
    };
    
    console.log('\n=== STEP 4: Final response summary ===');
    console.log('Total assets:', combinedData.summary.totalAssets);
    console.log('Total stock entries:', combinedData.summary.totalStockEntries);
    console.log('Stock categories:', combinedData.summary.stockCategories);
    
    return NextResponse.json({
      success: true,
      data: combinedData.inventoryByType,
      inventoryByType: combinedData.inventoryByType,
      stockByType: combinedData.stockByType,
      summary: combinedData.summary,
      debug: {
        assetsCount: assets.length,
        stockCategoriesCount: stockCategories.length,
        stockByTypeCount: stockByType.length,
        stockDataSample: stockByType[0] || 'No stock data'
      }
    });
    
  } catch (error) {
    console.error('Error fetching inventory by type:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch inventory by type',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}