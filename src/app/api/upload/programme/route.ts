import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const ALLOWED_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword", // .doc
  "application/pdf", // .pdf
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PDF or Microsoft Word (.doc, .docx) files are allowed" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    let buffer: any = Buffer.from(bytes);
    let finalContentType = file.type;
    let finalFileName = file.name;

    // Convert docx/doc to pdf if a converter is available (Word on Windows or LibreOffice on Windows/Linux)
    if (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.type === "application/msword"
    ) {
      try {
        const { convertDocxToPdfLocal } = await import("@/lib/docx-converter");
        buffer = await convertDocxToPdfLocal(buffer);
        finalContentType = "application/pdf";
        finalFileName = file.name.replace(/\.(docx|doc)$/i, ".pdf");
      } catch (convError) {
        console.error("Conversion to PDF failed, uploading original DOCX file:", convError);
      }
    }

    // Create unique filename with a clean structure
    const filename = `programme/RAITE-2026-Provisional-Programme-${Date.now()}-${finalFileName.replaceAll(" ", "_")}`;
    
    // Upload to Supabase Storage using Admin client (using the public 'rules' bucket)
    const { data, error } = await supabaseAdmin.storage
      .from("rules")
      .upload(filename, buffer, {
        contentType: finalContentType,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase Storage error:", error);
      return NextResponse.json({ error: "Failed to upload to storage" }, { status: 500 });
    }

    // Get the public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("rules")
      .getPublicUrl(filename);
    
    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to process upload" }, { status: 500 });
  }
}
