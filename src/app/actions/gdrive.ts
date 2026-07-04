"use server";

import { google } from "googleapis";
import { Readable } from "stream";
import { db } from "@/lib/db";

const SCOPES = ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/drive.file"];

async function getOrCreateFolder(drive: any, name: string, parentId: string): Promise<string> {
  const cleanName = name.replace(/['"\\]/g, "");
  
  // Search for folder matching name and parent
  const response = await drive.files.list({
    q: `name = '${cleanName}' and mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`,
    spaces: "drive",
    fields: "files(id)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const files = response.data.files;
  if (files && files.length > 0) {
    return files[0].id;
  }

  // Create folder if not found
  const folderMetadata = {
    name: cleanName,
    mimeType: "application/vnd.google-apps.folder",
    parents: [parentId],
  };

  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: "id",
    supportsAllDrives: true,
  });

  return folder.data.id;
}

function getDriveClient() {
  const clean = (val: string | undefined) => {
    if (!val) return undefined;
    let cleaned = val.trim();
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
      cleaned = cleaned.slice(1, -1);
    }
    return cleaned.trim();
  };

  const clientEmail = clean(process.env.GOOGLE_CLIENT_EMAIL);
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
  const clientId = clean(process.env.GOOGLE_CLIENT_ID);
  const clientSecret = clean(process.env.GOOGLE_CLIENT_SECRET);
  const refreshToken = clean(process.env.GOOGLE_REFRESH_TOKEN);

  // Use OAuth2 client if credentials are provided.
  // This is highly recommended for personal Gmail accounts, as it uploads files on behalf of the user,
  // utilizing the user's personal storage quota instead of the service account's 0-byte quota.
  if (clientId && clientSecret && refreshToken) {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return google.drive({ version: "v3", auth: oauth2Client });
  }

  if (!clientEmail || !rawPrivateKey) {
    throw new Error(
      "Google Drive API credentials are not configured. Please configure either Service Account credentials (GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY) or OAuth2 credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN)."
    );
  }

  // Handle literal newlines and trim whitespace
  let cleanedKey = rawPrivateKey.replace(/\\n/g, "\n").trim();

  // Strip wrapping double quotes if present
  if (cleanedKey.startsWith('"') && cleanedKey.endsWith('"')) {
    cleanedKey = cleanedKey.slice(1, -1);
  }

  // Extract the raw base64 body to rebuild a standard, valid PEM format
  const base64Body = cleanedKey
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, ""); // strip all spaces/newlines

  const formattedKey = `-----BEGIN PRIVATE KEY-----\n${base64Body}\n-----END PRIVATE KEY-----\n`;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: formattedKey,
    },
    scopes: SCOPES,
  });

  return google.drive({ version: "v3", auth });
}

export async function uploadFileToDrive(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    let folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || "";
    // If it's a full URL, extract the alphanumeric folder ID
    if (folderId.includes("drive.google.com")) {
      const match = folderId.match(/\/folders\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        folderId = match[1];
      }
    }
    const drive = getDriveClient();

    // Determine target folder: Resolve Competition and School subfolders
    let targetFolderId = folderId;
    const registrationId = formData.get("registrationId") as string;

    if (registrationId && folderId) {
      try {
        const registration = await db.registration.findUnique({
          where: { id: registrationId },
          include: { 
            event: true, 
            user: true 
          }
        });

        if (registration) {
          const compName = registration.event.title || "Unknown Competition";
          const schoolName = registration.user.school || "Unknown Institution";

          // 1. Get or create competition subfolder
          const compFolderId = await getOrCreateFolder(drive, compName, folderId);
          
          // 2. Get or create school subfolder inside competition folder
          targetFolderId = await getOrCreateFolder(drive, schoolName, compFolderId);
        }
      } catch (dbError) {
        console.error("Database query failed during upload subfolder resolution:", dbError);
      }
    }

    // Convert file to array buffer and then buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a readable stream from buffer
    const mediaStream = new Readable();
    mediaStream.push(buffer);
    mediaStream.push(null);

    const fileMetadata = {
      name: file.name,
      parents: targetFolderId ? [targetFolderId] : undefined,
    };

    const media = {
      mimeType: file.type,
      body: mediaStream,
    };

    // Upload the file, supporting both standard My Drive folders and Shared Drives
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, webViewLink, webContentLink",
      supportsAllDrives: true,
    } as any);

    const fileId = response.data.id;
    const webViewLink = response.data.webViewLink;

    if (!fileId) {
      return { success: false, error: "Failed to upload file to Google Drive (no file ID returned)" };
    }

    // Set permission to anyone with link can view, supporting both standard and Shared Drives
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
      supportsAllDrives: true,
    } as any);

    return {
      success: true,
      fileId,
      link: webViewLink,
    };
  } catch (error: any) {
    console.error("Google Drive upload error:", error);
    return {
      success: false,
      error: error.message || "Failed to upload file to Google Drive",
    };
  }
}
