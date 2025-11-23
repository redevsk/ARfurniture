
import { Product, Order, UserRole, MarketingBanner } from '../types';

// Mock Data simulating a MongoDB database state
const INITIAL_PRODUCTS: Product[] = [
  {
    _id: '1',
    name: 'Eames Style Lounge Chair',
    description: 'A classic mid-century modern chair. Perfect for lounging and reading in style.',
    price: 18500,
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
    price: 24999,
    category: 'Sofas',
    stock: 8,
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1550226891-ef816aed4a98?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80'
    ],
    // UPDATED: Dummy AR from web (Astronaut)
    arModelUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb', 
    dimensions: { width: 200, height: 80, depth: 90, unit: 'cm' },
    isFeatured: true,
    isNewArrival: true,
    createdAt: new Date(),
  },
  {
    _id: '3',
    name: 'Rustic Palochina Bed Frame',
    description: 'Handcrafted from upcycled Palochina wood. Durable, sustainable, and adds a warm rustic vibe to your bedroom. Proudly made in Valenzuela.',
    price: 8500,
    category: 'Beds',
    stock: 12,
    imageUrl: 'https://images.unsplash.com/photo-1505693416388-b0346efee958?auto=format&fit=crop&w=800&q=80',
    arModelUrl: 'https://modelviewer.dev/shared-assets/models/Canoe.glb', // Placeholder model
    dimensions: { width: 152, height: 40, depth: 198, unit: 'cm' },
    isFeatured: true,
    isNewArrival: true,
    createdAt: new Date(),
  },
  {
    _id: '4',
    name: 'Industrial Coffee Table',
    description: 'Solid wood top with metal legs. Adds a rustic touch to any living room.',
    price: 4500,
    category: 'Tables',
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=800&q=80',
    arModelUrl: 'https://modelviewer.dev/shared-assets/models/Mixer.glb', 
    dimensions: { width: 110, height: 45, depth: 60, unit: 'cm' },
    isFeatured: false,
    isNewArrival: false,
    createdAt: new Date(),
  },
  {
    _id: '5',
    name: 'Palochina Multi-Rack',
    description: 'Versatile 3-layer rack made from smooth-finished Palochina. Perfect for plants, books, or kitchen display.',
    price: 1200,
    category: 'Decor',
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
    arModelUrl: 'https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb', 
    dimensions: { width: 60, height: 90, depth: 30, unit: 'cm' },
    isFeatured: false,
    isNewArrival: true,
    createdAt: new Date(),
  }
];

const INITIAL_BANNERS: MarketingBanner[] = [
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
  {
    _id: 'banner-2',
    title: 'Modern Work from Home',
    subtitle: 'Work in Style',
    description: 'Transform your home office with ergonomic chairs and sleek desks.',
    imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
    badgeText: 'NEW',
    buttonText: 'EXPLORE',
    link: '/',
    isActive: true
  },
  {
    _id: 'banner-3',
    title: 'Minimalist Dining Sets',
    subtitle: 'Salo-Salo Together',
    description: 'Clean lines and natural materials for the perfect family feast.',
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
    customerName: 'Maria Santos',
    recipientName: 'Maria Santos',
    contactNumber: '0917-123-4567',
    items: [{ ...INITIAL_PRODUCTS[0], quantity: 1 }],
    totalAmount: 18500,
    shippingAddress: {
        street: '123 Gen. T. de Leon',
        city: 'Valenzuela City',
        state: 'Metro Manila',
        zipCode: '1442',
        country: 'Philippines',
        landmark: 'Near Barangay Hall'
    },
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), 
  },
  {
    _id: 'ord-2838',
    userId: 'usr-102',
    customerName: 'Juan Dela Cruz',
    recipientName: 'Juan Dela Cruz',
    contactNumber: '0918-987-6543',
    items: [{ ...INITIAL_PRODUCTS[4], quantity: 2 }, { ...INITIAL_PRODUCTS[2], quantity: 1 }],
    totalAmount: 10900,
    shippingAddress: {
        street: '456 Maysan Road',
        city: 'Valenzuela City',
        state: 'Metro Manila',
        zipCode: '1440',
        country: 'Philippines',
        landmark: 'Beside Shell Station'
    },
    status: 'shipped',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), 
  },
  {
    _id: 'ord-2837',
    userId: 'usr-103',
    customerName: 'Grace Reyes',
    recipientName: 'Lola Remedios',
    contactNumber: '0920-555-4444',
    items: [{ ...INITIAL_PRODUCTS[1], quantity: 1 }],
    totalAmount: 24999,
    shippingAddress: {
        street: '789 MacArthur Highway',
        city: 'Valenzuela City',
        state: 'Metro Manila',
        zipCode: '1441',
        country: 'Philippines',
        landmark: 'Front of SM Valenzuela'
    },
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

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    return new Promise((resolve, reject) => {
        const index = this.products.findIndex(p => p._id === id);
        if (index !== -1) {
            this.products[index] = { ...this.products[index], ...updates };
            resolve(this.products[index]);
        } else {
            reject(new Error("Product not found"));
        }
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
        _id: 'ord-' + Math.random().toString(36).substring(7).substr(0,4),
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

  async updateBanner(id: string, updates: Partial<MarketingBanner>): Promise<MarketingBanner> {
    return new Promise((resolve, reject) => {
        const index = this.banners.findIndex(b => b._id === id);
        if (index !== -1) {
            this.banners[index] = { ...this.banners[index], ...updates };
            resolve(this.banners[index]);
        } else {
            reject(new Error("Banner not found"));
        }
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
