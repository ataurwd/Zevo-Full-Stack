/**
 * Universal Image Parser for Products
 * Seamlessly handles string[], { url: string }[], single string, or missing images.
 */

const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=900&auto=format&fit=crop";

export function getProductImageUrl(images: any): string {
  if (!images) return FALLBACK_PRODUCT_IMAGE;

  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    if (typeof first === "string" && first.trim()) return first.trim();
    if (typeof first === "object" && first?.url) return first.url;
  }

  if (typeof images === "string" && images.trim()) {
    return images.trim();
  }

  return FALLBACK_PRODUCT_IMAGE;
}

export function getAllProductImages(images: any): string[] {
  if (!images) return [FALLBACK_PRODUCT_IMAGE];

  if (Array.isArray(images)) {
    const parsed = images
      .map((img) => {
        if (typeof img === "string") return img.trim();
        if (typeof img === "object" && img?.url) return img.url;
        return "";
      })
      .filter(Boolean);

    return parsed.length > 0 ? parsed : [FALLBACK_PRODUCT_IMAGE];
  }

  if (typeof images === "string" && images.trim()) {
    return [images.trim()];
  }

  return [FALLBACK_PRODUCT_IMAGE];
}
