import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const apiKey = (formData.get("apiKey") as string | null)?.trim();

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image file provided" },
        { status: 400 }
      );
    }

    // 1. If a valid custom apiKey is provided, attempt server-side ImgBB upload (no CORS!)
    if (apiKey && apiKey !== "88bb5a691cfe76f4e760e5de74694655") {
      try {
        const imgbbForm = new FormData();
        imgbbForm.append("image", file);

        const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
          method: "POST",
          body: imgbbForm,
        });

        const imgbbJson = await imgbbRes.json();
        if (imgbbRes.ok && imgbbJson?.success && imgbbJson?.data?.url) {
          return NextResponse.json({
            success: true,
            url: imgbbJson.data.display_url || imgbbJson.data.url,
            provider: "imgbb",
          });
        } else {
          const errDetail = imgbbJson?.error?.message || "ImgBB rejected the upload";
          console.warn("[upload route] ImgBB error:", errDetail);
        }
      } catch (imgbbErr: any) {
        console.warn("[upload route] ImgBB fetch error:", imgbbErr?.message);
      }
    }

    // 2. Reliable fallback: Save locally in public/uploads/
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const rawExt = path.extname(file.name || "").toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(rawExt)
      ? rawExt
      : ".jpg";
    const uniqueName = `img-${Date.now()}-${crypto.randomBytes(6).toString("hex")}${safeExt}`;
    const filePath = path.join(uploadsDir, uniqueName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${uniqueName}`;
    return NextResponse.json({
      success: true,
      url: publicUrl,
      provider: "local",
    });
  } catch (error: any) {
    console.error("[upload route] Internal Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Image upload failed" },
      { status: 500 }
    );
  }
}
