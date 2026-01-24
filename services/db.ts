
import { Product, Order, MarketingBanner } from '../types';

// API Base URL - uses the auth server
const API_BASE = (import.meta as any).env?.VITE_AUTH_API_BASE?.replace(/\/$/, '') || 'http://localhost:4000';

// Fallback data for when API is unavailable
const FALLBACK_PRODUCTS: Product[] = [
  {
    _id: '1',
    name: 'Eames Style Lounge Chair',
    description: 'A classic mid-century modern chair. Perfect for lounging and reading in style.',
    price: 18500,
    category: 'Chairs',
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800&q=80',
    arModelUrl: 'products/3dmodels/white_mesh.glb',
    dimensions: { width: 84, height: 84, depth: 85, unit: 'cm' },
    isFeatured: true,
    isNewArrival: false,
    createdAt: new Date(),
  },
];

const FALLBACK_BANNERS: MarketingBanner[] = [
  {
    _id: 'banner-1',
    title: 'Pinoy Craftsmanship Sale',
    subtitle: 'Support Local',
    description: 'Get the best Palochina deals from Valenzuela directly to your home. Up to 30% off.',
    imageUrl: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1200&q=80',
    badgeText: 'SALE',
    buttonText: 'SHOP NOW',
    link: '/',
    isActive: true
  },
];

class Database {
  // =====================
  // PRODUCTS
  // =====================
  async getProducts(): Promise<Product[]> {
    try {
      const res = await fetch(`${API_BASE}/api/products`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      return data.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt)
      }));
    } catch (e) {
      console.warn('Using fallback products:', e);
      return FALLBACK_PRODUCTS;
    }
  }

  async getProductById(id: string): Promise<Product | undefined> {
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}`);
      if (!res.ok) return undefined;
      const data = await res.json();
      return { ...data, createdAt: new Date(data.createdAt) };
    } catch (e) {
      console.warn('Failed to fetch product:', e);
      return FALLBACK_PRODUCTS.find(p => p._id === id);
    }
  }

  async createProduct(product: Omit<Product, '_id' | 'createdAt'>): Promise<Product> {
    const res = await fetch(`${API_BASE}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (!res.ok) throw new Error('Failed to create product');
    const data = await res.json();
    return { ...data, createdAt: new Date(data.createdAt) };
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE}/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update product');
    const data = await res.json();
    return { ...data, createdAt: new Date(data.createdAt) };
  }

  async deleteProduct(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/products/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete product');
  }

  // =====================
  // ORDERS
  // =====================
  async getOrders(): Promise<Order[]> {
    try {
      const res = await fetch(`${API_BASE}/api/orders`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      return data.map((o: any) => ({
        ...o,
        createdAt: new Date(o.createdAt)
      }));
    } catch (e) {
      console.warn('Failed to fetch orders:', e);
      return [];
    }
  }

  async createOrder(order: Omit<Order, '_id' | 'createdAt' | 'status'>): Promise<Order> {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    if (!res.ok) throw new Error('Failed to create order');
    const data = await res.json();
    return { ...data, createdAt: new Date(data.createdAt) };
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update order status');
  }

  // =====================
  // BANNERS
  // =====================
  async getBanners(): Promise<MarketingBanner[]> {
    try {
      const res = await fetch(`${API_BASE}/api/banners`);
      if (!res.ok) throw new Error('Failed to fetch banners');
      return await res.json();
    } catch (e) {
      console.warn('Using fallback banners:', e);
      return FALLBACK_BANNERS;
    }
  }

  async createBanner(banner: Omit<MarketingBanner, '_id'>): Promise<MarketingBanner> {
    const res = await fetch(`${API_BASE}/api/banners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(banner)
    });
    if (!res.ok) throw new Error('Failed to create banner');
    return await res.json();
  }

  async updateBanner(id: string, updates: Partial<MarketingBanner>): Promise<MarketingBanner> {
    const res = await fetch(`${API_BASE}/api/banners/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update banner');
    return await res.json();
  }

  async deleteBanner(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/banners/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete banner');
  }
}

export const db = new Database();
