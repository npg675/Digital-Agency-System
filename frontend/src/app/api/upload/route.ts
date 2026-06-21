import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { google } from 'googleapis';
import crypto from 'crypto';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function getStorageSettings(authHeader: string | null) {
  try {
    if (!authHeader) return null;
    const res = await fetch(`${API_BASE}/settings/video-storage`, {
      headers: { Authorization: authHeader },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    let buffer = Buffer.from(await file.arrayBuffer());
    let filename = file.name;
    let mimeType = file.type;

    const isMov = filename.toLowerCase().endsWith('.mov') || mimeType === 'video/quicktime';

    if (isMov) {
      console.log(`[upload] Detected MOV file: ${filename}. Transcoding to MP4...`);
      try {
        const backendFormData = new FormData();
        const fileBlob = new Blob([buffer], { type: mimeType });
        backendFormData.append('file', fileBlob, filename);

        const transcodeRes = await fetch(`${API_BASE}/video-editor/transcode`, {
          method: 'POST',
          body: backendFormData,
        });

        if (!transcodeRes.ok) {
          const errMsg = await transcodeRes.text();
          throw new Error(`Backend transcode failed: ${errMsg}`);
        }

        buffer = Buffer.from(await transcodeRes.arrayBuffer());
        filename = filename.replace(/\.[^.]+$/, '.mp4');
        if (!filename.endsWith('.mp4')) {
          filename += '.mp4';
        }
        mimeType = 'video/mp4';
        console.log(`[upload] Transcoding successful. Updated filename to ${filename}`);
      } catch (err: any) {
        console.error('[upload] Transcoding error:', err);
        return NextResponse.json({ error: `Transcoding failed: ${err.message}` }, { status: 500 });
      }
    }

    const uniqueFilename = `${crypto.randomUUID()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Fetch storage settings from database (via backend API)
    const authHeader = request.headers.get('Authorization');
    const dbSettings = await getStorageSettings(authHeader);

    // Merge: DB settings take priority, fallback to env vars
    const storageProvider  = dbSettings?.video_storage_provider  ?? process.env.STORAGE_PROVIDER  ?? 'local';
    const localUploadPath  = dbSettings?.video_upload_local_path ?? process.env.LOCAL_UPLOAD_PATH  ?? 'public/uploads';
    const gDriveFolderId   = dbSettings?.google_drive_folder_id  ?? process.env.GOOGLE_DRIVE_FOLDER_ID  ?? null;
    // Note: credentials are NOT returned by the GET endpoint for security. Read from env only.
    const gDriveCredentials = process.env.GOOGLE_DRIVE_CREDENTIALS ?? null;

    // ── Step 1: Always save locally ──────────────────────────────────
    const uploadsDir = path.join(process.cwd(), localUploadPath);
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, uniqueFilename);
    await fs.writeFile(filePath, buffer);

    const publicPathRoute = localUploadPath.startsWith('public/')
      ? localUploadPath.replace('public/', '')
      : 'uploads';
    const publicUrl = `/${publicPathRoute}/${uniqueFilename}`.replace('//', '/');

    // ── Step 2: Cloud sync if configured ─────────────────────────────
    let gdriveUrl: string | null = null;

    if ((storageProvider === 'gdrive' || storageProvider === 'dual') && gDriveFolderId && gDriveCredentials) {
      try {
        const credentials = JSON.parse(gDriveCredentials);
        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/drive.file'],
        });
        const drive = google.drive({ version: 'v3', auth });

        const { Readable } = require('stream');
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        const response = await drive.files.create({
          requestBody: { name: uniqueFilename, parents: [gDriveFolderId] },
          media: { mimeType: mimeType, body: stream },
          fields: 'id, webContentLink',
        });

        await drive.permissions.create({
          fileId: response.data.id!,
          requestBody: { role: 'reader', type: 'anyone' },
        });

        gdriveUrl = response.data.webContentLink ?? null;
        console.log(`[upload] Synced to Google Drive: ${gdriveUrl}`);
      } catch (gdriveError) {
        console.warn('[upload] Google Drive sync failed. Local copy is safe.', gdriveError);
      }
    }

    return NextResponse.json({
      url: publicUrl,
      gdriveUrl,
      provider: gdriveUrl ? 'dual' : 'local',
      success: true,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
