import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";


const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse multipart form data
    const formData = await request.formData();
    const files = formData.getAll("file") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const { env } = getCloudflareContext();
    const bucket = env.BUCKET;

    if (!bucket) {
      return NextResponse.json(
        { error: "R2 bucket binding not configured" },
        { status: 500 }
      );
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      // 3. Validation: type check
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File type ${file.type} is not supported. Use PNG, JPEG, or WEBP.` },
          { status: 400 }
        );
      }

      // 4. Validation: size check
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File size exceeds the 4MB limit.` },
          { status: 400 }
        );
      }

      // 5. Generate a unique key for the file
      const originalName = file.name || "image.webp";
      const mimeToExt: Record<string, string> = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/webp": "webp",
      };
      const extension = mimeToExt[file.type] || "jpg";
      const fileKey = `${crypto.randomUUID()}.${extension}`;

      // Convert file to array buffer for R2 upload
      const arrayBuffer = await file.arrayBuffer();

      // 6. Upload to Cloudflare R2 bucket
      await bucket.put(fileKey, arrayBuffer, {
        httpMetadata: {
          contentType: file.type,
          cacheControl: "public, max-age=31536000, immutable",
        },
        customMetadata: {
          userId: session.user.id,
          originalName,
        },
      });

      // Construct dynamic media URL served by the platform's media route
      const origin = request.nextUrl.origin;
      const fileUrl = `${origin}/api/media/${fileKey}`;
      uploadedUrls.push(fileUrl);
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      // For single upload backward compatibility
      url: uploadedUrls[0],
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
