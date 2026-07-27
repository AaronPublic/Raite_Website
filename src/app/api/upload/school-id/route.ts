import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg"
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
        { error: "Only PDF, PNG, and JPEG files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const filename = `school-ids/id-${Date.now()}-${file.name.replaceAll(" ", "_")}`;
    
    // Upload to Supabase Storage using Admin client
    const { data, error } = await supabaseAdmin.storage
      .from("competitions")
      .upload(filename, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase Storage error (School ID):", error);
      return NextResponse.json({ error: "Failed to upload to storage" }, { status: 500 });
    }

    // Get the public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("competitions")
      .getPublicUrl(filename);
    
    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error("School ID upload error:", error);
    return NextResponse.json({ error: "Failed to process upload" }, { status: 500 });
  }
}
