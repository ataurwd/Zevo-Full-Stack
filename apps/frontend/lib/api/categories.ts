import { apiFetch } from "./client";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id: string | null;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  children?: CategoryItem[];
}

export async function getCategoryTree(): Promise<CategoryItem[]> {
  const res = await apiFetch<{ success: boolean; data: CategoryItem[] }>("/categories");
  return res.data;
}

export async function getCategoryBySlug(slug: string): Promise<CategoryItem> {
  const res = await apiFetch<{ success: boolean; data: CategoryItem }>(`/categories/${slug}`);
  return res.data;
}

export async function createCategory(data: {
  name: string;
  description?: string;
  parent_id?: string | null;
  image_url?: string;
  sort_order?: number;
}): Promise<CategoryItem> {
  const res = await apiFetch<{ success: boolean; data: CategoryItem }>("/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateCategory(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    parent_id: string | null;
    image_url: string;
    sort_order: number;
    is_active: boolean;
  }>
): Promise<CategoryItem> {
  const res = await apiFetch<{ success: boolean; data: CategoryItem }>(`/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiFetch(`/categories/${id}`, {
    method: "DELETE",
  });
}
