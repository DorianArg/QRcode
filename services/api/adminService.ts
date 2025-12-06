const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

import { Category, Dish, RestaurantProfile } from '../../types';

interface ApiRestaurant {
  name: string;
  address: string;
  city: string;
  phone_number: string;
  tagline: string;
  footer_text?: string;
  opening_hours: string;
  logo_url: string;
  cover_url: string;
  theme_color: string;
  is_online: boolean;
  slug: string;
}

interface ApiCategory {
  id: number;
  label: string;
  slug: string;
  display_order: number;
  is_visible: boolean;
}

interface ApiDish {
  id: number;
  name: string;
  description: string;
  price_cents: number;
  category_id: number;
  image_url?: string;
  is_available: boolean;
  display_order: number;
  sub_category?: string | null;
  tags?: string[] | string | null;
}

const headers = {
  'Content-Type': 'application/json'
};

const parseTags = (tags: ApiDish['tags']): string[] => {
  if (Array.isArray(tags)) return tags.map(String);
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [tags];
    }
  }
  return [];
};

const mapRestaurantFromApi = (data: ApiRestaurant): RestaurantProfile => ({
  name: data.name,
  address: data.address,
  city: data.city,
  phoneNumber: data.phone_number,
  tagline: data.tagline,
  footerText: data.footer_text,
  openingHours: data.opening_hours,
  logoUrl: data.logo_url,
  coverUrl: data.cover_url,
  themeColor: data.theme_color,
  isOnline: data.is_online,
  slug: data.slug
});

const mapRestaurantToApi = (data: RestaurantProfile): ApiRestaurant => ({
  name: data.name,
  address: data.address,
  city: data.city,
  phone_number: data.phoneNumber,
  tagline: data.tagline,
  footer_text: data.footerText || '',
  opening_hours: data.openingHours,
  logo_url: data.logoUrl,
  cover_url: data.coverUrl,
  theme_color: data.themeColor,
  is_online: data.isOnline,
  slug: data.slug
});

const mapCategoryFromApi = (cat: ApiCategory): Category => ({
  id: cat.id.toString(),
  label: cat.label,
  order: cat.display_order,
  isVisible: cat.is_visible,
  slug: cat.slug
});

const mapDishFromApi = (dish: ApiDish): Dish => ({
  id: dish.id.toString(),
  name: dish.name,
  price: dish.price_cents / 100,
  categoryId: dish.category_id.toString(),
  subCategory: dish.sub_category || '',
  description: dish.description || '',
  imageUrl: dish.image_url || '',
  isAvailable: dish.is_available,
  tags: parseTags(dish.tags),
  displayOrder: dish.display_order
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');

const mapDishToApi = (dish: Dish): Omit<ApiDish, 'id'> => ({
  name: dish.name,
  description: dish.description,
  price_cents: Math.round(dish.price * 100),
  category_id: Number(dish.categoryId),
  image_url: dish.imageUrl || '',
  is_available: dish.isAvailable,
  display_order: dish.displayOrder ?? 0,
  sub_category: dish.subCategory || '',
  tags: JSON.stringify(dish.tags || [])
});

const mapCategoryToApi = (cat: Category): Omit<ApiCategory, 'id'> => ({
  label: cat.label,
  slug: cat.slug || slugify(cat.label),
  display_order: cat.order,
  is_visible: cat.isVisible
});

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function getAdminRestaurant(slug: string): Promise<RestaurantProfile> {
  const res = await fetch(`${API_URL}/api/admin/restaurants/${slug}`);
  const data = await handleResponse<ApiRestaurant>(res);
  return mapRestaurantFromApi(data);
}

export async function updateAdminRestaurant(
  slug: string,
  data: RestaurantProfile
): Promise<RestaurantProfile> {
  const res = await fetch(`${API_URL}/api/admin/restaurants/${slug}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(mapRestaurantToApi(data))
  });
  const payload = await handleResponse<ApiRestaurant>(res);
  return mapRestaurantFromApi(payload);
}

export async function getAdminCategories(slug: string): Promise<Category[]> {
  const res = await fetch(`${API_URL}/api/admin/restaurants/${slug}/categories`);
  const data = await handleResponse<ApiCategory[]>(res);
  return data.map(mapCategoryFromApi);
}

export async function createAdminCategory(
  slug: string,
  payload: { label: string; slug: string; display_order: number; is_visible: boolean }
): Promise<Category> {
  const res = await fetch(`${API_URL}/api/admin/restaurants/${slug}/categories`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  const data = await handleResponse<ApiCategory>(res);
  return mapCategoryFromApi(data);
}

export async function updateAdminCategory(
  categoryId: number,
  payload: { label: string; slug: string; display_order: number; is_visible: boolean }
): Promise<Category> {
  const res = await fetch(`${API_URL}/api/admin/categories/${categoryId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload)
  });
  const data = await handleResponse<ApiCategory>(res);
  return mapCategoryFromApi(data);
}

export async function deleteAdminCategory(categoryId: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/categories/${categoryId}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `API error ${res.status}`);
  }
}

export async function getAdminDishes(slug: string): Promise<Dish[]> {
  const res = await fetch(`${API_URL}/api/admin/restaurants/${slug}/dishes`);
  const data = await handleResponse<ApiDish[]>(res);
  return data.map(mapDishFromApi);
}

export async function createAdminDish(slug: string, payload: Dish): Promise<Dish> {
  const res = await fetch(`${API_URL}/api/admin/restaurants/${slug}/dishes`, {
    method: 'POST',
    headers,
    body: JSON.stringify(mapDishToApi(payload))
  });
  const data = await handleResponse<ApiDish>(res);
  return mapDishFromApi(data);
}

export async function updateAdminDish(dishId: number, payload: Dish): Promise<Dish> {
  const res = await fetch(`${API_URL}/api/admin/dishes/${dishId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(mapDishToApi(payload))
  });
  const data = await handleResponse<ApiDish>(res);
  return mapDishFromApi(data);
}

export async function deleteAdminDish(dishId: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/dishes/${dishId}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `API error ${res.status}`);
  }
}

export { slugify };
