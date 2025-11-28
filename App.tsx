import React, { useState, useContext, createContext, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Shop } from './pages/Customer/Shop';
import { ProductDetail } from './pages/Customer/ProductDetail';
import { Cart } from './pages/Customer/Cart';
import { About } from './pages/Customer/About';
import { AdminDashboard } from './pages/Admin/Dashboard';
import { ProductManager } from './pages/Admin/ProductManager';
import { OrderManagement } from './pages/Admin/OrderManagement';
import { MarketingManager } from './pages/Admin/MarketingManager';
import { AdminLogin } from './pages/Admin/AdminLogin.tsx';
import { UserRole, CartItem, Product, User, Address } from './types';
import { loginUser, registerUser, updateUserAddress, loginAdmin } from './services/auth';

// --- Context Definitions ---

interface AuthContextType {
  user: User | null;
  userLogin: (email: string, pass: string) => Promise<User>;
  adminLogin: (identifier: string, pass: string) => Promise<User>;
  signup: (fname: string, lname: string, email: string, pass: string, mname?: string) => Promise<User>;
  logout: () => void;
  updateAddress: (address: Address) => Promise<void>;
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

// --- App Routes Wrapper Component ---
const AppRoutes: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect authenticated admins from login page to dashboard
  useEffect(() => {
    if (user?.role === UserRole.ADMIN && location.pathname === '/admin/login') {
      navigate('/admin', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  return (
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
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Customer login only
  const handleUserLogin = async (email: string, pass: string) => {
    const customer = await loginUser(email, pass);
    setUser(customer);
    return customer;
  };

  // Admin login only
  const handleAdminLogin = async (identifier: string, pass: string) => {
    const admin = await loginAdmin(identifier, pass);
    setUser(admin);
    return admin;
  };

  const handleSignup = async (fname: string, lname: string, email: string, pass: string, mname = '') => {
    const user = await registerUser(fname, lname, email, pass, mname);
    setUser(user);
    return user;
  };

  const handleLogout = () => {
    setUser(null);
    setCart([]); // Optional: clear cart on logout
  };

  const handleUpdateAddress = async (address: Address) => {
    if (user) {
      await updateUserAddress(user._id, address);
      setUser({ ...user, address });
    }
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
      userLogin: handleUserLogin,
      adminLogin: handleAdminLogin,
      signup: handleSignup,
      logout: handleLogout,
      updateAddress: handleUpdateAddress,
      isAuthModalOpen,
      setAuthModalOpen
    }}>
      <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
        <Router>
          <AppRoutes />
        </Router>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
};

export default App;
