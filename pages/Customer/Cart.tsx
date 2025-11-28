import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ArrowRight, CreditCard, MapPin, Plus, Check, X, Phone, User, Home, CheckCircle } from 'lucide-react';
import { useCart, useAuth } from '../../App';
import { Address } from '../../types';
import { CURRENCY } from '../../constants';
import { db } from '../../services/db';

interface CheckoutForm {
    recipientName: string;
    contactNumber: string;
    street: string;
    landmark: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

export const Cart: React.FC = () => {
  const { cart, removeFromCart, clearCart } = useCart();
  const { user, setAuthModalOpen } = useAuth();
  
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>({
    recipientName: '',
    contactNumber: '',
    street: '',
    landmark: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  useEffect(() => {
    if (selectedItems.size === 0 && cart.length > 0) {
        setSelectedItems(new Set(cart.map(item => item._id)));
    }
  }, [cart.length]);

  useEffect(() => {
      if (user) {
          setCheckoutForm(prev => ({
              ...prev,
              recipientName: user.name || '',
              contactNumber: '',
              street: user.address?.street || '',
              landmark: user.address?.landmark || '',
              city: user.address?.city || '',
              state: user.address?.state || '',
              zipCode: user.address?.zipCode || '',
              country: user.address?.country || 'Philippines'
          }));
      }
  }, [user]);

  const toggleItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
        newSelected.delete(id);
    } else {
        newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === cart.length) {
        setSelectedItems(new Set());
    } else {
        setSelectedItems(new Set(cart.map(item => item._id)));
    }
  };

  const cartItemsToCheckout = cart.filter(item => selectedItems.has(item._id));
  const subtotal = cartItemsToCheckout.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * 0.12;
  const total = subtotal + tax;

  const handleCheckoutClick = () => {
      if (!user) {
          setAuthModalOpen(true);
          return;
      }
      if (cartItemsToCheckout.length === 0) {
          alert("Please select items to checkout.");
          return;
      }
      setIsCheckoutModalOpen(true);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
        await db.createOrder({
            userId: user._id,
            customerName: user.name,
            recipientName: checkoutForm.recipientName,
            contactNumber: checkoutForm.contactNumber,
            items: cartItemsToCheckout,
            totalAmount: total,
            shippingAddress: {
                street: checkoutForm.street,
                city: checkoutForm.city,
                state: checkoutForm.state,
                zipCode: checkoutForm.zipCode,
                country: checkoutForm.country,
                landmark: checkoutForm.landmark
            }
        });
        cartItemsToCheckout.forEach(item => removeFromCart(item._id));
        setSelectedItems(new Set());
        setOrderSuccess(true);
        setTimeout(() => {
            setOrderSuccess(false);
            setIsCheckoutModalOpen(false);
        }, 3000);
    } catch (error) {
        alert("Failed to place order. Please try again.");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (cart.length === 0 && !orderSuccess) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-slate-50 rounded-2xl p-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Your cart is empty</h2>
          <p className="text-slate-500 mb-8">Looks like you haven't added any furniture yet.</p>
          <Link 
            to="/"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Shopping Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
                <input 
                    type="checkbox" 
                    checked={cart.length > 0 && selectedItems.size === cart.length}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-sm font-semibold text-slate-700">Select All ({cart.length} items)</span>
            </div>
            <div className="space-y-6">
            {cart.map((item) => (
                <div key={item._id} className={`flex gap-4 p-4 border rounded-xl shadow-sm transition-colors ${selectedItems.has(item._id) ? 'bg-white border-indigo-100 ring-1 ring-indigo-500/20' : 'bg-slate-50 border-slate-100 opacity-70'}`}>
                <div className="flex items-center">
                    <input 
                        type="checkbox" 
                        checked={selectedItems.has(item._id)}
                        onChange={() => toggleItem(item._id)}
                        className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                </div>
                <div className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-slate-900">{item.name}</h3>
                        <p className="text-sm text-slate-500">{item.category}</p>
                    </div>
                    <button 
                        onClick={() => removeFromCart(item._id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-600">Qty: {item.quantity}</span>
                    </div>
                    <div className="font-bold text-slate-900">{CURRENCY}{(item.price * item.quantity).toLocaleString()}</div>
                    </div>
                </div>
                </div>
            ))}
            </div>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-slate-50 p-6 rounded-2xl sticky top-24 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Order Summary</h3>
            <p className="text-xs text-slate-500 mb-4">Summary for {cartItemsToCheckout.length} selected items</p>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{CURRENCY}{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>VAT (12%)</span>
                <span>{CURRENCY}{tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between text-lg font-bold text-slate-900">
                <span>Total</span>
                <span>{CURRENCY}{total.toLocaleString()}</span>
              </div>
            </div>
            <button 
              onClick={handleCheckoutClick}
              disabled={cartItemsToCheckout.length === 0}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Checkout Selected <CreditCard className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
                {orderSuccess ? (
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                            <CheckCircle className="w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Order Placed!</h2>
                        <p className="text-slate-500">Thank you for shopping with ARFurniture.</p>
                    </div>
                ) : (
                    <>
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-indigo-600" /> Checkout Details
                            </h2>
                            <button onClick={() => setIsCheckoutModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <form id="checkoutForm" onSubmit={handlePlaceOrder} className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Contact Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Recipient Name *</label>
                                            <div className="relative">
                                                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                <input
                                                    type="text"
                                                    required
                                                    value={checkoutForm.recipientName}
                                                    onChange={e => setCheckoutForm({ ...checkoutForm, recipientName: e.target.value })}
                                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
                                                    placeholder="Juan Dela Cruz"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Contact Number *</label>
                                            <div className="relative">
                                                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                <input
                                                    type="tel"
                                                    required
                                                    value={checkoutForm.contactNumber}
                                                    onChange={e => setCheckoutForm({ ...checkoutForm, contactNumber: e.target.value })}
                                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
                                                    placeholder="0917 123 4567"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Shipping Address</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Street *</label>
                                            <div className="relative">
                                                <Home className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                <input
                                                    type="text"
                                                    required
                                                    value={checkoutForm.street}
                                                    onChange={e => setCheckoutForm({ ...checkoutForm, street: e.target.value })}
                                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
                                                    placeholder="123 Gen. T. de Leon St."
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Landmark</label>
                                            <div className="relative">
                                                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                <input
                                                    type="text"
                                                    value={checkoutForm.landmark}
                                                    onChange={e => setCheckoutForm({ ...checkoutForm, landmark: e.target.value })}
                                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
                                                    placeholder="Near Valenzuela City Hall"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">City *</label>
                                            <input
                                                type="text"
                                                required
                                                value={checkoutForm.city}
                                                onChange={e => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                                                className="w-full pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
                                                placeholder="Valenzuela"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Province/State *</label>
                                            <input
                                                type="text"
                                                required
                                                value={checkoutForm.state}
                                                onChange={e => setCheckoutForm({ ...checkoutForm, state: e.target.value })}
                                                className="w-full pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
                                                placeholder="Metro Manila"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">ZIP Code *</label>
                                            <input
                                                type="text"
                                                required
                                                value={checkoutForm.zipCode}
                                                onChange={e => setCheckoutForm({ ...checkoutForm, zipCode: e.target.value })}
                                                className="w-full pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
                                                placeholder="1442"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Country *</label>
                                            <input
                                                type="text"
                                                required
                                                value={checkoutForm.country}
                                                onChange={e => setCheckoutForm({ ...checkoutForm, country: e.target.value })}
                                                className="w-full pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
                                                placeholder="Philippines"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                    <button type="button" onClick={() => setIsCheckoutModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
                                    <button type="submit" form="checkoutForm" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50">
                                        {isSubmitting ? 'Placing Order...' : 'Place Order'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
      )}
    </div>
  );
};
