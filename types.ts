
export interface Category {
  id: string;
  label: string;
  order: number;
  isVisible: boolean;
}

export interface Dish {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  subCategory?: string; // New field for grouping
  description: string;
  imageUrl?: string;
  isAvailable: boolean;
  tags: string[];
}

export interface RestaurantProfile {
  name: string;
  address: string;
  city: string;
  phoneNumber: string; 
  tagline: string;
  footerText?: string; // New field
  openingHours: string;
  logoUrl: string;
  coverUrl: string;
  themeColor: string;
  isOnline: boolean;
  slug: string; // New field for URL generation
}

export interface CartItem extends Dish {
  cartId: string; // Unique ID for this instance in cart
  quantity: number;
}

export type TableStatus = 'FREE' | 'OCCUPIED' | 'PARTIAL' | 'PAID';

export interface TableSession {
  tableId: number;
  status: TableStatus;
  items: CartItem[]; // Items ordered at this table
  totalAmount: number;
  paidAmount: number;
  startTime: number;
}

export type ViewMode = 'ADMIN' | 'CUSTOMER';
export type AdminSection = 'DASHBOARD' | 'PROFILE' | 'MENU' | 'QR' | 'ORDERS';

// Initial Data
export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat_1', label: 'Entrées', order: 0, isVisible: true },
  { id: 'cat_2', label: 'Plats', order: 1, isVisible: true },
  { id: 'cat_3', label: 'Desserts', order: 2, isVisible: true },
  { id: 'cat_4', label: 'Boissons', order: 3, isVisible: true },
];

export const INITIAL_DISHES: Dish[] = [
  {
    id: '1',
    name: 'Assiette de Charcuterie',
    price: 18,
    categoryId: 'cat_1',
    subCategory: 'A partager',
    description: 'Assortiment de coppa, lonzu et prisuttu avec confiture de figues.',
    imageUrl: 'https://images.unsplash.com/photo-1546252981-d41372b64005?auto=format&fit=crop&q=80&w=600',
    isAvailable: true,
    tags: ['Local']
  },
  {
    id: '2',
    name: 'Civet de Sanglier',
    price: 24,
    categoryId: 'cat_2',
    subCategory: 'Viandes',
    description: 'Mijoté au vin rouge, servi avec polenta crémeuse.',
    imageUrl: 'https://images.unsplash.com/photo-1606502973842-f64bc2f854cf?auto=format&fit=crop&q=80&w=600',
    isAvailable: true,
    tags: ['Chef\'s Choice']
  },
  {
    id: '3',
    name: 'Fiadone',
    price: 9,
    categoryId: 'cat_3',
    subCategory: 'Classiques',
    description: 'Gâteau traditionnel au brocciu et citron.',
    imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&q=80&w=600',
    isAvailable: true,
    tags: ['Végétarien', 'Sans Gluten']
  },
  {
    id: '4',
    name: 'Pietra',
    price: 6,
    categoryId: 'cat_4',
    subCategory: 'Bières',
    description: 'Bière ambrée à la châtaigne, 33cl.',
    imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&q=80&w=600',
    isAvailable: true,
    tags: []
  }
];

export const DEFAULT_PROFILE: RestaurantProfile = {
  name: "La Table Corse",
  tagline: "Cuisine traditionnelle & Saveurs du terroir",
  address: "12 Rue Paoli",
  city: "Bonifacio",
  phoneNumber: "04 95 12 34 56",
  footerText: "Merci de votre visite !\nProduits frais et locaux.",
  openingHours: "Mar-Dim: 12h - 22h",
  logoUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=150&h=150",
  coverUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1200",
  themeColor: "#e11d48", // Primary Rose
  isOnline: true,
  slug: "demo-1"
};

export const AVAILABLE_TAGS = ['Végétarien', 'Végan', 'Sans Gluten', 'Épicé', 'Local', 'Bio', 'Chef\'s Choice'];
