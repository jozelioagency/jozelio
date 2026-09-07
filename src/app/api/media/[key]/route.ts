import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  // Next.js App Router context uses a Promise for dynamic params in modern versions
  props: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await props.params;

    if (!key || !/^[a-zA-Z0-9_.-]+$/.test(key) || key.includes("..")) {
      return new Response("Invalid media key", { status: 400 });
    }

    const { env } = getCloudflareContext();
    const bucket = env.BUCKET;

    if (!bucket) {
      return new Response("R2 bucket binding not configured", { status: 500 });
    }

    // Retrieve file object from R2 bucket
    const object = await bucket.get(key);

    if (!object) {
      return new Response("Media not found", { status: 404 });
    }

    const headers = new Headers();
    
    // Populate HTTP headers from object metadata (content-type, cache-control, etc.)
    if (object && object.httpMetadata) {
      const meta = object.httpMetadata as any;
      if (meta.contentType) headers.set("content-type", meta.contentType);
      if (meta.contentEncoding) headers.set("content-encoding", meta.contentEncoding);
      if (meta.contentLanguage) headers.set("content-language", meta.contentLanguage);
      if (meta.contentDisposition) headers.set("content-disposition", meta.contentDisposition);
    } else {
      // Manual fallback content-type mapping based on file extension
      const ext = key.split(".").pop()?.toLowerCase();
      if (ext === "webp") {
        headers.set("content-type", "image/webp");
      } else if (ext === "png") {
        headers.set("content-type", "image/png");
      } else if (ext === "jpg" || ext === "jpeg") {
        headers.set("content-type", "image/jpeg");
      } else if (ext === "gif") {
        headers.set("content-type", "image/gif");
      } else if (ext === "svg") {
        headers.set("content-type", "image/svg+xml");
      } else {
        headers.set("content-type", "application/octet-stream");
      }
    }

    // Ensure content-type header is present
    if (!headers.has("content-type")) {
      const ext = key.split(".").pop()?.toLowerCase();
      if (ext === "webp") {
        headers.set("content-type", "image/webp");
      } else if (ext === "png") {
        headers.set("content-type", "image/png");
      } else if (ext === "jpg" || ext === "jpeg") {
        headers.set("content-type", "image/jpeg");
      } else if (ext === "gif") {
        headers.set("content-type", "image/gif");
      } else if (ext === "svg") {
        headers.set("content-type", "image/svg+xml");
      } else {
        headers.set("content-type", "application/octet-stream");
      }
    }

    if (object && object.httpEtag) {
      headers.set("etag", object.httpEtag);
    }
    
    // Ensure strong cache directives for media assets
    headers.set("cache-control", "public, max-age=31536000, immutable");

    // Consume the body as an ArrayBuffer to be fully compatible with both dev mocks and production edge runtimes
    const data = await object.arrayBuffer();

    // Return the body directly to client
    return new Response(data, {
      headers,
    });
  } catch (error: any) {
    console.error("Media server error:", error);
    return new Response(JSON.stringify({
      error: error?.message || String(error),
    }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
