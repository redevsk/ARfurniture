
import React, { useState, useContext, createContext, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Shop } from './pages/Customer/Shop';
import { ProductDetail } from './pages/Customer/ProductDetail';
import { Cart } from './pages/Cart';
import { About } from './pages/About';
import { AdminDashboard } from './pages/Admin/Dashboard';
import { ProductManager } from './pages/Admin/ProductManager';
import { OrderManagement } from './pages/Admin/OrderManagement';
import { MarketingManager } from './pages/Admin/MarketingManager';
import { AdminLogin } from './pages/Admin/AdminLogin';
import { UserRole, CartItem, Product, User } from './types';
import { loginUser, registerUser } from './services/auth';

// --- Context Definitions ---

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<User>;
  signup: (name: string, email: string, pass: string) => Promise<User>;
  logout: () => void;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (isOpen: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

// --- Main App Component ---

const App: React.FC = () => {
  // State for User
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  
  // State for Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Auth Handlers
  const handleLogin = async (email: string, pass: string) => {
    const user = await loginUser(email, pass);
    setUser(user);
    return user;
  };

  const handleSignup = async (name: string, email: string, pass: string) => {
    const user = await registerUser(name, email, pass);
    setUser(user);
    return user;
  };

  const handleLogout = () => {
    setUser(null);
    setCart([]); // Optional: clear cart on logout
  };

  // Cart Handlers
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item._id === product._id);
      if (existing) {
        return prev.map(item => 
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item._id !== id));
  };

  const clearCart = () => setCart([]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login: handleLogin, 
      signup: handleSignup, 
      logout: handleLogout,
      isAuthModalOpen,
      setAuthModalOpen
    }}>
      <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
        <Router>
          <Routes>
            {/* Admin Login (No Layout) */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Main Layout Routes */}
            <Route path="*" element={
              <Layout>
                <Routes>
                  {/* Customer Routes */}
                  <Route path="/" element={<Shop />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />

                  {/* Admin Routes */}
                  <Route path="/admin" element={
                    user?.role === UserRole.ADMIN ? <AdminDashboard /> : <Navigate to="/admin/login" replace />
                  } />
                  <Route path="/admin/products" element={
                    user?.role === UserRole.ADMIN ? <ProductManager /> : <Navigate to="/admin/login" replace />
                  } />
                  <Route path="/admin/orders" element={
                    user?.role === UserRole.ADMIN ? <OrderManagement /> : <Navigate to="/admin/login" replace />
                  } />
                  <Route path="/admin/marketing" element={
                    user?.role === UserRole.ADMIN ? <MarketingManager /> : <Navigate to="/admin/login" replace />
                  } />
                  
                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </Layout>
            } />
          </Routes>
        </Router>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
};

export default App;
