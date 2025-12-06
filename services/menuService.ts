// frontend/services/api/menuService.ts

const API_URL = "http://localhost:8000";

export interface PublicRestaurant {
  slug: string;
  name: string;
  tagline: string;
  address: string;
  city: string;
  phone_number: string;
  footer_text: string;
  opening_hours: string;
  logo_url: string;
  cover_url: string;
  theme_color: string;
  is_online: boolean;
}

export interface PublicCategory {
  id: number;
  label: string;
  slug: string;
  display_order: number;
  is_visible: boolean;
}

export interface PublicDish {
  id: number;
  name: string;
  description: string;
  price_cents: number;
  category_id: number;
  image_url: string;
  is_available: boolean;
  display_order: number;
  sub_category: string;
  tags: string[];
}

export interface PublicTable {
  id: number;
  number: number;
  name: string;
}

export interface PublicMenuResponse {
  restaurant: PublicRestaurant;
  table: PublicTable | null;
  categories: PublicCategory[];
  dishes: PublicDish[];
}

export async function getPublicMenu(
  slug: string,
  tableId?: number
): Promise<PublicMenuResponse> {
  const params = new URLSearchParams();
  if (tableId != null) {
    params.set("table", tableId.toString());
  }

  const url = `${API_URL}/api/public/restaurants/${slug}/menu${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }

  return res.json();
}
