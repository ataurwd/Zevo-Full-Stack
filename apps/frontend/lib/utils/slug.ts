/**
 * Generates an SEO-friendly slug from a product name.
 * e.g. "Potato 1 kg price" -> "potato-1-kg-price"
 */
export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Returns the SEO-friendly URL path for a product based on its slug or name.
 * e.g. /products/potato-1-kg-price or /products/organic-potato
 * Fallback to /products/:id only if name and slug are absent.
 */
export function getProductUrl(product: {
  id?: string;
  _id?: string;
  slug?: string;
  name?: string;
}): string {
  if (!product) return "/products";

  if (product.slug && product.slug.trim()) {
    return `/products/${encodeURIComponent(product.slug.trim())}`;
  }

  if (product.name && product.name.trim()) {
    const s = slugify(product.name);
    if (s) {
      return `/products/${encodeURIComponent(s)}`;
    }
  }

  const id = product.id || product._id || "";
  return id ? `/products/${id}` : "/products";
}
