
// Mongoose-like Schema Definitions

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum AdminRole {
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
}

export interface Dimensions {
  width: number;
  height: number;
  depth: number;
  unit: 'cm' | 'in';
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  landmark?: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string; // Thumbnail/2D image
  images?: string[]; // Array of additional images
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
  recipientName: string;     // Added
  contactNumber: string;     // Added
  items: CartItem[];
  totalAmount: number;
  shippingAddress?: Address;
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
  address?: Address;
}

export interface DbUser {
  _id?: string;
  email: string;
  password: string;
  fname: string;
  mname?: string;
  lname: string;
  contactNumber: string;
  address: Address[];
}

export interface DbAdmin {
  _id?: string;
  fname: string;
  mname?: string;
  lname: string;
  email: string;
  username: string;
  password: string;
  role: AdminRole;
}
