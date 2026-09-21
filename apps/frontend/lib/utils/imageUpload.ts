/**
 * ImgBB Image Upload Utility for Nexora
 * Handles direct upload to ImgBB API with 2MB size limit and max 5 images constraint.
 */

export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_IMAGES_COUNT = 5;
export const DEFAULT_IMGBB_API_KEY = "88bb5a691cfe76f4e760e5de74694655";

export function getImgBBApiKey(): string {
  if (typeof window !== "undefined") {
    const localKey = localStorage.getItem("nexora_imgbb_api_key");
    if (localKey && localKey.trim()) return localKey.trim();
  }
  return process.env.NEXT_PUBLIC_IMGBB_API_KEY?.trim() || DEFAULT_IMGBB_API_KEY;
}

export function setImgBBApiKey(key: string): void {
  if (typeof window !== "undefined") {
    if (key.trim()) {
      localStorage.setItem("nexora_imgbb_api_key", key.trim());
    } else {
      localStorage.removeItem("nexora_imgbb_api_key");
    }
  }
}

export interface ImgBBUploadResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    thumb?: {
      url: string;
    };
  };
  success: boolean;
  status: number;
}

export async function uploadImageToImgBB(
  file: File,
  customApiKey?: string
): Promise<string> {
  // 1. Enforce 2MB size limit
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(
      `File "${file.name}" is ${sizeInMB}MB, which exceeds the maximum allowed size of 2MB.`
    );
  }

  // 2. Resolve ImgBB API Key
  const apiKey = (customApiKey || getImgBBApiKey()).trim();

  // 3. Priority: Upload via Next.js same-origin server route (/api/upload)
  // This completely eliminates browser CORS restrictions and automatically handles fallbacks
  try {
    const formData = new FormData();
    formData.append("file", file);
    if (apiKey && apiKey !== DEFAULT_IMGBB_API_KEY) {
      formData.append("apiKey", apiKey);
    }

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.url) {
        return data.url;
      }
    }
  } catch (proxyError: any) {
    console.warn("[uploadImageToImgBB] /api/upload proxy call failed, checking fallback:", proxyError?.message);
  }

  // 4. Direct ImgBB Upload (if user provided their own valid API key)
  if (apiKey && apiKey !== DEFAULT_IMGBB_API_KEY) {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: "POST",
        body: formData,
      });

      const resJson: ImgBBUploadResponse = await response.json();

      if (response.ok && resJson.success && resJson.data?.url) {
        return resJson.data.display_url || resJson.data.url;
      }

      const errDetail = (resJson as any)?.error?.message || "ImgBB upload error";
      console.warn("[uploadImageToImgBB] Direct ImgBB failed:", errDetail);
    } catch (directErr: any) {
      console.warn("[uploadImageToImgBB] Direct ImgBB network/CORS error:", directErr?.message);
    }
  }

  // 5. Ultimate Fallback: Base64 Data URL so user image never gets lost or blocked
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to process image file"));
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
