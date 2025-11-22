
// Mongoose-like Schema Definitions

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

export interface Dimensions {
  width: number;
  height: number;
  depth: number;
  unit: 'cm' | 'in';
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string; // Thumbnail/2D image
  arModelUrl: string; // .glb or .gltf URL
  dimensions: Dimensions;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  createdAt: Date;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  _id: string;
  userId: string;
  customerName: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
}

export interface MarketingBanner {
  _id: string;
  title: string;
  subtitle?: string;
  description: string;
  imageUrl: string;
  badgeText?: string;
  buttonText: string;
  link: string;
  isActive: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
}
