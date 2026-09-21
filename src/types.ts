export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: 'Protein' | 'Creatine' | 'Mass Gainer' | 'Pre-workout' | 'Gym Equipment' | 'Accessories';
  inStock: boolean;
  isTrending?: boolean;
  stockCount?: number; // For low-stock notification triggers
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  name: string;
  phone: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'paid' | 'completed';
  timestamp: string; // ISO string
  isArchived?: boolean; // For completed order history archiving
}

export interface GymSettings {
  gymName: string;
  upiId: string;
  whatsappNumber: string;
  logoUrl?: string;
  instagramUrl?: string;
  googleReviewUrl?: string;
}
