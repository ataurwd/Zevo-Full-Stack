/**
 * Auto-generates a clean, unique product SKU / Barcode identifier.
 * Format: NX-XXXXXX (e.g. NX-849201)
 * Ideal for barcode scanning, POS sale systems, and hyperlocal logistics.
 */
export function generateProductSKU(prefix: string = "NX"): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${randomNum}`;
}
