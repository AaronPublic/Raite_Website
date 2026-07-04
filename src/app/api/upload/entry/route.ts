import { NextRequest, NextResponse } from "next/server";
import { getDriveClient, getOrCreateFolder } from "@/app/actions/gdrive";
import { db } from "@/lib/db";
import { Readable } from "stream";

export const maxDuration = 300; // 5 minutes max duration

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const registrationId = formData.get("registrationId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
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
      return NextResponse.json({ error: "Failed to upload file to Google Drive (no file ID returned)" }, { status: 500 });
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

    return NextResponse.json({
      success: true,
      fileId,
      link: webViewLink,
    });
  } catch (error: any) {
    console.error("Google Drive route upload error:", error);
    return NextResponse.json({
      error: error.message || "Failed to upload file to Google Drive",
    }, { status: 500 });
  }
}
