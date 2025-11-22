
import { Product, Order, UserRole, MarketingBanner } from '../types';

// Mock Data simulating a MongoDB database state
const INITIAL_PRODUCTS: Product[] = [
  {
    _id: '1',
    name: 'Eames Lounge Chair',
    description: 'A classic mid-century modern chair. Perfect for lounging and reading in style.',
    price: 1299,
    category: 'Chairs',
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800&q=80',
    arModelUrl: 'https://modelviewer.dev/shared-assets/models/Chair.glb',
    dimensions: { width: 84, height: 84, depth: 85, unit: 'cm' },
    isFeatured: true,
    isNewArrival: false,
    createdAt: new Date(),
  },
  {
    _id: '2',
    name: 'Modern Fabric Sofa',
    description: 'Minimalist grey fabric sofa. Generous seating with a sleek profile.',
    price: 899,
    category: 'Sofas',
    stock: 8,
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    arModelUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb', 
    dimensions: { width: 200, height: 80, depth: 90, unit: 'cm' },
    isFeatured: true,
    isNewArrival: true,
    createdAt: new Date(),
  },
  {
    _id: '3',
    name: 'Industrial Coffee Table',
    description: 'Solid wood top with metal legs. Adds a rustic touch to any living room.',
    price: 249,
    category: 'Tables',
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=800&q=80',
    arModelUrl: 'https://modelviewer.dev/shared-assets/models/Mixer.glb', 
    dimensions: { width: 110, height: 45, depth: 60, unit: 'cm' },
    isFeatured: false,
    isNewArrival: true,
    createdAt: new Date(),
  },
  {
    _id: '4',
    name: 'Ceramic Vase Set',
    description: 'Handcrafted ceramic vases. Elegant decor for shelves and tables.',
    price: 89,
    category: 'Decor',
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1581783342308-f792ca438977?auto=format&fit=crop&w=800&q=80',
    arModelUrl: 'https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb', 
    dimensions: { width: 20, height: 30, depth: 20, unit: 'cm' },
    isFeatured: false,
    isNewArrival: false,
    createdAt: new Date(),
  }
];

const INITIAL_BANNERS: MarketingBanner[] = [
  {
    _id: 'banner-1',
    title: 'The Classic Living Room on Sale',
    subtitle: 'Get The Look',
    description: 'Elevate your lounging—shop sumptuous sofas and timeless design, up to 50% off.',
    imageUrl: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1200&q=80',
    badgeText: 'SALE',
    buttonText: 'SHOP NOW',
    link: '/',
    isActive: true
  },
  {
    _id: 'banner-2',
    title: 'Modern Workspace Essentials',
    subtitle: 'Work in Style',
    description: 'Transform your home office with ergonomic chairs and sleek desks designed for productivity.',
    imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
    badgeText: 'NEW',
    buttonText: 'EXPLORE',
    link: '/',
    isActive: true
  },
  {
    _id: 'banner-3',
    title: 'Minimalist Dining Collection',
    subtitle: 'Gather Together',
    description: 'Clean lines and natural materials for the perfect dining experience.',
    imageUrl: 'https://images.unsplash.com/photo-1617103996702-96ff29b1c467?auto=format&fit=crop&w=1200&q=80',
    badgeText: 'TRENDING',
    buttonText: 'VIEW SETS',
    link: '/',
    isActive: true
  }
];

const INITIAL_ORDERS: Order[] = [
  {
    _id: 'ord-2839',
    userId: 'usr-101',
    customerName: 'Sarah Jenkins',
    items: [{ ...INITIAL_PRODUCTS[0], quantity: 1 }],
    totalAmount: 1299,
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), 
  },
  {
    _id: 'ord-2838',
    userId: 'usr-102',
    customerName: 'Michael Chen',
    items: [{ ...INITIAL_PRODUCTS[3], quantity: 2 }, { ...INITIAL_PRODUCTS[2], quantity: 1 }],
    totalAmount: 427,
    status: 'shipped',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), 
  },
  {
    _id: 'ord-2837',
    userId: 'usr-103',
    customerName: 'Emma Wilson',
    items: [{ ...INITIAL_PRODUCTS[1], quantity: 1 }],
    totalAmount: 899,
    status: 'delivered',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), 
  }
];

class MockDatabase {
  private products: Product[] = [...INITIAL_PRODUCTS];
  private orders: Order[] = [...INITIAL_ORDERS];
  private banners: MarketingBanner[] = [...INITIAL_BANNERS];

  // --- Products ---
  async getProducts(): Promise<Product[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...this.products]), 300);
    });
  }

  async getProductById(id: string): Promise<Product | undefined> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(this.products.find(p => p._id === id)), 200);
    });
  }

  async createProduct(product: Omit<Product, '_id' | 'createdAt'>): Promise<Product> {
    return new Promise((resolve) => {
      const newProduct: Product = {
        ...product,
        _id: Math.random().toString(36).substring(7),
        createdAt: new Date(),
      };
      this.products.push(newProduct);
      resolve(newProduct);
    });
  }

  async deleteProduct(id: string): Promise<void> {
    return new Promise((resolve) => {
      this.products = this.products.filter(p => p._id !== id);
      resolve();
    });
  }

  // --- Orders ---
  async createOrder(order: Omit<Order, '_id' | 'createdAt' | 'status'>): Promise<Order> {
    return new Promise((resolve) => {
      const newOrder: Order = {
        ...order,
        _id: Math.random().toString(36).substring(7),
        status: 'pending',
        createdAt: new Date(),
      };
      this.orders.unshift(newOrder); 
      resolve(newOrder);
    });
  }

  async getOrders(): Promise<Order[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...this.orders]), 300);
    });
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
      return new Promise((resolve) => {
          this.orders = this.orders.map(order => 
            order._id === orderId ? { ...order, status } : order
          );
          resolve();
      });
  }

  // --- Banners ---
  async getBanners(): Promise<MarketingBanner[]> {
    return new Promise((resolve) => {
        setTimeout(() => resolve([...this.banners]), 300);
    });
  }

  async createBanner(banner: Omit<MarketingBanner, '_id'>): Promise<MarketingBanner> {
    return new Promise((resolve) => {
        const newBanner = { ...banner, _id: Math.random().toString(36).substring(7) };
        this.banners.push(newBanner);
        resolve(newBanner);
    });
  }

  async deleteBanner(id: string): Promise<void> {
      return new Promise((resolve) => {
          this.banners = this.banners.filter(b => b._id !== id);
          resolve();
      });
  }
}

export const db = new MockDatabase();
