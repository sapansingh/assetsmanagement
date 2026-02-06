// app/api/upload/route.js
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const assetId = formData.get('assetId');
    const uploadType = formData.get('type'); // 'image' or 'document'
    const files = formData.getAll('files');
    
    if (!files || files.length === 0) {
      return Response.json(
        { success: false, message: 'No files uploaded' },
        { status: 400 }
      );
    }
    
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    const assetDir = join(uploadsDir, `asset_${assetId}`);
    
    // Create directories if they don't exist
    await mkdir(uploadsDir, { recursive: true });
    await mkdir(assetDir, { recursive: true });
    
    const uploadedFiles = [];
    
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const timestamp = Date.now();
      const ext = file.name.split('.').pop();
      const filename = `${timestamp}_${Math.random().toString(36).substring(2, 15)}.${ext}`;
      const filepath = join(assetDir, filename);
      const relativePath = `/uploads/asset_${assetId}/${filename}`;
      
      // Save file
      await writeFile(filepath, buffer);
      
      // Save to database
      if (uploadType === 'image') {
        const sql = `
          INSERT INTO asset_images (asset_id, image_path, image_name, image_size, mime_type)
          VALUES (?, ?, ?, ?, ?)
        `;
        await query(sql, [
          assetId,
          relativePath,
          file.name,
          file.size,
          file.type
        ]);
      } else if (uploadType === 'document') {
        const sql = `
          INSERT INTO asset_documents (asset_id, document_path, document_name, document_type, file_size)
          VALUES (?, ?, ?, ?, ?)
        `;
        const docType = ext.toLowerCase() === 'pdf' ? 'pdf' : 
                       ['doc', 'docx'].includes(ext.toLowerCase()) ? 'doc' : 'other';
        
        await query(sql, [
          assetId,
          relativePath,
          file.name,
          docType,
          file.size
        ]);
      }
      
      uploadedFiles.push({
        name: file.name,
        path: relativePath,
        type: file.type,
        size: file.size
      });
    }
    
    return Response.json({
      success: true,
      data: uploadedFiles,
      message: 'Files uploaded successfully'
    });
    
  } catch (error) {
    console.error('Error uploading files:', error);
    return Response.json(
      { success: false, message: 'Failed to upload files' },
      { status: 500 }
    );
  }
}