import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file from ${url}`);
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    
    // Determine extension based on URL or content type
    let extension = "file";
    if (url.includes(".mp4")) extension = "mp4";
    else if (url.includes("pollinations.ai")) extension = "jpg";
    else if (contentType.includes("image/jpeg")) extension = "jpg";
    else if (contentType.includes("image/png")) extension = "png";
    else if (contentType.includes("video/mp4")) extension = "mp4";

    const filename = `jnext-download-${Date.now()}.${extension}`;

    // Read the response stream
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Return the response with Content-Disposition to force a download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("Download proxy error:", error);
    return NextResponse.json(
      { error: "Failed to download file." },
      { status: 500 }
    );
  }
}
