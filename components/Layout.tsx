import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag, Menu, X, Hexagon, User as UserIcon, LogOut, LogIn, Search, Heart } from 'lucide-react';
import { UserRole } from '../types';
import { APP_NAME, NAV_ITEMS_ADMIN } from '../constants';
import { useCart, useAuth } from '../App';
import { AuthModal } from './AuthModal';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cart } = useCart();
  const { user, logout, setAuthModalOpen, isAuthModalOpen } = useAuth();
  
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');

  const isAdmin = user?.role === UserRole.ADMIN;
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/?q=${encodeURIComponent(searchInput)}`);
  };

  const handleCategoryClick = (category: string) => {
    navigate(`/?category=${encodeURIComponent(category)}`);
  };

  // Categories for the secondary nav
  const SHOP_CATEGORIES = [
    { label: 'Home', action: () => navigate('/') },
    { label: 'New Arrivals', action: () => navigate('/?filter=new') },
    { label: 'Featured', action: () => navigate('/?filter=featured') },
    { label: 'Chairs', action: () => handleCategoryClick('Chairs') },
    { label: 'Sofas', action: () => handleCategoryClick('Sofas') },
    { label: 'Tables', action: () => handleCategoryClick('Tables') },
    { label: 'Decor', action: () => handleCategoryClick('Decor') },
    { label: 'Sale', action: () => navigate('/?filter=sale') },
    { label: 'About Us', action: () => navigate('/about') },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header Wrapper */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        
        {/* TOP ROW: Logo, Search, User Actions */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 gap-8">
            
            {/* 1. Logo (Retained Original Style) */}
            <div className="flex-shrink-0">
              <Link to={isAdmin ? "/admin" : "/"} className="flex items-center gap-2 group">
                 <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-600 rounded-lg group-hover:bg-indigo-700 transition-colors">
                      <Hexagon className="w-6 h-6 text-white fill-current" />
                    </div>
                    <span className="text-xl font-bold text-slate-900 tracking-tight">
                        {isAdmin ? 'Admin' : APP_NAME}
                    </span>
                 </div>
              </Link>
            </div>

            {/* 2. Central Search Bar (Customer Only) */}
            {!isAdmin && (
              <div className="flex-1 max-w-2xl hidden md:block">
                <form onSubmit={handleSearch} className="relative w-full">
                  <input 
                    type="text" 
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search products, brands, and styles" 
                    className="w-full h-11 pl-6 pr-12 rounded-full border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all"
                  />
                  <button 
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </form>
              </div>
            )}

            {/* 3. Right Icons */}
            <div className="flex items-center gap-4 sm:gap-6">
              
              {/* Admin Nav Links */}
              {isAdmin && (
                 <div className="hidden md:flex items-center gap-4">
                    {NAV_ITEMS_ADMIN.map(item => (
                        <Link key={item.path} to={item.path} className={`text-sm font-medium hover:text-indigo-600 ${location.pathname === item.path ? 'text-indigo-600' : 'text-slate-600'}`}>
                            {item.label}
                        </Link>
                    ))}
                 </div>
              )}

              {/* User/Auth */}
              {user ? (
                <div className="relative group flex items-center cursor-pointer">
                  <div className="flex items-center gap-2 text-slate-700 hover:text-indigo-600 transition-colors">
                     <span className="hidden sm:block text-sm font-medium">{user.name}</span>
                     <UserIcon className="w-6 h-6" />
                  </div>
                  {/* Dropdown */}
                  <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="bg-white rounded-lg shadow-xl border border-slate-100 p-2 w-48">
                          <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-100 mb-1">
                              Signed in as <br/><strong className="text-slate-900">{user.email}</strong>
                          </div>
                          <button 
                            onClick={logout} 
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center gap-2"
                          >
                              <LogOut className="w-4 h-4" /> Log Out
                          </button>
                      </div>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setAuthModalOpen(true)} 
                  className="flex items-center gap-1 text-slate-700 hover:text-indigo-600 transition-colors"
                >
                  <span className="hidden sm:block text-sm font-medium">Log In</span>
                  <UserIcon className="w-6 h-6" />
                </button>
              )}

              {/* Favorites (Visual Only) */}
              {!isAdmin && (
                  <button className="text-slate-700 hover:text-indigo-600 transition-colors relative group">
                      <Heart className="w-6 h-6" />
                  </button>
              )}

              {/* Cart */}
              {!isAdmin && (
                <Link to="/cart" className="text-slate-700 hover:text-indigo-600 transition-colors relative">
                  <ShoppingBag className="w-6 h-6" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center ring-2 ring-white">
                      {cartItemCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-1 text-slate-700 hover:text-indigo-600"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: Secondary Navigation (Customer Only) */}
        {!isAdmin && (
            <div className="hidden md:block border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex justify-center items-center space-x-8 h-12">
                        {SHOP_CATEGORIES.map((cat) => (
                            <button
                                key={cat.label}
                                onClick={cat.action}
                                className="text-sm font-medium tracking-wide text-slate-600 hover:text-indigo-600 hover:underline decoration-2 underline-offset-4 transition-all"
                            >
                                {cat.label}
                            </button>
                        ))}
                        <span className="h-4 w-px bg-slate-300 mx-2"></span>
                        <Link to="/" className="text-sm font-medium tracking-wide text-indigo-600 hover:underline decoration-2 underline-offset-4">
                            All Products
                        </Link>
                    </nav>
                </div>
            </div>
        )}

        {/* Mobile Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 shadow-lg absolute w-full left-0 z-50">
            <div className="px-4 py-4 space-y-1">
              
              {/* Mobile Search */}
              {!isAdmin && (
                  <form onSubmit={(e) => { handleSearch(e); setIsMobileMenuOpen(false); }} className="mb-4 relative">
                      <input 
                        type="text" 
                        placeholder="Search..." 
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="w-full p-2 pl-4 pr-10 rounded-lg border border-slate-300 bg-slate-50"
                      />
                      <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <Search className="w-4 h-4" />
                      </button>
                  </form>
              )}

              {isAdmin ? (
                   NAV_ITEMS_ADMIN.map(item => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-3 py-3 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {item.label}
                      </Link>
                   ))
              ) : (
                  SHOP_CATEGORIES.map(cat => (
                      <button
                        key={cat.label}
                        onClick={() => { cat.action(); setIsMobileMenuOpen(false); }}
                        className="block w-full text-left px-3 py-3 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                      >
                        {cat.label}
                      </button>
                  ))
              )}
              
              <div className="border-t border-slate-100 my-2 pt-2">
                {user ? (
                   <button
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-3 text-red-600 font-medium hover:bg-red-50 rounded-lg"
                  >
                    <LogOut className="w-5 h-5" /> Logout
                  </button>
                ) : (
                  <button
                    onClick={() => { setAuthModalOpen(true); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-3 text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg"
                  >
                    <LogIn className="w-5 h-5" /> Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Global Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 mt-auto border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4 text-white">
                 <div className="p-1.5 bg-indigo-600 rounded-md">
                    <Hexagon className="w-5 h-5 text-white fill-current" />
                 </div>
                 <span className="text-2xl font-bold">{APP_NAME}</span>
              </div>
              <p className="text-slate-500 max-w-sm">
                The premier destination for AR-enabled furniture shopping. Visualize perfection in your home before you buy.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="hover:text-white transition-colors">New Arrivals</Link></li>
                <li><Link to="/?filter=sale" className="hover:text-white transition-colors">Sale</Link></li>
                <li><Link to="/cart" className="hover:text-white transition-colors">My Cart</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Admin</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/admin/login" className="hover:text-white transition-colors">Admin Login</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
            <p>© 2024 {APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
